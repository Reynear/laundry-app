import { AppointmentListItem } from "./AppointmentListItem";

export function AppointmentListContainer({
	appointments,
	machines,
	filter,
}: {
	appointments: Appointment[];
	machines?: Machine[];
	filter: "upcoming" | "past" | "all";
}) {
	// Create a map for quick machine lookup
	const machineMap = new Map(machines?.map((m) => [m.id, m]) ?? []);

	return (
		<div id="appointment-list-container" class="p-6">
			{appointments.length > 0 ? (
				<div class="space-y-3">
					{appointments.map((appointment) => (
						<AppointmentListItem
							appointment={appointment}
							machine={
								appointment.machineId
									? machineMap.get(appointment.machineId)
									: undefined
							}
						/>
					))}
				</div>
			) : (
				<div class="text-center py-12">
					<svg
						class="w-16 h-16 text-slate-300 mx-auto mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="No appointments icon"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<h3 class="text-lg font-bold text-slate-900 mb-2">
						{filter === "upcoming" && "No Upcoming Appointments"}
						{filter === "past" && "No Past Appointments"}
						{filter === "all" && "No Appointments Yet"}
					</h3>
					<p class="text-sm text-slate-500 mb-6">
						{filter === "upcoming" &&
							"You don't have any upcoming appointments scheduled."}
						{filter === "past" && "You haven't completed any appointments yet."}
						{filter === "all" &&
							"Get started by booking your first appointment."}
					</p>
				</div>
			)}
		</div>
	);
}
