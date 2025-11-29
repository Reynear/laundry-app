import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { appointments, machines } from "../../../db/schema/schema";

/**
 * Checks if machines of a specific type exist in a hall.
 */
async function checkMachinesExist(
	hallId: number,
): Promise<{ hasWashers: boolean; hasDryers: boolean }> {
	const [washerCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(machines)
		.where(
			and(
				eq(machines.hallId, hallId),
				eq(machines.type, "washer"),
				eq(machines.status, "available"),
			),
		);

	const [dryerCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(machines)
		.where(
			and(
				eq(machines.hallId, hallId),
				eq(machines.type, "dryer"),
				eq(machines.status, "available"),
			),
		);

	return {
		hasWashers: Number(washerCount?.count || 0) > 0,
		hasDryers: Number(dryerCount?.count || 0) > 0,
	};
}

/**
 * Generates time slots based on hall operating hours and DB-backed machine duration.
 * Internal function - uses actual machine durations from database.
 */
function generateTimeSlots(
	hall: { openingTime: string; closingTime: string },
	durationMins: number,
	selectedDate: Date,
	serverTime: Date,
): string[] {
	const slots: string[] = [];
	const [openHour, openMinute] = hall.openingTime.split(":").map(Number);
	const [closeHour, closeMinute] = hall.closingTime.split(":").map(Number);

	const openTime = new Date(selectedDate);
	openTime.setHours(openHour, openMinute, 0, 0);

	const closeTime = new Date(selectedDate);
	closeTime.setHours(closeHour, closeMinute, 0, 0);

	const currentTime = new Date(openTime);

	while (currentTime < closeTime) {
		// Check if the slot + duration fits within closing time
		const slotEndTime = new Date(currentTime.getTime() + durationMins * 60000);

		// Filter out past times if selected date is today
		const isPast = currentTime <= serverTime;

		if (slotEndTime <= closeTime && !isPast) {
			slots.push(
				currentTime.toLocaleTimeString([], {
					hour: "numeric",
					minute: "2-digit",
				}),
			);
		}

		// Increment by 15 mins for flexibility
		currentTime.setMinutes(currentTime.getMinutes() + 15);
	}

	return slots;
}

export type SlotsResult = {
	slots: string[];
	machineError?: string;
};

/**
 * Computes available time slots by validating machine availability and working hours.
 */
export async function getAvailableSlots(
	hall: { id: number; openingTime: string; closingTime: string },
	date: Date,
	serviceType: "wash" | "dry" | "wash_dry",
	loadCount: number,
): Promise<SlotsResult> {
	// First check if required machines exist in the hall
	const { hasWashers, hasDryers } = await checkMachinesExist(hall.id);

	// Check for machine existence based on service type
	if (serviceType === "wash" && !hasWashers) {
		return { slots: [], machineError: "No washers available in this hall" };
	}
	if (serviceType === "dry" && !hasDryers) {
		return { slots: [], machineError: "No dryers available in this hall" };
	}
	if (serviceType === "wash_dry") {
		if (!hasWashers && !hasDryers) {
			return {
				slots: [],
				machineError: "No washers or dryers available in this hall",
			};
		}
		if (!hasWashers) {
			return { slots: [], machineError: "No washers available in this hall" };
		}
		if (!hasDryers) {
			return { slots: [], machineError: "No dryers available in this hall" };
		}
	}

	// Fetch machine durations from DB
	const washDuration = await getMachineDuration(hall.id, "washer");
	const dryDuration = await getMachineDuration(hall.id, "dryer");

	// Calculate total duration based on service type using DB values
	let totalDuration: number;
	if (serviceType === "wash") {
		totalDuration = washDuration;
	} else if (serviceType === "dry") {
		totalDuration = dryDuration;
	} else {
		// wash_dry: sequential wash then dry
		totalDuration = washDuration + dryDuration;
	}

	const serverTime = new Date();
	const potentialSlots = generateTimeSlots(
		hall,
		totalDuration,
		date,
		serverTime,
	);

	const availableSlots: string[] = [];

	for (const timeStr of potentialSlots) {
		const [time, period] = timeStr.split(" ");
		const [hours, minutes] = time.split(":").map(Number);
		let h = hours;
		if (period === "PM" && h !== 12) h += 12;
		if (period === "AM" && h === 12) h = 0;

		const slotDate = new Date(date);
		slotDate.setHours(h, minutes, 0, 0);

		if (serviceType === "wash_dry") {
			// Check wash availability - need N machines for N loads
			const isWashAvailable = await isSlotAvailable(
				hall.id,
				slotDate,
				"wash",
				washDuration, // Single load duration (45 mins)
				loadCount, // Number of machines needed
			);

			if (!isWashAvailable) continue;

			// Check dry availability - need N machines for N loads (starts after wash)
			const dryDate = new Date(slotDate.getTime() + washDuration * 60000);
			const isDryAvailable = await isSlotAvailable(
				hall.id,
				dryDate,
				"dry",
				dryDuration, // Single load duration (60 mins)
				loadCount, // Number of machines needed
			);

			if (isDryAvailable) {
				availableSlots.push(timeStr);
			}
		} else {
			// For wash or dry only: N loads need N machines running in parallel
			const checkDuration = serviceType === "wash" ? washDuration : dryDuration;
			const isAvailable = await isSlotAvailable(
				hall.id,
				slotDate,
				serviceType,
				checkDuration, // Single load duration (each machine runs one load)
				loadCount, // Number of machines needed for parallel execution
			);
			if (isAvailable) {
				availableSlots.push(timeStr);
			}
		}
	}

	return { slots: availableSlots };
}

/**
 * Checks if a specific time slot has available machines.
 * @param requiredMachines - Number of machines needed (for multi-load bookings)
 */
export async function isSlotAvailable(
	hallId: number,
	appointmentDatetime: Date,
	serviceType: "wash" | "dry",
	durationMins: number,
	requiredMachines: number = 1,
): Promise<boolean> {
	const machineType = serviceType === "dry" ? "dryer" : "washer";

	// 1. Get total number of machines of this type in the hall
	const [machineCountResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(machines)
		.where(
			and(
				eq(machines.hallId, hallId),
				eq(machines.type, machineType),
				eq(machines.status, "available"),
			),
		);

	const totalMachines = Number(machineCountResult?.count || 0);

	// Check if we have enough total machines
	if (totalMachines < requiredMachines) return false;

	// 2. Count overlapping appointments
	const endTime = new Date(
		appointmentDatetime.getTime() + durationMins * 60000,
	);

	// Look back enough to catch any overlapping appointments
	// Max duration for wash_dry (5 loads) is ~345 mins. Let's use 360 mins (6 hours) to be safe.
	const searchStart = new Date(appointmentDatetime.getTime() - 360 * 60000);
	const searchEnd = endTime;

	const activeAppointments = await db
		.select()
		.from(appointments)
		.where(
			and(
				eq(appointments.hallId, hallId),
				eq(appointments.serviceType, serviceType),
				gte(appointments.appointmentDatetime, searchStart),
				lte(appointments.appointmentDatetime, searchEnd),
				// Filter out cancelled
				sql`${appointments.status} IN ('pending', 'confirmed')`,
			),
		);

	let occupiedCount = 0;
	for (const appt of activeAppointments) {
		const apptStart = new Date(appt.appointmentDatetime);
		const apptEnd = new Date(apptStart.getTime() + appt.durationMins * 60000);

		if (apptStart < endTime && apptEnd > appointmentDatetime) {
			occupiedCount++;
		}
	}

	// Check if we have enough free machines
	const freeMachines = totalMachines - occupiedCount;
	return freeMachines >= requiredMachines;
}

export async function getMachineDuration(
	hallId: number,
	type: "washer" | "dryer",
): Promise<number> {
	const result = await db
		.select({ duration: machines.durationMins })
		.from(machines)
		.where(and(eq(machines.hallId, hallId), eq(machines.type, type)))
		.limit(1);

	return result[0]?.duration || 45;
}
