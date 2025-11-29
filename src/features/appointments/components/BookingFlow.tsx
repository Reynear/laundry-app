import { formatCurrency, generateNext7Days } from "../utils";

/**
 * Formats duration in minutes to human-readable string.
 * Examples: 45 -> "45 min", 105 -> "1h 45m"
 */
function formatDuration(mins: number): string {
	if (mins < 60) return `${mins} min`;
	const hours = Math.floor(mins / 60);
	const remainingMins = mins % 60;
	if (remainingMins === 0) return `${hours}h`;
	return `${hours}h ${remainingMins}m`;
}

export function BookingFlow({
	serverTime,
	selectedDate,
	selectedServiceType,
	washerPrice,
	dryerPrice,
	loadCount,
	washDuration = 45,
	dryDuration = 60,
	maxAvailableLoads = 5,
}: {
	serverTime: Date;
	selectedDate: Date;
	selectedServiceType?: "wash" | "dry" | "wash_dry";
	washerPrice: number;
	dryerPrice: number;
	loadCount: number;
	washDuration?: number;
	dryDuration?: number;
	maxAvailableLoads?: number;
}) {
	// Calculate total duration for wash_dry (sequential: wash then dry)
	const washDryDuration = washDuration + dryDuration;
	const dates = generateNext7Days(serverTime);

	return (
		<div id="booking-flow" class="lg:col-span-2 space-y-6">
			{/* Step 1: Select Date */}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">
						1
					</div>
					<h2 class="text-lg font-bold text-gray-900">Select Date</h2>
				</div>

				<div class="grid grid-cols-7 gap-2">
					{dates.map((date) => {
						const isToday =
							date.getDate() === serverTime.getDate() &&
							date.getMonth() === serverTime.getMonth() &&
							date.getFullYear() === serverTime.getFullYear();
						const isSelected =
							date.toDateString() === selectedDate.toDateString();

						return (
							<button
								type="button"
								key={date.toISOString()}
								onclick={`selectDate('${date.toISOString()}', '${date.toLocaleDateString(
									"en-US",
									{
										weekday: "long",
										month: "short",
										day: "numeric",
									},
								)}')`}
								class={`date-btn flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
									isSelected
										? "ring-2 ring-blue-500 bg-blue-50 border-blue-500"
										: "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
								}`}
								data-date={date.toISOString()}
							>
								<span
									class={`text-xs font-medium weekday ${isSelected ? "text-slate-800" : "text-gray-500"}`}
								>
									{date.toLocaleDateString("en-US", { weekday: "short" })}
								</span>
								<span
									class={`text-lg font-bold day ${isSelected ? "text-slate-800" : "text-gray-900"}`}
								>
									{date.getDate()}
								</span>
								<span
									class={`text-xs month ${isSelected ? "text-slate-800" : "text-gray-500"}`}
								>
									{date.toLocaleDateString("en-US", { month: "short" })}
								</span>
								{isToday && (
									<span class="mt-1 text-[10px] font-bold text-slate-600">
										Today
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* Step 2: Select Service Type & Loads */}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">
						2
					</div>
					<h2 class="text-lg font-bold text-gray-900">
						Select Service & Loads
					</h2>
				</div>

				<div class="space-y-6">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{/* Wash Only */}
						<button
							type="button"
							onclick={`selectService('wash', ${washDuration})`}
							data-service="wash"
							class={`relative flex flex-col p-4 border rounded-xl transition-all text-left group service-btn ${
								selectedServiceType === "wash"
									? "border-slate-800 bg-slate-50 border-2"
									: "border-gray-200 bg-white hover:border-slate-500"
							}`}
						>
							<div class="flex justify-between items-start w-full mb-4">
								<div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
									<svg
										class="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="Wash service icon"
										role="img"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
										/>
									</svg>
								</div>
							</div>
							<h3 class="text-sm font-bold text-gray-900 mb-1">Wash Only</h3>
							<p class="text-xs text-gray-500 mb-2">
								{formatDuration(washDuration)}
							</p>
							<p class="text-lg font-bold text-gray-900">
								<span id="wash-price">{formatCurrency(washerPrice)}</span>
							</p>
						</button>

						{/* Dry Only */}
						<button
							type="button"
							onclick={`selectService('dry', ${dryDuration})`}
							data-service="dry"
							class={`relative flex flex-col p-4 border rounded-xl transition-all text-left group service-btn ${
								selectedServiceType === "dry"
									? "border-slate-800 bg-slate-50 border-2"
									: "border-gray-200 bg-white hover:border-slate-500"
							}`}
						>
							<div class="flex justify-between items-start w-full mb-4">
								<div class="w-10 h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
									<svg
										class="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="Dry service icon"
										role="img"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
										/>
									</svg>
								</div>
							</div>
							<h3 class="text-sm font-bold text-gray-900 mb-1">Dry Only</h3>
							<p class="text-xs text-gray-500 mb-2">
								{formatDuration(dryDuration)}
							</p>
							<p class="text-lg font-bold text-gray-900">
								<span id="dry-price">{formatCurrency(dryerPrice)}</span>
							</p>
						</button>

						{/* Wash & Dry */}
						<button
							type="button"
							onclick={`selectService('wash_dry', ${washDryDuration})`}
							data-service="wash_dry"
							class={`relative flex flex-col p-4 border rounded-xl transition-all text-left group service-btn ${
								selectedServiceType === "wash_dry"
									? "border-slate-800 bg-slate-50 border-2"
									: "border-gray-200 bg-white hover:border-slate-500"
							}`}
						>
							<div class="flex justify-between items-start w-full mb-4">
								<div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
									<svg
										class="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-label="Wash and dry service icon"
										role="img"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
								</div>
							</div>
							<h3 class="text-sm font-bold text-gray-900 mb-1">Wash & Dry</h3>
							<p class="text-xs text-gray-500 mb-2">
								{formatDuration(washDryDuration)}
							</p>
							<p class="text-lg font-bold text-gray-900">
								<span id="wash-dry-price">
									{formatCurrency(washerPrice + dryerPrice)}
								</span>
							</p>
						</button>
					</div>

					{/* Number of Loads Selection */}
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold text-gray-900">Number of Loads</h3>
								<p class="text-sm text-gray-500">Multiplier for total cost</p>
							</div>
							<div class="flex items-center gap-4 bg-gray-50 rounded-lg p-1">
								<button
									type="button"
									id="decrease-loads-btn"
									onclick="updateLoads(-1)"
									disabled={loadCount <= 1}
									class="w-10 h-10 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
									aria-label="Decrease loads"
								>
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 12H4"
										/>
									</svg>
								</button>
								<span
									id="load-count-display"
									class="text-lg font-semibold text-gray-900 w-8 text-center"
								>
									{loadCount}
								</span>
								<button
									type="button"
									id="increase-loads-btn"
									onclick="updateLoads(1)"
									disabled={loadCount >= maxAvailableLoads}
									class="w-10 h-10 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
									aria-label="Increase loads"
								>
									<svg
										class="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Step 3: Select Time */}
			<div class="bg-white rounded-xl border border-gray-200 p-6">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">
						3
					</div>
					<h2 class="text-lg font-bold text-gray-900">Select Start Time</h2>
				</div>

				<div class="space-y-4">
					<div>
						<h3 class="text-sm font-semibold text-gray-700 mb-3 capitalize">
							Available Slots
						</h3>
						{/* Time slots container - loaded via HTMX */}
						<div
							id="time-slots-container"
							class="min-h-[300px] transition-all duration-300"
						>
							<div class="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
								<p class="text-gray-500 font-medium">
									Please select a hall and service type
								</p>
								<p class="text-xs text-gray-400 mt-1">
									Time slots will load based on your selections
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
