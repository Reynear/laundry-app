import { Hono } from "hono";
import { DashboardLayout } from "../../layouts";
import { BookAppointment } from "../../pages/client/BookAppointment";
import { StaffAppointments } from "../../pages/staff/StaffAppointments";
import {
	appointmentRepository,
	hallRepository,
	paymentRepository,
} from "../../Repositories";
import { PaymentCard } from "../dashboard/components/DashboardComponents";
import {
	cancelReservation,
	createReservation,
} from "./AppointmentScheduler/ReservationManager";
import {
	getAvailableSlots,
	getMachineDuration,
} from "./AppointmentScheduler/SlotValidator";
import { AppointmentListContainer } from "./components/AppointmentListContainer";
import { AppointmentListItem } from "./components/AppointmentListItem";
import { BookingSummary } from "./components/BookingSummary";
import { formatCurrency } from "./utils";

const app = new Hono();

// GET /appointments - Show appointments list (for staff/manager)
app.get("/", async (c) => {
	const user = c.get("user") as User;

	// Get filter from query params
	const filter =
		(c.req.query("filter") as "upcoming" | "past" | "all") || "upcoming";

	// Staff and managers see only their hall's appointments
	if (user.role === "staff" || user.role === "manager") {
		const appointments = await appointmentRepository.getAppointmentsByHall(
			user.hallId,
			filter,
		);
		return c.html(
			<StaffAppointments
				user={user}
				appointments={appointments}
				filter={filter}
			/>,
		);
	}

	// Admins see all appointments
	const appointments = await appointmentRepository.getAllAppointments(filter);

	return c.html(
		<DashboardLayout user={user} currentPath="/appointments">
			<div class="p-6">
				<div class="mb-6">
					<h1 class="text-2xl font-bold text-slate-900">Appointments</h1>
					<p class="text-sm text-slate-500 mt-1">
						Manage all laundry appointments
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
		</DashboardLayout>,
	);
});

// GET /appointments/book - Show booking form
app.get("/book", async (c) => {
	const user = c.get("user") as User;

	const hall = await hallRepository.getHallById(user.hallId);
	if (!hall) return c.text("Hall not found", 404);

	// Parse query parameters
	const dateStr = c.req.query("date");
	const serviceType = c.req.query("serviceType") as
		| "wash"
		| "dry"
		| "wash_dry"
		| undefined;
	const loadsStr = c.req.query("loads");
	const loadCount = parseInt(loadsStr, 10);

	const serverTime = new Date();

	// Validate selectedDate is within the displayable 7-day range
	// If outside range (past or >7 days in future), clamp to serverTime
	let selectedDate = serverTime;
	if (dateStr) {
		const parsedDate = new Date(dateStr);

		// Create min date (start of today) - avoid toDateString() which produces unreliable format
		const minDate = new Date(serverTime);
		minDate.setHours(0, 0, 0, 0);

		// Create max date (end of day 6 days from now)
		const maxDate = new Date(serverTime);
		maxDate.setDate(serverTime.getDate() + 6); // 7 days including today
		maxDate.setHours(23, 59, 59, 999);

		// Only use parsed date if it's valid and within range (today to 6 days from now)
		if (
			!Number.isNaN(parsedDate.getTime()) &&
			parsedDate >= minDate &&
			parsedDate <= maxDate
		) {
			selectedDate = parsedDate;
		}
	}

	// Get hall-specific prices directly from hall
	const washerPrice = hall.washerPrice;
	const dryerPrice = hall.dryerPrice;
	const washDuration = await getMachineDuration(hall.id, "washer");
	const dryDuration = await getMachineDuration(hall.id, "dryer");

	const halls = await hallRepository.getAllHalls();

	// Get user's wallet balance for credit validation
	const userBalance = await paymentRepository.getUserBalance(user.id);

	// Initial page render - slots will be loaded via HTMX after user selects hall + service
	return c.html(
		<DashboardLayout user={user} currentPath="/appointments/book">
			<BookAppointment
				serverTime={serverTime}
				selectedDate={selectedDate}
				selectedServiceType={serviceType}
				washerPrice={washerPrice}
				dryerPrice={dryerPrice}
				loadCount={loadCount}
				washDuration={washDuration}
				dryDuration={dryDuration}
				halls={halls}
				userBalance={userBalance}
			/>
		</DashboardLayout>,
	);
});

