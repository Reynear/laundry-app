import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { Dashboard } from "../../pages/dashboard";
import { appointmentRepository } from "../../Repositories/AppointmentRepository";
import { machineSessionRepository } from "../../Repositories/MachineSessionRepository";
import { noticeRepository } from "../../Repositories/NoticeRepository";
import { TimerCard } from "./components/DashboardComponents";
import { getTimeRemaining } from "./helpers";

const dashboard = new Hono<{ Variables: { user: any } }>();

dashboard.get("/", async (c) => {
	const user = c.get("user") as any;
	const userId = user.id;

	if (!user) {
		return c.redirect("/login");
	}

	if (user.role === "staff") {
		return c.redirect("/appointments");
	}

	const appointments =
		await appointmentRepository.getUpcomingAppointments(userId);
	const notices = await noticeRepository.getRecentNotices(3, user.hallId);
	const machineSessions =
		await machineSessionRepository.getActiveSessionsForUser(userId);

	// Check if it's an HTMX request for just the timer section
	if (c.req.header("hx-request") === "true") {
		return c.html(
			<div id="timer-section">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-bold text-slate-900">
						Active Machine Timers
					</h2>
				</div>
				<div class="space-y-3">
					{machineSessions.map((session) => {
						const { timeLeft, isFinished } = getTimeRemaining(session);
						return (
							<TimerCard
								machine={String(session.machineId)}
								type={session.machineType}
								hall={session.hallName || "Unknown Hall"}
								timeLeft={timeLeft}
								status={isFinished}
							/>
						);
					})}
				</div>
			</div>,
		);
	}

	return c.html(
		<DashboardLayout user={user} currentPath="/dashboard">
			<Dashboard
				user={user}
				appointments={appointments}
				notices={notices}
				machineSessions={machineSessions}
			/>
		</DashboardLayout>,
	);
});

export default dashboard;
