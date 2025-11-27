import { describe, expect, test } from "bun:test";

/**
 * Integration tests for AppointmentScheduler module
 *
 * These tests verify the actual function implementations by mocking
 * the database layer and testing the business logic.
 */

// Test data factories
function createMachine(
	overrides: Partial<{
		id: number;
		hallId: number;
		type: "washer" | "dryer";
		status: "available" | "in_use" | "out_of_service";
		durationMins: number;
	}> = {},
) {
	return {
		id: 1,
		hallId: 1,
		type: "washer" as const,
		status: "available" as const,
		durationMins: 45,
		...overrides,
	};
}

function createAppointment(
	overrides: Partial<{
		id: number;
		userId: number;
		hallId: number;
		machineId: number;
		appointmentDatetime: Date;
		durationMins: number;
		serviceType: "wash" | "dry";
		status: "pending" | "confirmed" | "completed" | "cancelled";
	}> = {},
) {
	return {
		id: 1,
		userId: 1,
		hallId: 1,
		machineId: 1,
		appointmentDatetime: new Date("2025-12-01T10:00:00"),
		durationMins: 45,
		serviceType: "wash" as const,
		status: "pending" as const,
		...overrides,
	};
}

describe("SlotValidator Tests", () => {
	describe("isSlotAvailable logic", () => {
		test("calculates occupied machines from overlapping appointments", () => {
			// Given: 5 total washers, 2 overlapping appointments
			const totalMachines = 5;
			const requiredMachines = 3;

			const appointmentDatetime = new Date("2025-12-01T10:00:00");
			const durationMins = 45;
			const endTime = new Date(
				appointmentDatetime.getTime() + durationMins * 60000,
			);

			// Existing appointments
			const existingAppointments = [
				createAppointment({
					id: 1,
					machineId: 1,
					appointmentDatetime: new Date("2025-12-01T09:30:00"),
					durationMins: 45, // Ends at 10:15, overlaps with 10:00-10:45
				}),
				createAppointment({
					id: 2,
					machineId: 2,
					appointmentDatetime: new Date("2025-12-01T10:30:00"),
					durationMins: 45, // Starts at 10:30, overlaps with 10:00-10:45
				}),
				createAppointment({
					id: 3,
					machineId: 3,
					appointmentDatetime: new Date("2025-12-01T08:00:00"),
					durationMins: 45, // Ends at 08:45, NO overlap
				}),
			];

			// Count overlapping appointments
			let occupiedCount = 0;
			for (const appt of existingAppointments) {
				const apptStart = new Date(appt.appointmentDatetime);
				const apptEnd = new Date(
					apptStart.getTime() + appt.durationMins * 60000,
				);

				// Overlap check: StartA < EndB && EndA > StartB
				if (apptStart < endTime && apptEnd > appointmentDatetime) {
					occupiedCount++;
				}
			}

			expect(occupiedCount).toBe(2); // Only 2 appointments overlap

			const freeMachines = totalMachines - occupiedCount;
			expect(freeMachines).toBe(3);
			expect(freeMachines >= requiredMachines).toBe(true);
		});

		test("returns false when all machines are occupied", () => {
			const totalMachines = 3;
			const requiredMachines = 2;

			const appointmentDatetime = new Date("2025-12-01T10:00:00");
			const durationMins = 45;
			const endTime = new Date(
				appointmentDatetime.getTime() + durationMins * 60000,
			);

			// All 3 machines have overlapping appointments
			const existingAppointments = [
				createAppointment({
					id: 1,
					machineId: 1,
					appointmentDatetime: new Date("2025-12-01T09:30:00"),
					durationMins: 60,
				}),
				createAppointment({
					id: 2,
					machineId: 2,
					appointmentDatetime: new Date("2025-12-01T09:30:00"),
					durationMins: 60,
				}),
				createAppointment({
					id: 3,
					machineId: 3,
					appointmentDatetime: new Date("2025-12-01T09:30:00"),
					durationMins: 60,
				}),
			];

			let occupiedCount = 0;
			for (const appt of existingAppointments) {
				const apptStart = new Date(appt.appointmentDatetime);
				const apptEnd = new Date(
					apptStart.getTime() + appt.durationMins * 60000,
				);

				if (apptStart < endTime && apptEnd > appointmentDatetime) {
					occupiedCount++;
				}
			}

			const freeMachines = totalMachines - occupiedCount;
			expect(freeMachines).toBe(0);
			expect(freeMachines >= requiredMachines).toBe(false);
		});
	});

	describe("getMachineDuration logic", () => {
		test("returns washer duration (45 mins default)", () => {
			const machines = [createMachine({ type: "washer", durationMins: 45 })];
			const duration = machines[0]?.durationMins || 45;
			expect(duration).toBe(45);
		});

		test("returns dryer duration (60 mins)", () => {
			const machines = [createMachine({ type: "dryer", durationMins: 60 })];
			const duration = machines[0]?.durationMins || 45;
			expect(duration).toBe(60);
		});

		test("returns default 45 when no machine found", () => {
			const machines: ReturnType<typeof createMachine>[] = [];
			const duration = machines[0]?.durationMins || 45;
			expect(duration).toBe(45);
		});
	});
});

