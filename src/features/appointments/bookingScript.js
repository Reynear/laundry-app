// State will be initialized when DOM is ready
let state;

/**
 * Triggers HTMX request to update prices and summary
 */
function triggerUpdate() {
	if (!state.hallId) return;

	const params = new URLSearchParams({
		hallId: state.hallId,
		hallName: state.hallName,
		date: state.date,
		serviceType: state.serviceType || "",
		loads: String(state.loads),
		time: state.time || "",
	});

	// Trigger HTMX request to update prices and summary via OOB swaps
	htmx.ajax("GET", `/appointments/book/update?${params.toString()}`, {
		swap: "none",
	});
}

/**
 * Triggers HTMX request to fetch available time slots
 */
function checkAndFetchSlots() {
	const container = document.getElementById("time-slots-container");
	if (!container) return;

	if (state.hallId && state.date && state.serviceType) {
		// Prepare the container with the spinner (hidden by default via CSS)
		container.innerHTML =
			'<div id="loading-spinner" class="col-span-full h-full flex flex-col items-center justify-center text-center py-8 opacity-0 transition-opacity duration-200"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div><p class="mt-2 text-gray-500">Loading slots...</p></div>';

		// Trigger HTMX request
		htmx.ajax(
			"GET",
			`/appointments/slots?date=${state.date}&serviceType=${state.serviceType}&loads=${state.loads}&hallId=${state.hallId}`,
			{
				target: "#time-slots-container",
				indicator: "#loading-spinner",
			},
		);
	} else {
		// Show instruction
		container.innerHTML = `
      <div class="col-span-full text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p class="text-gray-500 font-medium">
          Please select a hall and service type
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Time slots will load based on your selections
        </p>
      </div>
     `;
	}
}

/**
 * Updates the confirm button state and hidden form inputs
 */
function updateConfirmButton() {
	const confirmBtn = document.getElementById("confirm-booking-btn");
	if (!confirmBtn) return;

	const isFormValid =
		state.hallId && state.date && state.serviceType && state.time;

	// Check if user has enough credits (set server-side via data attribute)
	const hasEnoughCredits = confirmBtn.dataset.hasEnoughCredits === "true";

	const canBook = isFormValid && hasEnoughCredits;

	if (canBook) {
		confirmBtn.removeAttribute("disabled");
		confirmBtn.classList.remove(
			"bg-gray-300",
			"bg-red-300",
			"cursor-not-allowed",
		);
		confirmBtn.classList.add(
			"bg-slate-800",
			"text-white",
			"hover:bg-slate-900",
			"shadow-md",
			"hover:shadow-lg",
		);
		confirmBtn.textContent = "Confirm Booking";

		// Update hidden inputs
		const hallIdInput = document.getElementById("input-hallId");
		const dateInput = document.getElementById("input-date");
		const timeInput = document.getElementById("input-time");
		const serviceTypeInput = document.getElementById("input-serviceType");
		const loadsInput = document.getElementById("input-loads");

		if (hallIdInput) hallIdInput.value = state.hallId;
		if (dateInput) dateInput.value = state.date;
		if (timeInput) timeInput.value = state.time;
		if (serviceTypeInput) serviceTypeInput.value = state.serviceType;
		if (loadsInput) loadsInput.value = String(state.loads);
	} else {
		confirmBtn.setAttribute("disabled", "true");
		confirmBtn.classList.remove(
			"bg-slate-800",
			"text-white",
			"hover:bg-slate-900",
			"shadow-md",
			"hover:shadow-lg",
		);

		// Show different styling if insufficient credits vs incomplete form
		if (isFormValid && !hasEnoughCredits) {
			confirmBtn.classList.remove("bg-gray-300");
			confirmBtn.classList.add("bg-red-300", "cursor-not-allowed");
			confirmBtn.textContent = "Insufficient Credits";
		} else {
			confirmBtn.classList.remove("bg-red-300");
			confirmBtn.classList.add("bg-gray-300", "cursor-not-allowed");
			confirmBtn.textContent = "Confirm Booking";
		}
	}
}

function selectHall(id, name) {
	state.hallId = id;
	state.hallName = name;
	triggerUpdate();
	checkAndFetchSlots();
	updateConfirmButton();
}

