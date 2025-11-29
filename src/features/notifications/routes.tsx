import { Hono } from "hono";
import { appointmentRepository } from "../../Repositories/AppointmentRepository";

const app = new Hono();

// Get upcoming appointments at the exact reminder time (with 2-min tolerance)
app.get("/upcoming-appointments", async (c) => {
	const user = c.get("user") as User;
	const reminderMins = Number.parseInt(c.req.query("reminderMins") || "15", 10);

	const now = new Date();
	// Only notify when appointment is between (reminderMins - 1) and (reminderMins + 1) minutes away
	const windowStart = new Date(now.getTime() + (reminderMins - 1) * 60 * 1000);
	const windowEnd = new Date(now.getTime() + (reminderMins + 1) * 60 * 1000);

	const appointments =
		await appointmentRepository.getUpcomingAppointmentsInWindow(
			user.id,
			windowStart,
			windowEnd,
		);

	return c.json(
		appointments.map((appt) => ({
			id: appt.id,
			appointmentDatetime: appt.appointmentDatetime.toISOString(),
			hallName: appt.hallName || "Unknown Hall",
			serviceType: appt.serviceType,
			minutesUntil: Math.round(
				(appt.appointmentDatetime.getTime() - now.getTime()) / 60000,
			),
		})),
	);
});

export default app;
