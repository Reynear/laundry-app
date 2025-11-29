import type {
	NotificationSettings,
	UpcomingAppointment,
	ActiveSession,
} from "./types";

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
	enabled: true,
	appointmentReminderMins: 15,
	machineTimerAlerts: true,
};

// Track notified items to prevent duplicates
const notifiedAppointments = new Set<number>();
const notifiedSessions = new Set<number>();

// Polling intervals
let appointmentPollInterval: number | null = null;
let sessionPollInterval: number | null = null;

// ============ Settings Functions ============

export function getSettings(): NotificationSettings {
	const stored = localStorage.getItem("notification_settings");
	return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
}

export function updateSettings(
	settings: Partial<NotificationSettings>,
): NotificationSettings {
	const current = getSettings();
	const updated = { ...current, ...settings };
	localStorage.setItem("notification_settings", JSON.stringify(updated));
	return updated;
}

// ============ Permission Functions ============

export async function requestPermission(): Promise<boolean> {
	if (!("Notification" in window)) {
		console.warn("Desktop notifications not supported");
		return false;
	}

	if (Notification.permission === "granted") return true;
	if (Notification.permission === "denied") return false;

	const result = await Notification.requestPermission();
	return result === "granted";
}

export function hasPermission(): boolean {
	return "Notification" in window && Notification.permission === "granted";
}

// ============ Core Notification Function ============

export function sendNotification(
	title: string,
	options: NotificationOptions = {},
): Notification | null {
	if (!hasPermission()) return null;

	const notification = new Notification(title, {
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		...options,
	});

	// Auto-close after 10 seconds
	setTimeout(() => notification.close(), 10000);

	return notification;
}

// ============ Appointment Checking ============

export async function checkUpcomingAppointments(): Promise<void> {
	const settings = getSettings();
	if (!settings.enabled) return;

	try {
		const response = await fetch(
			`/api/notifications/upcoming-appointments?reminderMins=${settings.appointmentReminderMins}`,
		);
		if (!response.ok) return;

		const appointments: UpcomingAppointment[] = await response.json();

		for (const appt of appointments) {
			if (notifiedAppointments.has(appt.id)) continue;

			sendNotification("Upcoming Appointment", {
				body: `Your ${appt.serviceType} appointment at ${appt.hallName} is in ${appt.minutesUntil} minutes`,
				tag: `appointment-${appt.id}`,
			});

			notifiedAppointments.add(appt.id);
		}
	} catch (error) {
		console.error("Failed to check appointments:", error);
	}
}

// ============ Machine Timer Checking ============

export async function checkMachineTimers(): Promise<void> {
	const settings = getSettings();
	if (!settings.enabled || !settings.machineTimerAlerts) return;

	try {
		const response = await fetch("/api/notifications/active-sessions");
		if (!response.ok) return;

		const sessions: ActiveSession[] = await response.json();

		for (const session of sessions) {
			// Notify when <= 0 minutes remaining (completed)
			if (session.minutesRemaining <= 0 && !notifiedSessions.has(session.id)) {
				sendNotification("Laundry Complete!", {
					body: `Your ${session.machineType === "washer" ? "wash" : "dry"} cycle at ${session.hallName} is done`,
					tag: `session-${session.id}`,
				});

				notifiedSessions.add(session.id);
			}
		}
	} catch (error) {
		console.error("Failed to check machine timers:", error);
	}
}

// ============ Initialization ============

export async function initNotifications(): Promise<void> {
	const settings = getSettings();
	if (!settings.enabled) return;

	const hasPerms = await requestPermission();
	if (!hasPerms) {
		console.log("Notification permission denied");
		return;
	}

	startPolling();
}

export function startPolling(): void {
	stopPolling();

	// Poll for appointments every 30 seconds
	checkUpcomingAppointments();
	appointmentPollInterval = window.setInterval(
		checkUpcomingAppointments,
		30000,
	);

	// Poll for machine timers every 15 seconds
	checkMachineTimers();
	sessionPollInterval = window.setInterval(checkMachineTimers, 15000);
}

export function stopPolling(): void {
	if (appointmentPollInterval) {
		clearInterval(appointmentPollInterval);
		appointmentPollInterval = null;
	}
	if (sessionPollInterval) {
		clearInterval(sessionPollInterval);
		sessionPollInterval = null;
	}
}

// ============ Cleanup ============

export function clearNotificationHistory(): void {
	notifiedAppointments.clear();
	notifiedSessions.clear();
}