// GET endpoint for fetching available time slots (HTMX)
app.get("/slots", async (c) => {
	// Parse query parameters
	const dateStr = c.req.query("date");
	const serviceType = c.req.query("serviceType") as
		| "wash"
		| "dry"
		| "wash_dry"
		| undefined;
	const loadsStr = c.req.query("loads");
	const loadCount = parseInt(loadsStr, 10);
	const hallIdStr = c.req.query("hallId");

	// Validate required parameters
	if (!dateStr || !serviceType) {
		return c.html(<div />);
	}

	// Get hall - either from query param or from user's default hall
	let hall: Hall | null = null;
	if (hallIdStr) {
		hall = await hallRepository.getHallById(Number(hallIdStr));
	} else {
		const user = c.get("user") as User;
		hall = await hallRepository.getHallById(user.hallId);
	}
	if (!hall) return c.html(<div />);

	const selectedDate = new Date(dateStr);

	// Get available slots via Scheduler
	const { slots: timeSlots, machineError } = await getAvailableSlots(
		hall,
		selectedDate,
		serviceType,
		loadCount,
	);

	// Render just the time slots grid
	return c.html(
		<div id="time-slots-grid">
			{machineError ? (
				<div class="text-center py-8 bg-amber-50 rounded-lg border border-dashed border-amber-300">
					<svg
						class="w-10 h-10 mx-auto text-amber-500 mb-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-label="Warning icon"
						role="img"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<p class="text-amber-700 font-medium">{machineError}</p>
					<p class="text-xs text-amber-600 mt-1">
						Please select a different hall or service type
					</p>
				</div>
			) : timeSlots.length > 0 ? (
				<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
					{timeSlots.map((time) => (
						<button
							type="button"
							onclick={`selectTime('${time}')`}
							class="px-3 py-2 text-sm font-medium rounded-lg border transition-all bg-white text-gray-700 border-gray-200 hover:border-slate-500 hover:text-slate-900 hover:bg-slate-50 time-slot-btn"
							data-time={time}
						>
							{time}
						</button>
					))}
				</div>
			) : (
				<div class="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
					<p class="text-gray-500 font-medium">No Times are Available</p>
					<p class="text-xs text-gray-400 mt-1">
						Please select another date or service type
					</p>
				</div>
			)}
		</div>,
	);
});

// GET /appointments/book/update - Combined update for prices + summary (HTMX)
// Returns HTML snippets for price displays and summary via OOB swaps
app.get("/book/update", async (c) => {
	const hallIdStr = c.req.query("hallId");
	const hallName = c.req.query("hallName") || "Not selected";
	const dateStr = c.req.query("date");
	const serviceType = c.req.query("serviceType") as
		| "wash"
		| "dry"
		| "wash_dry"
		| undefined;
	const loadsStr = c.req.query("loads");
	const loadCount = Number.parseInt(loadsStr, 10);
	const time = c.req.query("time");

	const user = c.get("user") as User;

	// Placeholder Values
	let washerPrice = 0;
	let dryerPrice = 0;
	let washDuration = 45;
	let dryDuration = 60;

	if (hallIdStr) {
		const hallId = Number(hallIdStr);
		const hall = await hallRepository.getHallById(hallId);
		if (hall) {
			washerPrice = hall.washerPrice;
			dryerPrice = hall.dryerPrice;
		}
		washDuration = await getMachineDuration(hallId, "washer");
		dryDuration = await getMachineDuration(hallId, "dryer");
	}

	// Parse date
	const selectedDate = dateStr ? new Date(dateStr) : new Date();

	// Get user's wallet balance for credit validation
	const userBalance = await paymentRepository.getUserBalance(user.id);

	// Return HTML that updates price displays AND summary via HTMX OOB swaps
	return c.html(
		<>
			{/* Update washer price display */}
			<span id="wash-price" hx-swap-oob="true">
				{formatCurrency(washerPrice)}
			</span>
			{/* Update dryer price display */}
			<span id="dry-price" hx-swap-oob="true">
				{formatCurrency(dryerPrice)}
			</span>
			{/* Update wash & dry price display */}
			<span id="wash-dry-price" hx-swap-oob="true">
				{formatCurrency(washerPrice + dryerPrice)}
			</span>
			{/* Update summary */}
			<BookingSummary
				hallName={hallName}
				selectedDate={selectedDate}
				selectedTime={time}
				selectedServiceType={serviceType}
				washerPrice={washerPrice}
				dryerPrice={dryerPrice}
				loadCount={loadCount}
				washDuration={washDuration}
				dryDuration={dryDuration}
				userBalance={userBalance}
				oob={true}
			/>
		</>,
	);
});

