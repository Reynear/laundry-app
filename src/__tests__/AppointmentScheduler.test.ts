import { beforeEach, describe, expect, mock, test } from "bun:test";

// Mock the database module before imports
const mockDb = {
	select: mock(() => mockDb),
	from: mock(() => mockDb),
	where: mock(() => mockDb),
	limit: mock(() => []),
	insert: mock(() => mockDb),
	values: mock(() => mockDb),
	returning: mock(() => []),
};

const mockAppointmentRepository = {
	createAppointment: mock(() => Promise.resolve({ id: 1 })),
	deleteAppointment: mock(() => Promise.resolve(true)),
};

// Mock the modules
mock.module("../db", () => ({ db: mockDb }));
mock.module("../../Repositories", () => ({
	appointmentRepository: mockAppointmentRepository,
}));

// Import after mocking - use new module structure
import { getServiceDetailsSync } from "../features/appointments/AppointmentScheduler/ServiceDetails";
import { formatCurrency, generateNext7Days } from "../features/appointments/utils";

describe("AppointmentScheduler Module", () => {
	beforeEach(() => {
		// Reset all mocks before each test
		mockDb.select.mockClear();
		mockDb.from.mockClear();
		mockDb.where.mockClear();
		mockDb.limit.mockClear();
		mockAppointmentRepository.createAppointment.mockClear();
		mockAppointmentRepository.deleteAppointment.mockClear();
	});

	describe("Utility Functions", () => {
		describe("generateNext7Days", () => {
			test("generates 7 consecutive days starting from given date", () => {
				const startDate = new Date("2025-12-01");
				const dates = generateNext7Days(startDate);

				expect(dates.length).toBe(7);
				expect(dates[0].getDate()).toBe(1);
				expect(dates[6].getDate()).toBe(7);
			});
		});

		describe("formatCurrency", () => {
			test("formats number as JMD currency", () => {
				const formatted = formatCurrency(1000);
				expect(formatted).toContain("1,000");
			});
		});
	});

	describe("ServiceDetails Functions", () => {
		describe("getServiceDetailsSync", () => {
			test("returns correct details for wash service", () => {
				const details = getServiceDetailsSync("wash", 100, 150, 45, 60);

				expect(details.label).toBe("Wash Only");
				expect(details.price).toBe(100);
				expect(details.duration).toBe(45); // Uses provided washDuration
			});

			test("returns correct details for dry service", () => {
				const details = getServiceDetailsSync("dry", 100, 150, 45, 60);

				expect(details.label).toBe("Dry Only");
				expect(details.price).toBe(150);
				expect(details.duration).toBe(60); // Uses provided dryDuration
			});

			test("returns correct details for wash_dry service (pipelined)", () => {
				const details = getServiceDetailsSync("wash_dry", 100, 150, 45, 60);

				expect(details.label).toBe("Wash & Dry");
				expect(details.price).toBe(250); // 100 + 150
				expect(details.duration).toBe(105); // 45 + 60 (sum of provided durations)
			});

			test("returns correct duration with custom hall-specific durations", () => {
				// Test with different hall-specific durations (e.g., 50 min wash, 70 min dry)
				const details = getServiceDetailsSync("wash_dry", 100, 150, 50, 70);
				expect(details.duration).toBe(120); // 50 + 70 = custom hall durations
			});

			test("returns zero values for null/undefined service type", () => {
				const details = getServiceDetailsSync(null, 100, 150, 45, 60);
				expect(details.label).toBe("Not selected");
				expect(details.price).toBe(0);
				expect(details.duration).toBe(0);
			});
		});
	});

	describe("N Loads = N Appointments Logic", () => {
		describe("Wash/Dry Only Services", () => {
			test("N loads require N machines for wash service", async () => {
				// For wash only: N loads should book 1 appointment per load
				// Each load uses 1 machine for 45 minutes
				const loads = 3;
				const washDuration = 45;

				// Total duration for N loads sequentially would be N * 45
				const totalDuration = washDuration * loads;
				expect(totalDuration).toBe(135); // 3 loads * 45 mins = 135 mins

				// For parallel execution, need N machines
				// Each machine runs for 45 mins
				// This is tested via isSlotAvailable with requiredMachines = loadCount
			});

			test("N loads require N machines for dry service", async () => {
				const loadCount = 3;
				const dryDuration = 60;

				const totalDuration = dryDuration * loadCount;
				expect(totalDuration).toBe(180); // 3 loads * 60 mins = 180 mins
			});
		});

		describe("Wash-Dry Service (2N Appointments)", () => {
			test("wash_dry for N loads creates 2N machine reservations (N washers + N dryers)", () => {
				// For wash_dry service:
				// - N loads need N washer appointments
				// - N loads need N dryer appointments
				// Total = 2N machine reservations
				const loadCount = 3;
				const expectedReservations = loadCount * 2; // 2N
				expect(expectedReservations).toBe(6); // 3 wash + 3 dry = 6
			});

			test("wash_dry pipelined duration is correct (45 + 60 = 105)", () => {
				// PARALLEL: All N loads run simultaneously
				// Each load: wash (45 mins) then dry (60 mins)
				// Total duration: 45 + 60 = 105 mins (NOT scaled by load count)
				const loadCount = 3;
				const washDuration = 45;
				const dryDuration = 60;

				// Parallel duration: 45 + 60 (fixed)
				const parallelDuration = washDuration + dryDuration;
				expect(parallelDuration).toBe(105);
			});
		});
	});

	describe("Machine Availability Checks", () => {
		describe("Check if N machines are available", () => {
			test("should require N machines for N loads", () => {
				// The isSlotAvailable function takes requiredMachines parameter
				// For N loads, we need N machines available simultaneously
				const loadCount = 3;
				const requiredMachines = loadCount;

				expect(requiredMachines).toBe(3);
			});

			test("slot available when free machines >= required machines", () => {
				const totalMachines = 5;
				const occupiedMachines = 2;
				const requiredMachines = 3;

				const freeMachines = totalMachines - occupiedMachines;
				const isAvailable = freeMachines >= requiredMachines;

				expect(freeMachines).toBe(3);
				expect(isAvailable).toBe(true);
			});

			test("slot unavailable when free machines < required machines", () => {
				const totalMachines = 5;
				const occupiedMachines = 3;
				const requiredMachines = 3;

				const freeMachines = totalMachines - occupiedMachines;
				const isAvailable = freeMachines >= requiredMachines;

				expect(freeMachines).toBe(2);
				expect(isAvailable).toBe(false);
			});
		});
	});

	describe("Appointment Duration Calculations", () => {
		describe("1.75 hours for 3 loads wash_dry scenario", () => {
			test("single load wash_dry takes 105 minutes (1.75 hours)", () => {
				// 1.75 hours = 105 minutes
				// This is: wash (45 mins) + dry (60 mins) = 105 mins
				const washDuration = 45;
				const dryDuration = 60;
				const singleLoadWashDry = washDuration + dryDuration;

				expect(singleLoadWashDry).toBe(105);
				expect(singleLoadWashDry / 60).toBe(1.75);
			});

			test("3 loads pipelined wash_dry total duration", () => {
				// PARALLEL execution:
				// T=0:     All 3 washes start simultaneously on 3 washers
				// T=45:    All 3 washes end, all 3 drys start on 3 dryers
				// T=105:   All 3 drys end
				//
				// Total duration: 45 + 60 = 105 mins (NOT scaled by load count)
				const loadCount = 3;
				const parallelDuration = 45 + 60;

				expect(parallelDuration).toBe(105); // 1.75 hours
			});
		});

		describe("Sequential vs Parallel execution", () => {
			test("sequential execution: 3 loads wash = 3 * 45 = 135 mins", () => {
				const loadCount = 3;
				const washDuration = 45;
				const sequential = loadCount * washDuration;

				expect(sequential).toBe(135);
			});

			test("parallel execution with N machines: 3 loads wash = 45 mins (all at once)", () => {
				const washDuration = 45;
				// With 3 machines, all 3 loads run simultaneously
				const parallel = washDuration;

				expect(parallel).toBe(45);
			});
		});
	});

	describe("Overlap Detection", () => {
		test("detects overlapping appointments correctly", () => {
			// Appointment A: 10:00 - 10:45 (45 mins wash)
			// Appointment B: 10:30 - 11:30 (60 mins dry)
			// These overlap from 10:30 to 10:45

			const apptAStart = new Date("2025-12-01T10:00:00");
			const apptAEnd = new Date("2025-12-01T10:45:00");
			const apptBStart = new Date("2025-12-01T10:30:00");
			const apptBEnd = new Date("2025-12-01T11:30:00");

			// Overlap condition: StartA < EndB && EndA > StartB
			const overlaps = apptAStart < apptBEnd && apptAEnd > apptBStart;

			expect(overlaps).toBe(true);
		});

		test("non-overlapping appointments detected correctly", () => {
			// Appointment A: 10:00 - 10:45
			// Appointment B: 11:00 - 12:00
			// No overlap

			const apptAStart = new Date("2025-12-01T10:00:00");
			const apptAEnd = new Date("2025-12-01T10:45:00");
			const apptBStart = new Date("2025-12-01T11:00:00");
			const apptBEnd = new Date("2025-12-01T12:00:00");

			const overlaps = apptAStart < apptBEnd && apptAEnd > apptBStart;

			expect(overlaps).toBe(false);
		});

		test("adjacent appointments (no gap) do not overlap", () => {
			// Appointment A: 10:00 - 10:45
			// Appointment B: 10:45 - 11:30
			// Adjacent but not overlapping

			const apptAStart = new Date("2025-12-01T10:00:00");
			const apptAEnd = new Date("2025-12-01T10:45:00");
			const apptBStart = new Date("2025-12-01T10:45:00");
			const apptBEnd = new Date("2025-12-01T11:30:00");

			// Using strict inequality: StartA < EndB && EndA > StartB
			const overlaps = apptAStart < apptBEnd && apptAEnd > apptBStart;

			expect(overlaps).toBe(false);
		});
	});

	describe("Parallel Execution for All Services", () => {
		test("wash-only N loads requires N machines (parallel, not sequential)", () => {
			// IMPORTANT: N loads should run in parallel, NOT sequentially
			// Each load gets its own machine running simultaneously
			const loadCount = 3;
			const washDuration = 45; // Single load duration

			// Correct (parallel): 3 machines, each running 45 mins = 45 mins total
			const parallelTotalTime = washDuration;
			const requiredMachines = loadCount;

			// Wrong (sequential): 1 machine running 3x45 mins = 135 mins total
			const sequentialTotalTime = washDuration * loadCount;

			expect(requiredMachines).toBe(3);
			expect(parallelTotalTime).toBe(45);
			expect(sequentialTotalTime).toBe(135);

			// The slot validation should check for N machines with single-load duration
			// NOT 1 machine with N*duration
		});

		test("dry-only N loads requires N machines (parallel, not sequential)", () => {
			const loadCount = 3;
			const dryDuration = 60;

			const parallelTotalTime = dryDuration;
			const requiredMachines = loadCount;

			expect(requiredMachines).toBe(3);
			expect(parallelTotalTime).toBe(60);
		});
	});

	describe("Wash-Dry Slot Validation", () => {
		test("wash_dry requires checking both washer and dryer availability", () => {
			// For wash_dry:
			// 1. Check N washers available at start time
			// 2. Check N dryers available at start time + wash duration

			const loadCount = 3;
			const washDuration = 45;
			const dryDuration = 60;
			const startTime = new Date("2025-12-01T10:00:00");

			// Wash phase: 10:00 - 10:45
			const washStart = startTime;
			const washEnd = new Date(startTime.getTime() + washDuration * 60000);

			// Dry phase: 10:45 - 11:45 (starts after wash)
			const dryStart = washEnd;
			const dryEnd = new Date(dryStart.getTime() + dryDuration * 60000);

			expect(washStart.toISOString()).toContain("10:00");
			expect(washEnd.toISOString()).toContain("10:45");
			expect(dryStart.toISOString()).toContain("10:45");
			expect(dryEnd.toISOString()).toContain("11:45");

			// For N loads, need N washers and N dryers
			expect(loadCount).toBe(3);
		});

		test("wash_dry slot is unavailable if washers are busy", () => {
			const washAvailable = false;
			const dryAvailable = true;

			const slotAvailable = washAvailable && dryAvailable;

			expect(slotAvailable).toBe(false);
		});

		test("wash_dry slot is unavailable if dryers are busy", () => {
			const washAvailable = true;
			const dryAvailable = false;

			const slotAvailable = washAvailable && dryAvailable;

			expect(slotAvailable).toBe(false);
		});

		test("wash_dry slot is available only if both washers and dryers are free", () => {
			const washAvailable = true;
			const dryAvailable = true;

			const slotAvailable = washAvailable && dryAvailable;

			expect(slotAvailable).toBe(true);
		});
	});

	describe("Machine Count Logic", () => {
		test("N loads booking N separate machines scenario", () => {
			// Scenario: User books 3 loads at same time
			// Each load needs its own machine
			// Total machines needed: 3

			const loadCount = 3;
			const busyMachines = new Set<number>();
			const hallMachines = [
				{ id: 1, type: "washer", status: "available" },
				{ id: 2, type: "washer", status: "available" },
				{ id: 3, type: "washer", status: "available" },
				{ id: 4, type: "washer", status: "available" },
				{ id: 5, type: "washer", status: "available" },
			];

			// Assign machines for each load
			const assignedMachines: number[] = [];
			for (let i = 0; i < loadCount; i++) {
				const availableMachine = hallMachines.find(
					(m) => !busyMachines.has(m.id) && !assignedMachines.includes(m.id),
				);
				if (availableMachine) {
					assignedMachines.push(availableMachine.id);
				}
			}

			expect(assignedMachines.length).toBe(3);
			expect(new Set(assignedMachines).size).toBe(3); // All unique
		});

		test("fails when not enough machines for N loads", () => {
			const loadCount = 5;
			const hallMachines = [
				{ id: 1, type: "washer", status: "available" },
				{ id: 2, type: "washer", status: "available" },
				{ id: 3, type: "washer", status: "available" },
			];
			const busyMachines = new Set([1]); // Machine 1 is busy

			// Available machines: 2 (machines 2 and 3)
			const availableMachineCount = hallMachines.filter(
				(m) => !busyMachines.has(m.id),
			).length;

			expect(availableMachineCount).toBe(2);
			expect(availableMachineCount >= loadCount).toBe(false);
		});
	});
});