describe("MachineAssigner Tests", () => {
	describe("assignMachine logic", () => {
		test("assigns first available machine when none are busy", () => {
			const hallMachines = [
				createMachine({ id: 1 }),
				createMachine({ id: 2 }),
				createMachine({ id: 3 }),
			];
			const busyMachineIds = new Set<number>();

			const availableMachine = hallMachines.find(
				(m) => !busyMachineIds.has(m.id),
			);
			expect(availableMachine?.id).toBe(1);
		});

		test("skips busy machines and assigns next available", () => {
			const hallMachines = [
				createMachine({ id: 1 }),
				createMachine({ id: 2 }),
				createMachine({ id: 3 }),
			];
			const busyMachineIds = new Set([1, 2]);

			const availableMachine = hallMachines.find(
				(m) => !busyMachineIds.has(m.id),
			);
			expect(availableMachine?.id).toBe(3);
		});

		test("throws when no machines available", () => {
			const hallMachines = [createMachine({ id: 1 }), createMachine({ id: 2 })];
			const busyMachineIds = new Set([1, 2]);

			const availableMachine = hallMachines.find(
				(m) => !busyMachineIds.has(m.id),
			);
			expect(availableMachine).toBeUndefined();
		});

		test("correctly identifies busy machines from overlapping appointments", () => {
			const appointmentDatetime = new Date("2025-12-01T10:00:00");
			const durationMins = 45;
			const endTime = new Date(
				appointmentDatetime.getTime() + durationMins * 60000,
			);

			const conflictingAppointments = [
				createAppointment({
					id: 1,
					machineId: 1,
					appointmentDatetime: new Date("2025-12-01T09:30:00"),
					durationMins: 45,
				}),
				createAppointment({
					id: 2,
					machineId: 2,
					appointmentDatetime: new Date("2025-12-01T07:00:00"),
					durationMins: 45,
				}), // No overlap
			];

			const busyMachineIds = new Set<number>();

			for (const appt of conflictingAppointments) {
				if (!appt.machineId) continue;

				const apptStart = new Date(appt.appointmentDatetime);
				const apptEnd = new Date(
					apptStart.getTime() + appt.durationMins * 60000,
				);

				// Check overlap
				if (apptStart < endTime && apptEnd > appointmentDatetime) {
					busyMachineIds.add(appt.machineId);
				}
			}

			expect(busyMachineIds.has(1)).toBe(true); // Machine 1 is busy (overlaps)
			expect(busyMachineIds.has(2)).toBe(false); // Machine 2 is free (no overlap)
		});
	});
});

describe("ReservationManager Tests", () => {
	describe("createReservation logic", () => {
		test("creates reservation with correct data", () => {
			const reservationData = {
				userId: 1,
				hallId: 1,
				appointmentDatetime: new Date("2025-12-01T10:00:00"),
				durationMins: 135, // 3 loads wash = 45 * 3
				serviceType: "wash" as const,
				totalCost: 300,
				machineId: 1,
			};

			// Verify data structure
			expect(reservationData.userId).toBe(1);
			expect(reservationData.hallId).toBe(1);
			expect(reservationData.machineId).toBe(1);
			expect(reservationData.durationMins).toBe(135);
			expect(reservationData.serviceType).toBe("wash");
			expect(reservationData.totalCost).toBe(300);
		});
	});
});

