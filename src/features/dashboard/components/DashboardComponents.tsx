export function MachineIcon({ type }) {
	const isWash =
		type.toLowerCase() === "wash" || type.toLowerCase() === "washer";
	const iconBg = isWash ? "bg-blue-100" : "bg-orange-100";

	return (
		<div
			class={`flex-shrink-0 w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}
		>
			{isWash ? (
				<svg
					class={`w-6 h-6 text-blue-600`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Washing Machine</title>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
					/>
				</svg>
			) : (
				<svg
					class={`w-6 h-6 text-orange-600`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Dryer</title>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			)}
		</div>
	);
}

export function AppointmentCard({ type, time, location, id }) {
	return (
		<div
			id={`appointment-item-${id}`}
			class="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50/50 transition-all bg-white"
		>
			<MachineIcon type={type} />
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<p class="font-bold text-slate-900 capitalize">{type}</p>
				</div>
				<p class="text-sm font-medium text-slate-600 mt-1">{time}</p>
				<p class="text-xs font-medium text-slate-500 mt-1">{location}</p>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
					title="Cancel"
					hx-delete={`/appointments/${id}`}
					hx-swap="none"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Cancel Appointment</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}

export function TimerCard({ machine, type, hall, timeLeft, status }) {
	const textColor = status ? "text-green-600" : "text-slate-700";

	// Format type to sentence case (e.g., "Washer", "Dryer")
	const formattedType =
		type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
	// Get prefix (W for Washer, D for Dryer)
	const prefix = formattedType.startsWith("W") ? "W" : "D";

	return (
		<div class="p-4 border rounded-lg border-slate-200 bg-white">
			<div class="flex items-center gap-4">
				<MachineIcon type={formattedType} />
				<div class="flex-1 min-w-0">
					<h3 class="font-bold text-slate-900">
						{formattedType} {prefix}-{machine.toString().padStart(2, "0")}
					</h3>
					<p class="text-sm font-medium text-slate-600 mt-0.5">{hall}</p>
				</div>
				<div class="text-right">
					<span class={`text-sm font-bold ${textColor}`}>{timeLeft}</span>
				</div>
			</div>
		</div>
	);
}

export function PaymentCard({
	balance,
	oob = false,
}: { balance: string; oob?: boolean }) {
	return (
		<div
			id="payment-summary"
			class="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-5 text-white shadow-lg"
			{...(oob ? { "hx-swap-oob": "true" } : {})}
		>
			<h2 class="text-lg font-bold mb-3">Payment Summary</h2>
			<div class="space-y-2">
				<div>
					<p class="text-sm font-medium text-slate-300">Current Balance</p>
					<p id="balance-amount" class="text-3xl font-extrabold mt-1">
						{balance}
					</p>
				</div>
				<a
					href="/payments"
					class="block w-full mt-3 py-2.5 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 transition-colors shadow-sm text-center"
				>
					Add Funds
				</a>
			</div>
		</div>
	);
}

export function ReminderCard({ title, time }: { title: string; time: string }) {
	return (
		<div class="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
			<svg
				class="w-5 h-5 text-amber-600 mt-0.5"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<title>Reminder</title>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
				></path>
			</svg>
			<div class="flex-1">
				<p class="text-sm font-bold text-slate-900">{title}</p>
				<p class="text-xs font-medium text-slate-600 mt-0.5">{time}</p>
			</div>
		</div>
	);
}

export function NoticeCard({
	title,
	description,
	author,
	time,
	type = "info",
}: {
	title: string;
	description: string;
	author: string;
	time: string;
	type?: "alert" | "info";
}) {
	const isAlert = type === "alert";
	const bgClass = isAlert
		? "bg-red-50 border-red-200"
		: "bg-slate-50 border-slate-100";
	const _iconColor = isAlert ? "text-red-600" : "hidden"; // Hide icon for normal notices based on snippet, or use generic? Snippet shows no icon for normal.

	return (
		<div class={`p-3 border rounded-lg ${bgClass}`}>
			<div class="flex items-start gap-2">
				{isAlert && (
					<svg
						class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Alert</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						></path>
					</svg>
				)}

				<div class="flex-1">
					<h4 class="text-sm font-bold text-slate-900">{title}</h4>
					<p class="text-xs font-medium text-slate-600 mt-1">{description}</p>
					<div class="flex items-center gap-2 mt-2">
						<span class="text-xs font-medium text-slate-500">{author}</span>
						<span class="text-xs text-slate-400">•</span>
						<span class="text-xs font-medium text-slate-500">{time}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