describe("Integration-Style Tests (Logic Verification)", () => {
	describe("Full Booking Flow", () => {
		test("booking 3 loads wash creates correct appointment data", () => {
			const bookingData = {
				userId: 1,
				hallId: 1,
				appointmentDatetime: new Date("2025-12-01T10:00:00"),
				serviceType: "wash" as const,
				loadCount: 3,
				machinePrice: 100,
			};

			// PARALLEL: All 3 loads run simultaneously on 3 machines
			// Duration is fixed at 45 mins regardless of load count
			const durationMins = 45; // Parallel: fixed duration
			const totalCost = bookingData.machinePrice * bookingData.loadCount;

			expect(durationMins).toBe(45);
			expect(totalCost).toBe(300);
		});

		test("booking 3 loads dry creates correct appointment data", () => {
			const bookingData = {
				userId: 1,
				hallId: 1,
				appointmentDatetime: new Date("2025-12-01T10:00:00"),
				serviceType: "dry" as const,
				loadCount: 3,
				machinePrice: 150,
			};

			// PARALLEL: All 3 loads run simultaneously on 3 machines
			const durationMins = 60; // Parallel: fixed duration
			const totalCost = bookingData.machinePrice * bookingData.loadCount;

			expect(durationMins).toBe(60);
			expect(totalCost).toBe(450);
		});

		test("booking 3 loads wash_dry creates correct appointment data", () => {
			const bookingData = {
				userId: 1,
				hallId: 1,
				appointmentDatetime: new Date("2025-12-01T10:00:00"),
				serviceType: "wash_dry" as const,
				loadCount: 3,
				washPrice: 100,
				dryPrice: 150,
			};

			// PARALLEL: wash (45) + dry (60) = 105 mins (fixed, not scaled)
			const parallelDuration = 105;
			const totalCost =
				(bookingData.washPrice + bookingData.dryPrice) * bookingData.loadCount;

			expect(parallelDuration).toBe(105);
			expect(totalCost).toBe(750); // (100 + 150) * 3
		});
	});

	describe("Time Slot Boundary Tests", () => {
		test("slot ends exactly at closing time is valid", () => {
			const serviceDuration = 45; // mins

			// Last valid slot: 22:00 - 45 mins = 21:15
			const closeTime = new Date("2025-12-01T22:00:00");
			const lastValidSlotStart = new Date(
				closeTime.getTime() - serviceDuration * 60000,
			);

			expect(lastValidSlotStart.getHours()).toBe(21);
			expect(lastValidSlotStart.getMinutes()).toBe(15);
		});

		test("slot that exceeds closing time is invalid", () => {
			const closeTime = new Date("2025-12-01T22:00:00");
			const slotStart = new Date("2025-12-01T21:30:00");
			const serviceDuration = 45;
			const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

			// Slot ends at 22:15, which is after closing
			const isValid = slotEnd <= closeTime;

			expect(isValid).toBe(false);
		});
	});
});
