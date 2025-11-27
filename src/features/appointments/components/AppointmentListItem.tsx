import { formatCurrency } from "../utils";

export function AppointmentListItem({
	appointment,
	machine,
}: {
	appointment: Appointment;
	machine?: Machine;
}) {
	// Format appointment date and time
	const dateStr = appointment.appointmentDatetime.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});

	const timeStr = appointment.appointmentDatetime.toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});

	// Get service type label
	const serviceLabel =
		appointment.serviceType === "wash"
			? "Wash Only"
			: appointment.serviceType === "dry"
				? "Dry Only"
				: "Wash & Dry";

	// Status badge styling
	const statusStyles = {
		pending: "bg-amber-100 text-amber-800 border-amber-200",
		confirmed: "bg-blue-100 text-blue-800 border-blue-200",
		in_progress: "bg-green-100 text-green-800 border-green-200",
		completed: "bg-slate-100 text-slate-600 border-slate-200",
		cancelled: "bg-red-100 text-red-800 border-red-200",
		no_show: "bg-gray-100 text-gray-600 border-gray-200",
	};

	const statusLabel = {
		pending: "Pending",
		confirmed: "Confirmed",
		in_progress: "In Progress",
		completed: "Completed",
		cancelled: "Cancelled",
		no_show: "No Show",
	};

	return (
		<div
			id={`appointment-item-${appointment.id}`}
			class="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
		>
			<div class="flex items-start justify-between gap-4">
				{/* Left side - Main info */}
				<div class="flex-1">
					{/* Date and Time */}
					<div class="flex items-center gap-2 mb-2">
						<svg
							class="w-4 h-4 text-slate-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="Calendar icon"
							role="img"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<span class="text-sm font-bold text-slate-900">
							{dateStr} at {timeStr}
						</span>
					</div>

					{/* Service Type */}
					<div class="flex items-center gap-2 mb-2">
						<svg
							class="w-4 h-4 text-slate-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="Service icon"
							role="img"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span class="text-sm text-slate-700">{serviceLabel}</span>
					</div>

					{/* Machine */}
					{machine && (
						<div class="flex items-center gap-2 mb-2">
							<svg
								class="w-4 h-4 text-slate-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-label="Machine icon"
								role="img"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
								/>
							</svg>
							<span class="text-sm text-slate-700">
								{machine.type === "washer" ? "W" : "D"}-
								{machine.id.toString().padStart(2, "0")}
							</span>
						</div>
					)}

					{/* Duration */}
					<div class="flex items-center gap-4 text-xs text-slate-500">
						<span>{appointment.durationMins} min</span>
					</div>
				</div>

				{/* Right side - Status and Cost */}
				<div class="flex flex-col items-end gap-2">
					<span
						class={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusStyles[appointment.status]}`}
					>
						{statusLabel[appointment.status]}
					</span>
					<span class="text-lg font-bold text-slate-900">
						{formatCurrency(appointment.totalCost)}
					</span>
					{(appointment.status === "pending" ||
						appointment.status === "confirmed") && (
						<button
							type="button"
							class="text-xs font-medium text-red-600 hover:text-red-800 hover:underline mt-1"
							hx-get={`/appointments/${appointment.id}/cancel-confirmation`}
							hx-target="body"
							hx-swap="beforeend"
						>
							Cancel Appointment
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