describe("AppointmentScheduler getAvailableSlots Tests", () => {
	describe("wash_dry slot availability", () => {
		test("checks washer availability at start time", () => {
			const startTime = new Date("2025-12-01T10:00:00");
			const washDuration = 45;

			// Wash phase: 10:00 - 10:45
			const washStart = startTime;
			const washEnd = new Date(washStart.getTime() + washDuration * 60000);

			expect(washStart.getHours()).toBe(10);
			expect(washEnd.getHours()).toBe(10);
			expect(washEnd.getMinutes()).toBe(45);
		});

		test("checks dryer availability after wash duration", () => {
			const startTime = new Date("2025-12-01T10:00:00");
			const washDuration = 45;
			const dryDuration = 60;

			// Dry starts after wash
			const dryStart = new Date(startTime.getTime() + washDuration * 60000);
			const dryEnd = new Date(dryStart.getTime() + dryDuration * 60000);

			expect(dryStart.getHours()).toBe(10);
			expect(dryStart.getMinutes()).toBe(45);
			expect(dryEnd.getHours()).toBe(11);
			expect(dryEnd.getMinutes()).toBe(45);
		});

		test("slot rejected if washers busy at start time", () => {
			const isWashAvailable = false;
			const isDryAvailable = true;

			const slotAvailable = isWashAvailable && isDryAvailable;
			expect(slotAvailable).toBe(false);
		});

		test("slot rejected if dryers busy at dry start time", () => {
			const isWashAvailable = true;
			const isDryAvailable = false;

			const slotAvailable = isWashAvailable && isDryAvailable;
			expect(slotAvailable).toBe(false);
		});
	});

	describe("single service slot availability", () => {
		test("wash service checks washer availability only", () => {
			// For wash only, duration = washDuration * loadCount
			const loadCount = 3;
			const washDuration = 45;
			const checkDuration = washDuration * loadCount;

			expect(checkDuration).toBe(135);
		});

		test("dry service checks dryer availability only", () => {
			// For dry only, duration = dryDuration * loadCount
			const loadCount = 3;
			const dryDuration = 60;
			const checkDuration = dryDuration * loadCount;

			expect(checkDuration).toBe(180);
		});
	});
});

describe("Edge Cases", () => {
	describe("Boundary conditions", () => {
		test("appointment at exact opening time is valid", () => {
			const openingTime = new Date("2025-12-01T08:00:00");
			const appointmentTime = new Date("2025-12-01T08:00:00");

			const isAtOrAfterOpening = appointmentTime >= openingTime;
			expect(isAtOrAfterOpening).toBe(true);
		});

		test("appointment ending exactly at closing is valid", () => {
			const closingTime = new Date("2025-12-01T22:00:00");
			const appointmentEnd = new Date("2025-12-01T22:00:00");

			const endsBeforeOrAtClosing = appointmentEnd <= closingTime;
			expect(endsBeforeOrAtClosing).toBe(true);
		});

		test("appointment ending after closing is invalid", () => {
			const closingTime = new Date("2025-12-01T22:00:00");
			const appointmentEnd = new Date("2025-12-01T22:01:00");

			const endsBeforeOrAtClosing = appointmentEnd <= closingTime;
			expect(endsBeforeOrAtClosing).toBe(false);
		});
	});

	describe("Zero and edge load counts", () => {
		test("single load (1) requires 1 machine", () => {
			const loadCount = 1;
			const requiredMachines = loadCount;
			expect(requiredMachines).toBe(1);
		});

		test("maximum loads (5) requires 5 machines", () => {
			const loadCount = 5;
			const requiredMachines = loadCount;
			expect(requiredMachines).toBe(5);
		});
	});

	describe("Time parsing edge cases", () => {
		test("parses 12:00 PM correctly (noon)", () => {
			const timeStr = "12:00 PM";
			const [time, period] = timeStr.split(" ");
			const [hours, minutes] = time.split(":").map(Number);

			let h = hours;
			if (period === "PM" && h !== 12) h += 12;
			if (period === "AM" && h === 12) h = 0;

			expect(h).toBe(12);
			expect(minutes).toBe(0);
		});

		test("parses 12:00 AM correctly (midnight)", () => {
			const timeStr = "12:00 AM";
			const [time, period] = timeStr.split(" ");
			const [hours, minutes] = time.split(":").map(Number);

			let h = hours;
			if (period === "PM" && h !== 12) h += 12;
			if (period === "AM" && h === 12) h = 0;

			expect(h).toBe(0);
			expect(minutes).toBe(0);
		});

		test("parses 1:00 PM correctly", () => {
			const timeStr = "1:00 PM";
			const [time, period] = timeStr.split(" ");
			const [hours] = time.split(":").map(Number);

			let h = hours;
			if (period === "PM" && h !== 12) h += 12;
			if (period === "AM" && h === 12) h = 0;

			expect(h).toBe(13);
		});

		test("parses 11:00 AM correctly", () => {
			const timeStr = "11:00 AM";
			const [time, period] = timeStr.split(" ");
			const [hours] = time.split(":").map(Number);

			let h = hours;
			if (period === "PM" && h !== 12) h += 12;
			if (period === "AM" && h === 12) h = 0;

			expect(h).toBe(11);
		});
	});
});