function selectDate(dateStr, dateDisplay) {
	state.date = dateStr;
	state.dateDisplay = dateDisplay;
	state.time = ""; // Reset time when date changes

	// Update UI selection
	document.querySelectorAll(".date-btn").forEach((btn) => {
		const element = btn;
		if (element.dataset.date === dateStr) {
			element.classList.add(
				"ring-2",
				"ring-blue-500",
				"bg-blue-50",
				"border-blue-500",
			);
			element.classList.remove(
				"border-gray-200",
				"hover:border-blue-300",
				"hover:bg-gray-50",
			);

			// Update text colors
			element.querySelector(".weekday")?.classList.remove("text-gray-500");
			element.querySelector(".weekday")?.classList.add("text-slate-800");

			element.querySelector(".day")?.classList.remove("text-gray-900");
			element.querySelector(".day")?.classList.add("text-slate-800");

			element.querySelector(".month")?.classList.remove("text-gray-500");
			element.querySelector(".month")?.classList.add("text-slate-800");
		} else {
			element.classList.remove(
				"ring-2",
				"ring-blue-500",
				"bg-blue-50",
				"border-blue-500",
			);
			element.classList.add(
				"border-gray-200",
				"hover:border-blue-300",
				"hover:bg-gray-50",
			);

			// Reset text colors
			element.querySelector(".weekday")?.classList.add("text-gray-500");
			element.querySelector(".weekday")?.classList.remove("text-slate-800");

			element.querySelector(".day")?.classList.add("text-gray-900");
			element.querySelector(".day")?.classList.remove("text-slate-800");

			element.querySelector(".month")?.classList.add("text-gray-500");
			element.querySelector(".month")?.classList.remove("text-slate-800");
		}
	});

	triggerUpdate();
	checkAndFetchSlots();
	updateConfirmButton();
}

function selectService(type, duration) {
	state.serviceType = type;
	state.serviceDuration = duration;
	state.time = ""; // Reset time when service changes

	// Adjust loads if it exceeds new service type's max
	const maxLoads = type === "wash_dry" ? 2 : 4;
	if (state.loads > maxLoads) {
		state.loads = maxLoads;
		const loadDisplay = document.getElementById("load-count-display");
		if (loadDisplay) loadDisplay.textContent = String(state.loads);
	}

	// Update button states based on new max
	const decreaseBtn = document.getElementById("decrease-loads-btn");
	if (decreaseBtn) decreaseBtn.disabled = state.loads <= 1;

	const increaseBtn = document.getElementById("increase-loads-btn");
	if (increaseBtn) increaseBtn.disabled = state.loads >= maxLoads;

	// Update UI
	document.querySelectorAll(".service-btn").forEach((btn) => {
		const element = btn;
		if (element.dataset.service === type) {
			element.classList.add("border-slate-800", "bg-slate-50", "border-2");
			element.classList.remove(
				"border-gray-200",
				"bg-white",
				"hover:border-slate-500",
			);
		} else {
			element.classList.remove("border-slate-800", "bg-slate-50", "border-2");
			element.classList.add(
				"border-gray-200",
				"bg-white",
				"hover:border-slate-500",
			);
		}
	});

	triggerUpdate();
	checkAndFetchSlots();
	updateConfirmButton();
}

function updateLoads(delta) {
	// Determine max loads based on service type
	// Wash & Dry: max 2 loads (requires both washer and dryer for each)
	// Wash or Dry only: max 4 loads
	const maxLoads = state.serviceType === "wash_dry" ? 2 : 4;

	const newLoads = state.loads + delta;
	if (newLoads >= 1 && newLoads <= maxLoads) {
		state.loads = newLoads;

		// Update UI
		const loadDisplay = document.getElementById("load-count-display");
		if (loadDisplay) loadDisplay.textContent = String(state.loads);

		const decreaseBtn = document.getElementById("decrease-loads-btn");
		if (decreaseBtn) decreaseBtn.disabled = state.loads <= 1;

		const increaseBtn = document.getElementById("increase-loads-btn");
		if (increaseBtn) increaseBtn.disabled = state.loads >= maxLoads;

		triggerUpdate();
		checkAndFetchSlots();
		updateConfirmButton();
	}
}

