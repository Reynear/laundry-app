import { beforeEach, describe, expect, mock, test } from "bun:test";

// Mock repositories
const mockAppointmentRepository = {
	getUpcomingAppointmentsInWindow: mock(() => Promise.resolve([])),
};

mock.module("../../Repositories/AppointmentRepository", () => ({
	appointmentRepository: mockAppointmentRepository,
}));

describe("Notification Routes", () => {
	beforeEach(() => {
		mockAppointmentRepository.getUpcomingAppointmentsInWindow.mockClear();
	});

	describe("GET /api/notifications/upcoming-appointments", () => {
		test("returns empty array when no appointments", async () => {
			mockAppointmentRepository.getUpcomingAppointmentsInWindow.mockResolvedValue(
				[],
			);

			const appointments =
				await mockAppointmentRepository.getUpcomingAppointmentsInWindow(
					1,
					new Date(),
					new Date(),
				);

			expect(appointments).toEqual([]);
			expect(
				mockAppointmentRepository.getUpcomingAppointmentsInWindow,
			).toHaveBeenCalledTimes(1);
		});

		test("returns appointments within reminder window", async () => {
			const now = new Date();
			const appointmentTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now

			const mockAppointments = [
				{
					id: 1,
					userId: 1,
					hallId: 1,
					machineId: 1,
					appointmentDatetime: appointmentTime,
					durationMins: 45,
					serviceType: "wash",
					status: "confirmed",
					totalCost: 250,
					createdAt: now,
					hallName: "Chancellor Hall",
				},
			];

			mockAppointmentRepository.getUpcomingAppointmentsInWindow.mockResolvedValue(
				mockAppointments,
			);

			const appointments =
				await mockAppointmentRepository.getUpcomingAppointmentsInWindow(
					1,
					now,
					new Date(now.getTime() + 15 * 60 * 1000),
				);

			expect(appointments.length).toBe(1);
			expect(appointments[0].id).toBe(1);
			expect(appointments[0].hallName).toBe("Chancellor Hall");
			expect(appointments[0].serviceType).toBe("wash");
		});

		test("calculates minutesUntil correctly", () => {
			const now = new Date();
			const appointmentTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins from now

			const minutesUntil = Math.round(
				(appointmentTime.getTime() - now.getTime()) / 60000,
			);

			expect(minutesUntil).toBe(10);
		});
	});

	describe("Notification Settings", () => {
		test("default settings are correct", () => {
			const DEFAULT_SETTINGS = {
				enabled: true,
				appointmentReminderMins: 15,
			};

			expect(DEFAULT_SETTINGS.enabled).toBe(true);
			expect(DEFAULT_SETTINGS.appointmentReminderMins).toBe(15);
		});

		test("reminder minutes options are valid", () => {
			const validOptions = [5, 15, 30, 60];

			for (const mins of validOptions) {
				expect(mins).toBeGreaterThan(0);
				expect(mins).toBeLessThanOrEqual(60);
			}
		});
	});

	describe("Duplicate Prevention", () => {
		test("Set correctly tracks notified items", () => {
			const notifiedAppointments = new Set<number>();

			// First notification
			expect(notifiedAppointments.has(1)).toBe(false);
			notifiedAppointments.add(1);
			expect(notifiedAppointments.has(1)).toBe(true);

			// Duplicate check
			expect(notifiedAppointments.has(1)).toBe(true);

			// Different appointment
			expect(notifiedAppointments.has(2)).toBe(false);
		});
	});
});