// POST /appointments/book - Process booking
app.post("/book", async (c) => {
	const body = await c.req.parseBody();
	const hallId = Number(body.hallId);
	const dateStr = String(body.date); // YYYY-MM-DD
	const timeStr = String(body.time); // HH:mm
	const serviceType = String(body.serviceType) as "wash" | "dry" | "wash_dry";
	const loads = Number(body.loads);

	const user = c.get("user") as User;
	const userId = user.id;

	// Parse time string to get hours and minutes
	const [timeOnly, period] = timeStr.split(" ");
	const [hoursStr, minutesStr] = timeOnly.split(":");
	let hours = parseInt(hoursStr, 10);
	const minutes = parseInt(minutesStr, 10);

	if (period === "PM" && hours !== 12) hours += 12;
	if (period === "AM" && hours === 12) hours = 0;

	// Parse datetime
	const appointmentDatetime = new Date(dateStr);
	appointmentDatetime.setHours(hours, minutes, 0, 0);

	// Get hall-specific prices and machine durations from hall directly
	const hall = await hallRepository.getHallById(hallId);
	if (!hall) return c.text("Hall not found", 404);
	const washerPrice = hall.washerPrice;
	const dryerPrice = hall.dryerPrice;
	const washDuration = await getMachineDuration(hallId, "washer");
	const dryDuration = await getMachineDuration(hallId, "dryer");

	// Calculate total cost for the booking
	let totalBookingCost: number;
	if (serviceType === "wash_dry") {
		totalBookingCost = (washerPrice + dryerPrice) * loads;
	} else if (serviceType === "wash") {
		totalBookingCost = washerPrice * loads;
	} else {
		totalBookingCost = dryerPrice * loads;
	}

	// Validate user has enough credits before booking
	const creditValidation = await paymentRepository.validateBookingCredits(
		userId,
		totalBookingCost,
	);

	if (!creditValidation.canBook) {
		return c.html(
			<div
				id="booking-error"
				hx-swap-oob="true"
				class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
				role="alert"
			>
				<strong class="font-bold">Insufficient Credits!</strong>
				<span class="block sm:inline">
					{" "}
					You need {formatCurrency(creditValidation.shortfall)} more to complete
					this booking. Current balance:{" "}
					{formatCurrency(creditValidation.currentBalance)}
				</span>
				<button
					type="button"
					class="absolute top-0 bottom-0 right-0 px-4 py-3"
					onclick="this.parentElement.remove()"
				>
					<svg
						class="fill-current h-6 w-6 text-red-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
					>
						<title>Close</title>
						<path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
					</svg>
				</button>
			</div>,
		);
	}

	try {
		const createdAppointmentIds: number[] = [];

		if (serviceType === "wash_dry") {
			// For wash_dry with N loads, create N wash appointments and N dry appointments
			// Each appointment books 1 machine for 1 load (parallel processing)
			// Book sequentially to ensure different machines are assigned

			// Book wash appointments first (sequentially to ensure different machines)
			for (let i = 0; i < loads; i++) {
				const appointment = await createReservation({
					userId,
					hallId,
					appointmentDatetime,
					durationMins: washDuration,
					serviceType: "wash",
					totalCost: washerPrice,
				});
				createdAppointmentIds.push(appointment.id);
			}

			// Book dry appointments (sequentially, starts after wash cycle)
			const dryDatetime = new Date(
				appointmentDatetime.getTime() + washDuration * 60000,
			);
			for (let i = 0; i < loads; i++) {
				const appointment = await createReservation({
					userId,
					hallId,
					appointmentDatetime: dryDatetime,
					durationMins: dryDuration,
					serviceType: "dry",
					totalCost: dryerPrice,
				});
				createdAppointmentIds.push(appointment.id);
			}
		} else {
			// For wash-only or dry-only with N loads, create N appointments
			// Each appointment books 1 machine for 1 load (parallel processing)
			const singleLoadDuration =
				serviceType === "wash" ? washDuration : dryDuration;
			const singleLoadCost = serviceType === "wash" ? washerPrice : dryerPrice;

			for (let i = 0; i < loads; i++) {
				const appointment = await createReservation({
					userId,
					hallId,
					appointmentDatetime,
					durationMins: singleLoadDuration,
					serviceType: serviceType as "wash" | "dry",
					totalCost: singleLoadCost,
				});
				createdAppointmentIds.push(appointment.id);
			}
		}

		// Deduct credits from user's wallet after successful booking
		await paymentRepository.deductCredits(
			userId,
			totalBookingCost,
			createdAppointmentIds[0], // Use first appointment ID as reference
		);

		// Return success redirect header for HTMX
		c.header("HX-Redirect", "/dashboard");
		return c.text("Booking successful");
	} catch (error) {
		console.error("Booking failed:", error);
		// Return error message OOB
		return c.html(
			<div
				id="booking-error"
				hx-swap-oob="true"
				class="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
				role="alert"
			>
				<strong class="font-bold">Error!</strong>
				<span class="block sm:inline">
					{" "}
					{error instanceof Error
						? error.message
						: "Failed to create appointment"}
				</span>
				<button
					type="button"
					class="absolute top-0 bottom-0 right-0 px-4 py-3"
					onclick="this.parentElement.remove()"
				>
					<svg
						class="fill-current h-6 w-6 text-red-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
					>
						<title>Close</title>
						<path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
					</svg>
				</button>
			</div>,
		);
	}
});

