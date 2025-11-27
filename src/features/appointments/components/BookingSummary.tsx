import { getServiceDetailsSync } from "../AppointmentScheduler/ServiceDetails";
import { formatCurrency } from "../utils";

export function BookingSummary({
	hallName = "Not selected",
	selectedDate,
	selectedTime,
	selectedServiceType,
	washerPrice,
	dryerPrice,
	loadCount,
	washDuration = 45,
	dryDuration = 60,
	userBalance = 0,
	oob = false,
}: {
	hallName?: string;
	selectedDate: Date;
	selectedTime?: string;
	selectedServiceType?: "wash" | "dry" | "wash_dry";
	washerPrice: number;
	dryerPrice: number;
	loadCount: number;
	washDuration?: number;
	dryDuration?: number;
	userBalance?: number;
	oob?: boolean;
}) {
	const { label, price, duration } = getServiceDetailsSync(
		selectedServiceType,
		washerPrice,
		dryerPrice,
		washDuration,
		dryDuration,
	);
	const totalCost = price * loadCount;
	const cost = selectedServiceType
		? formatCurrency(totalCost)
		: formatCurrency(0);

	// Calculate if user has enough credits
	const hasEnoughCredits = userBalance >= totalCost;
	const shortfall = totalCost - userBalance;

	// Calculate end time if start time is selected
	let endTimeString = "";
	if (selectedTime && duration > 0) {
		const [time, period] = selectedTime.split(" ");
		const [hours, minutes] = time.split(":").map(Number);
		let slotHours = hours;
		if (period === "PM" && hours !== 12) slotHours += 12;
		if (period === "AM" && hours === 12) slotHours = 0;

		const startDate = new Date(selectedDate);
		startDate.setHours(slotHours, minutes, 0, 0);
		const endDate = new Date(startDate.getTime() + duration * 60000);
		endTimeString = endDate.toLocaleTimeString([], {
			hour: "numeric",
			minute: "2-digit",
		});
	}

	return (
		<div
			id="booking-summary"
			class="bg-white rounded-xl border border-gray-200 p-6 sticky top-24"
			{...(oob ? { "hx-swap-oob": "true" } : {})}
		>
			<h2 class="text-lg font-bold text-gray-900 mb-6">Booking Summary</h2>

			<div class="space-y-4">
				<div class="flex items-start gap-3">
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Hall"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Hall</p>
						<p class="text-sm font-semibold text-gray-900" id="summary-hall">
							{hallName}
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Date"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Date</p>
						<p class="text-sm font-semibold text-gray-900" id="summary-date">
							{selectedDate.toLocaleDateString("en-US", {
								weekday: "long",
								month: "short",
								day: "numeric",
							})}
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Start Time"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Start Time</p>
						<p class="text-sm font-semibold text-gray-900" id="summary-time">
							{selectedTime || "Not selected"}
						</p>
					</div>
				</div>

				<div
					class="flex items-start gap-3"
					id="summary-end-time-container"
					style={{ display: selectedTime ? "flex" : "none" }}
				>
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Estimated End Time"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Estimated End Time</p>
						<p
							class="text-sm font-semibold text-gray-900"
							id="summary-end-time"
						>
							{endTimeString}
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Service Type"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Service Type</p>
						<p class="text-sm font-semibold text-gray-900" id="summary-service">
							{label}
						</p>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<svg
						class="w-5 h-5 text-gray-400 mt-0.5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Number of Loads"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-xs font-medium text-gray-500">Number of Loads</p>
						<p class="text-sm font-semibold text-gray-900" id="summary-loads">
							{loadCount.toString()}
						</p>
					</div>
				</div>
			</div>

			<div class="mt-6 pt-6 border-t border-gray-200">
				{/* User Balance Display */}
				<div class="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
					<span class="text-sm font-medium text-gray-600">Your Balance</span>
					<span
						class={`text-sm font-semibold ${hasEnoughCredits || totalCost === 0 ? "text-green-600" : "text-red-600"}`}
						id="summary-balance"
					>
						{formatCurrency(userBalance)}
					</span>
				</div>

				<div class="flex items-center justify-between mb-4">
					<span class="text-sm font-medium text-gray-700">Total Cost</span>
					<span class="text-2xl font-bold text-gray-900" id="summary-cost">
						{cost}
					</span>
				</div>

				{/* Insufficient funds warning */}
				{!hasEnoughCredits && totalCost > 0 && (
					<div
						id="insufficient-funds-warning"
						class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
					>
						<div class="flex items-start gap-2">
							<svg
								class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-label="Warning"
								role="img"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
							<div>
								<p class="text-sm font-semibold text-red-700">
									Insufficient Credits
								</p>
								<p class="text-xs text-red-600 mt-0.5">
									You need {formatCurrency(shortfall)} more to book.{" "}
									<a href="/payments" class="underline font-medium">
										Add funds
									</a>
								</p>
							</div>
						</div>
					</div>
				)}

				<form
					id="booking-form"
					hx-post="/appointments/book"
					hx-swap="none"
					hx-preserve="true"
				>
					<input type="hidden" name="hallId" id="input-hallId" value="" />
					<input
						type="hidden"
						name="date"
						id="input-date"
						value={selectedDate.toISOString()}
					/>
					<input
						type="hidden"
						name="time"
						id="input-time"
						value={selectedTime || ""}
					/>
					<input
						type="hidden"
						name="serviceType"
						id="input-serviceType"
						value={selectedServiceType || ""}
					/>
					<input
						type="hidden"
						name="loads"
						id="input-loads"
						value={loadCount.toString()}
					/>
					<input
						type="hidden"
						name="totalCost"
						id="input-totalCost"
						value={totalCost.toString()}
					/>
					<input
						type="hidden"
						name="userBalance"
						id="input-userBalance"
						value={userBalance.toString()}
					/>
					<button
						type="submit"
						id="confirm-booking-btn"
						disabled
						data-has-enough-credits={hasEnoughCredits || totalCost === 0}
						class="w-full py-3 rounded-lg font-semibold transition-all duration-200 bg-gray-300 text-white cursor-not-allowed"
					>
						{hasEnoughCredits || totalCost === 0
							? "Confirm Booking"
							: "Insufficient Credits"}
					</button>
				</form>
				<p class="text-xs text-gray-500 text-center mt-3">
					Credits will be deducted upon booking
				</p>
			</div>
		</div>
	);
}
