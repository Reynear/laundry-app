import { AppointmentListContainer } from "../../features/appointments/components/AppointmentListContainer";
import { DashboardLayout } from "../../layouts";

interface StaffAppointmentsProps {
	user: User;
	appointments: Appointment[];
	filter: "upcoming" | "past" | "all";
}

export function StaffAppointments({
	user,
	appointments,
	filter,
}: StaffAppointmentsProps) {
	return (
		<DashboardLayout user={user} currentPath="/appointments">
			<div class="p-6">
				<div class="mb-6">
					<h1 class="text-2xl font-bold text-slate-900">Hall Appointments</h1>
					<p class="text-sm text-slate-500 mt-1">
						View all appointments for {user.hallName || "your hall"}
					</p>
				</div>

				{/* Filter tabs */}
				<div class="flex gap-2 mb-6">
					<a
						href="/appointments?filter=upcoming"
						class={
							filter === "upcoming"
								? "px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white"
								: "px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
						}
					>
						Upcoming
					</a>
					<a
						href="/appointments?filter=past"
						class={
							filter === "past"
								? "px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white"
								: "px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
						}
					>
						Past
					</a>
					<a
						href="/appointments?filter=all"
						class={
							filter === "all"
								? "px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white"
								: "px-4 py-2 text-sm font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
						}
					>
						All
					</a>
				</div>

				<div class="bg-white rounded-xl border border-slate-200">
					<AppointmentListContainer
						appointments={appointments}
						filter={filter}
					/>
				</div>
			</div>
		</DashboardLayout>
	);
}
