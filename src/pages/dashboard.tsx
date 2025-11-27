import { formatCurrency } from "../features/appointments/utils";
import {
	AppointmentCard,
	NoticeCard,
	PaymentCard,
	TimerCard,
} from "../features/dashboard/components/DashboardComponents";
import {
	formatAppointmentTime,
	formatNoticeTime,
	getTimeRemaining,
} from "../features/dashboard/helpers";

export function Dashboard({ user, appointments, notices, machineSessions }) {
	const currentDate = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div>
			{/* Dashboard Content */}
			<main class="p-4 sm:p-6 lg:p-8">
				{/* Greeting Section */}
				<div class="mb-8">
					<h1 class="text-2xl font-bold text-slate-900">
						Welcome back, {user.firstName}!
					</h1>
					<p class="text-sm text-slate-500 mt-1">{currentDate}</p>
				</div>
				{/* Quick Action Buttons - REMOVED */}

				{/* Main Dashboard Grid */}
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left Column (2/3 width on large screens) */}
					<div class="lg:col-span-2 space-y-6">
						{/* Upcoming Appointments */}
						<div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
							<div class="flex items-center justify-between mb-4">
								<h2 class="text-lg font-bold text-slate-900">
									Upcoming Appointments
								</h2>
							</div>
							<div class="space-y-3">
								{appointments.map((appointment) => (
									<AppointmentCard
										id={appointment.id}
										type={appointment.serviceType}
										time={formatAppointmentTime(
											appointment.appointmentDatetime,
										)}
										location={`${appointment.serviceType.charAt(0).toUpperCase()}-${appointment.machineId ?? "?"} • ${appointment.hallName}`}
									/>
								))}
							</div>
						</div>

						{/* Active Machine Timers */}
						<div
							class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
							hx-get="/dashboard"
							hx-trigger="every 15s"
							hx-select="#timer-section"
							hx-swap="innerHTML"
						>
							{/* Section: Active Machine Timers */}
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
							</div>
						</div>
					</div>

					{/* Right Column (1/3 width on large screens) */}
					<div class="space-y-4">
						{/* Payment Summary */}
						<PaymentCard balance={formatCurrency(user.walletBalance || 0)} />

						{/* Reminders & Notifications */}
						<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
							<h2 class="text-lg font-bold text-slate-900 mb-3">Reminders</h2>
							<div class="space-y-3">
								<div class="flex items-center justify-between pt-3 border-t border-slate-200">
									<p class="text-sm font-medium text-slate-600">
										Notification Method
									</p>
									<span class="text-sm font-bold text-slate-900">Push</span>
								</div>
								<a
									href="/settings"
									class="block w-full py-2 text-sm text-slate-600 hover:text-slate-800 font-bold text-center"
								>
									Update Settings
								</a>
							</div>
						</div>

						{/* Recent Notices */}
						<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
							{/* Section: Recent Notices */}
							<div class="flex items-center justify-between mb-4">
								<h2 class="text-lg font-bold text-slate-900">Recent Notices</h2>
								<a
									href="/notices"
									class="text-sm text-slate-600 hover:text-slate-800 font-bold"
								>
									View All
								</a>
							</div>
							{notices.length > 0 ? (
								<div class="space-y-3">
									{notices.map((notice) => (
										<NoticeCard
											type={notice.type}
											title={notice.title}
											description={notice.content}
											author={notice.authorName}
											time={formatNoticeTime(notice.publishedAt)}
										/>
									))}
								</div>
							) : (
								<div class="text-center py-4">
									<p class="text-slate-500 text-sm">No recent notices</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