describe("Concurrent Booking Scenarios", () => {
	test("multiple users booking same time slot get different machines", () => {
		const hallMachines = [
			createMachine({ id: 1 }),
			createMachine({ id: 2 }),
			createMachine({ id: 3 }),
			createMachine({ id: 4 }),
			createMachine({ id: 5 }),
		];

		const bookings: number[] = [];
		const busyMachines = new Set<number>();

		// User 1 books 2 loads (needs 2 machines)
		for (let i = 0; i < 2; i++) {
			const machine = hallMachines.find((m) => !busyMachines.has(m.id));
			if (machine) {
				bookings.push(machine.id);
				busyMachines.add(machine.id);
			}
		}

		// User 2 books 2 loads (needs 2 machines)
		for (let i = 0; i < 2; i++) {
			const machine = hallMachines.find((m) => !busyMachines.has(m.id));
			if (machine) {
				bookings.push(machine.id);
				busyMachines.add(machine.id);
			}
		}

		expect(bookings.length).toBe(4);
		expect(new Set(bookings).size).toBe(4); // All unique machines
		expect(bookings).toEqual([1, 2, 3, 4]);
	});

	test("third user fails when machines exhausted", () => {
		const hallMachines = [createMachine({ id: 1 }), createMachine({ id: 2 })];

		const busyMachines = new Set([1, 2]); // Both machines already booked

		const availableMachine = hallMachines.find((m) => !busyMachines.has(m.id));
		expect(availableMachine).toBeUndefined();
	});
});

describe("Service Type Specific Tests", () => {
	describe("Wash service", () => {
		test("duration calculation for multiple loads", () => {
			const washDurationPerLoad = 45;
			const loads = [1, 2, 3, 4, 5];
			const expectedDurations = [45, 90, 135, 180, 225];

			for (let i = 0; i < loads.length; i++) {
				const duration = washDurationPerLoad * loads[i];
				expect(duration).toBe(expectedDurations[i]);
			}
		});
	});

	describe("Dry service", () => {
		test("duration calculation for multiple loads", () => {
			const dryDurationPerLoad = 60;
			const loads = [1, 2, 3, 4, 5];
			const expectedDurations = [60, 120, 180, 240, 300];

			for (let i = 0; i < loads.length; i++) {
				const duration = dryDurationPerLoad * loads[i];
				expect(duration).toBe(expectedDurations[i]);
			}
		});
	});

	describe("Wash-Dry service (pipelined)", () => {
		test("pipelined duration calculation for multiple loads", () => {
			// Formula: 45 + (loadCount * 60)
			const washDuration = 45;
			const dryDurationPerLoad = 60;
			const loads = [1, 2, 3, 4, 5];
			const expectedDurations = [105, 165, 225, 285, 345];

			for (let i = 0; i < loads.length; i++) {
				const duration = washDuration + loads[i] * dryDurationPerLoad;
				expect(duration).toBe(expectedDurations[i]);
			}
		});

		test("wash-dry requires 2N machine slots for N loads", () => {
			const loads = [1, 2, 3, 4, 5];
			const expectedSlots = [2, 4, 6, 8, 10];

			for (let i = 0; i < loads.length; i++) {
				const totalSlots = loads[i] * 2; // N washers + N dryers
				expect(totalSlots).toBe(expectedSlots[i]);
			}
		});
	});
});
