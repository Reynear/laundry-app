import { BookingFlow } from "../../features/appointments/components/BookingFlow";
import { BookingSummary } from "../../features/appointments/components/BookingSummary";

export function BookAppointment({
	serverTime,
	selectedDate,
	selectedServiceType,
	washerPrice,
	dryerPrice,
	loadCount = 1,
	washDuration = 45,
	dryDuration = 60,
	halls,
	userBalance = 0,
}: {
	serverTime: Date;
	selectedDate?: Date;
	selectedServiceType?: "wash" | "dry" | "wash_dry";
	washerPrice: number;
	dryerPrice: number;
	loadCount: number;
	washDuration?: number;
	dryDuration?: number;
	halls: Hall[];
	userBalance?: number;
}) {
	const activeDate = selectedDate || serverTime;
	const dateDisplay = activeDate.toLocaleDateString("en-US", {
		weekday: "long",
		month: "short",
		day: "numeric",
	});
	const loadCountValue =
		Number.isFinite(loadCount) && loadCount > 0 ? loadCount : 1;
	return (
		<>
			{/* Error container for OOB swaps */}
			<div id="booking-error" />

			{/* Client-side Booking Logic */}
			<style>
				{`
          #loading-spinner.htmx-request {
            opacity: 1;
            transition-delay: 2s;
          }
        `}
			</style>
			{/* Load External Booking Script */}
			<script src="/bookingScript.js"></script>

			<div
				id="booking-root"
				class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
				data-active-date={activeDate.toISOString()}
				data-date-display={dateDisplay}
				data-service-type={selectedServiceType ?? ""}
				data-loads={loadCountValue}
				data-washer-price={washerPrice}
				data-dryer-price={dryerPrice}
				data-wash-duration={washDuration}
				data-dry-duration={dryDuration}
				data-user-balance={userBalance}
			>
				<div class="mb-8">
					<h1 class="text-3xl font-bold text-gray-900">Book an Appointment</h1>
					<p class="mt-2 text-gray-600">
						Select your preferred time and machines
					</p>
				</div>

				{/* Hall Selection */}
				<div class="mb-8">
					<label
						htmlFor="hall-select"
						class="block text-sm font-medium text-gray-700 mb-2"
					>
						Select Residence Hall
					</label>
					<select
						id="hall-select"
						name="hallId"
						class="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-100 transition-all"
						onchange="selectHall(this.value, this.options[this.selectedIndex].text)"
					>
						<option value="" selected disabled>
							Choose a residence hall...
						</option>
						{halls.map((hall) => (
							<option value={hall.id.toString()}>{hall.name}</option>
						))}
					</select>
				</div>

				{/* Booking Flow */}
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<BookingFlow
						serverTime={serverTime}
						selectedDate={activeDate}
						selectedServiceType={selectedServiceType}
						washerPrice={washerPrice}
						dryerPrice={dryerPrice}
						loadCount={loadCountValue}
						washDuration={washDuration}
						dryDuration={dryDuration}
					/>

					{/* Right Column - Summary */}
					<div class="space-y-6">
						<BookingSummary
							selectedDate={activeDate}
							selectedTime={undefined}
							selectedServiceType={selectedServiceType}
							washerPrice={washerPrice}
							dryerPrice={dryerPrice}
							loadCount={loadCountValue}
							washDuration={washDuration}
							dryDuration={dryDuration}
							userBalance={userBalance}
						/>

						{/* Quick Info */}
						<div class="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-5 shadow-lg border border-slate-200">
							<div class="flex items-start gap-3">
								<svg
									class="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="Information icon"
									role="img"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<div>
									<h3 class="text-sm font-bold text-slate-900 mb-1">
										Booking Tips
									</h3>
									<ul class="text-xs text-slate-700 space-y-1">
										<li>• Book early for popular time slots</li>
										<li>• Arrive 5 minutes before your slot</li>
										<li>• Cancel at least 30 mins in advance</li>
										<li>• Set a reminder for your appointment</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