// DELETE endpoint for cancelling an appointment
app.delete("/:id", async (c) => {
	const id = Number.parseInt(c.req.param("id"), 10);

	// Get appointment details before cancelling (for refund)
	const appointment = await appointmentRepository.getAppointmentById(id);
	if (!appointment) {
		return c.text("Appointment not found", 404);
	}

	// Cancel the reservation
	const success = await cancelReservation(id);

	if (success) {
		// Refund the appointment cost to user's wallet
		const { newBalance } = await paymentRepository.addCredits(
			appointment.userId,
			appointment.totalCost,
			`refund_appointment_${id}`,
		);

		return c.html(
			<>
				{/* Remove the appointment card */}
				<div id={`appointment-item-${id}`} hx-swap-oob="delete" />
				{/* Update the payment summary with new balance */}
				<PaymentCard balance={formatCurrency(newBalance)} oob={true} />
			</>,
			200,
			{
				"HX-Trigger": "appointmentCancelled",
			},
		);
	}

	return c.text("Failed to cancel appointment", 500);
});

// PATCH endpoint for updating appointment status
app.patch("/:id/status", async (c) => {
	const id = Number.parseInt(c.req.param("id"), 10);
	const body = await c.req.parseBody();
	const status = body.status as "completed" | "no_show";

	// Validate status
	if (status !== "completed" && status !== "no_show") {
		return c.text("Invalid status. Must be 'completed' or 'no_show'", 400);
	}

	const appointment = await appointmentRepository.updateStatus(id, status);

	if (!appointment) {
		return c.text("Appointment not found", 404);
	}

	// Return updated appointment item
	return c.html(<AppointmentListItem appointment={appointment} />);
});

export default app;