function selectTime(time) {
	state.time = time;

	// Update UI
	document.querySelectorAll(".time-slot-btn").forEach((btn) => {
		const element = btn;
		if (element.dataset.time === time) {
			element.classList.add("bg-slate-800", "text-white", "border-slate-800");
			element.classList.remove(
				"bg-white",
				"text-gray-700",
				"border-gray-200",
				"hover:border-slate-500",
				"hover:text-slate-900",
				"hover:bg-slate-50",
			);
		} else {
			element.classList.remove(
				"bg-slate-800",
				"text-white",
				"border-slate-800",
			);
			if (!element.disabled) {
				element.classList.add(
					"bg-white",
					"text-gray-700",
					"border-gray-200",
					"hover:border-slate-500",
					"hover:text-slate-900",
					"hover:bg-slate-50",
				);
			}
		}
	});

	triggerUpdate();
	updateConfirmButton();
}

// Make functions globally accessible for HTML event handlers
window.selectHall = selectHall;
window.selectDate = selectDate;
window.selectService = selectService;
window.updateLoads = updateLoads;
window.selectTime = selectTime;

// Initialize application when DOM is ready
function initializeBookingApp() {
	// Default state values
	const defaultState = {
		hallId: "",
		hallName: "",
		date: new Date().toISOString(),
		dateDisplay: "",
		serviceType: "",
		serviceDuration: 0,
		loads: 1,
		time: "",
		washerPrice: 0,
		dryerPrice: 0,
		washDuration: 45,
		dryDuration: 60,
		userBalance: 0,
	};

	/**
	 * Infers service duration based on service type and DB-backed machine durations.
	 * @param {string} serviceType - 'wash', 'dry', or 'wash_dry'
	 * @param {number} washDuration - Duration for wash cycle from DB
	 * @param {number} dryDuration - Duration for dry cycle from DB
	 * @returns {number} Total duration in minutes
	 */
	function inferDuration(serviceType, washDuration, dryDuration) {
		switch (serviceType) {
			case "wash":
				return washDuration;
			case "dry":
				return dryDuration;
			case "wash_dry":
				return washDuration + dryDuration;
			default:
				return 0;
		}
	}

	// Read initial state from JSON script element or window.bookingState
	let initialState = {};
	const stateElement = document.getElementById("booking-state-data");
	if (stateElement) {
		try {
			initialState = JSON.parse(stateElement.textContent || "{}");
		} catch (e) {
			console.error("Failed to parse booking state:", e);
		}
	} else if (window.bookingState) {
		initialState = window.bookingState;
	} else {
		const rootElement = document.getElementById("booking-root");
		if (rootElement) {
			const dataset = rootElement.dataset;
			const washDuration = Number(dataset.washDuration) || 45;
			const dryDuration = Number(dataset.dryDuration) || 60;
			initialState = {
				date: dataset.activeDate || "",
				dateDisplay: dataset.dateDisplay || "",
				serviceType: dataset.serviceType || "",
				serviceDuration: inferDuration(
					dataset.serviceType,
					washDuration,
					dryDuration,
				),
				loads: Number(dataset.loads) || 1,
				washerPrice: Number(dataset.washerPrice) || 0,
				dryerPrice: Number(dataset.dryerPrice) || 0,
				washDuration: washDuration,
				dryDuration: dryDuration,
				userBalance: Number(dataset.userBalance) || 0,
			};
		}
	}

	// Merge with defaults to ensure all properties exist
	state = { ...defaultState, ...initialState };

	// Ensure numeric values are properly typed
	state.washerPrice = Number(state.washerPrice) || 0;
	state.dryerPrice = Number(state.dryerPrice) || 0;
	state.loads = Number(state.loads) || 1;
	state.serviceDuration = Number(state.serviceDuration) || 0;
	state.washDuration = Number(state.washDuration) || 45;
	state.dryDuration = Number(state.dryDuration) || 60;
	state.userBalance = Number(state.userBalance) || 0;

	// Read current hall selection from dropdown if it exists
	const hallSelect = document.getElementById("hall-select");
	if (hallSelect?.value) {
		state.hallId = hallSelect.value;
		state.hallName = hallSelect.options[hallSelect.selectedIndex].text;
	}

	// Initial button state
	updateConfirmButton();
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initializeBookingApp);
} else {
	// DOM is already loaded (e.g., script was deferred)
	initializeBookingApp();
}
