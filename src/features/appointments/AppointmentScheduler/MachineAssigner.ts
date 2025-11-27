import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import { appointments, machines } from "../../../db/schema/schema";

export async function assignMachine(
	hallId: number,
	appointmentDatetime: Date,
	durationMins: number,
	serviceType: "wash" | "dry",
): Promise<number> {
	const machineType = serviceType === "dry" ? "dryer" : "washer";

	// 1. Get all available machines of the required type in the hall
	const hallMachines = await db
		.select()
		.from(machines)
		.where(
			and(
				eq(machines.hallId, hallId),
				eq(machines.type, machineType),
				eq(machines.status, "available"),
			),
		);

	if (hallMachines.length === 0) {
		throw new Error(`No ${machineType}s found in this hall.`);
	}

	// 2. Find conflicting appointments
	const endTime = new Date(
		appointmentDatetime.getTime() + durationMins * 60000,
	);
	// Look back enough to catch any overlapping appointments (e.g. 6 hours for max load wash_dry)
	const searchStart = new Date(appointmentDatetime.getTime() - 360 * 60000);

	const conflictingAppointments = await db
		.select()
		.from(appointments)
		.where(
			and(
				eq(appointments.hallId, hallId),
				gte(appointments.appointmentDatetime, searchStart),
				lte(appointments.appointmentDatetime, endTime),
				sql`${appointments.status} IN ('pending', 'confirmed')`,
			),
		);

	const busyMachineIds = new Set<number>();

	for (const appt of conflictingAppointments) {
		if (!appt.machineId) continue;

		const apptStart = new Date(appt.appointmentDatetime);
		const apptEnd = new Date(apptStart.getTime() + appt.durationMins * 60000);

		// Check overlap: StartA < EndB && EndA > StartB
		if (apptStart < endTime && apptEnd > appointmentDatetime) {
			busyMachineIds.add(appt.machineId);
		}
	}

	// 3. Pick a free machine
	const availableMachine = hallMachines.find((m) => !busyMachineIds.has(m.id));

	if (!availableMachine) {
		throw new Error(`No ${machineType} available for the selected time slot.`);
	}

	return availableMachine.id;
}
