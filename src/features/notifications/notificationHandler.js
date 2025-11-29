// NotificationHandler - Client-side notification manager
(function () {
	"use strict";

	// Default settings
	const DEFAULT_SETTINGS = {
		enabled: true,
		appointmentReminderMins: 15,
	};

	// Track notified items to prevent duplicates
	const notifiedAppointments = new Set();

	// Polling interval
	let appointmentPollInterval = null;

	// ============ Settings Functions ============

	function getSettings() {
		const stored = localStorage.getItem("notification_settings");
		return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
	}

	function updateSettings(settings) {
		const current = getSettings();
		const updated = { ...current, ...settings };
		localStorage.setItem("notification_settings", JSON.stringify(updated));

		// Restart polling if enabled status changed
		if (settings.enabled !== undefined) {
			if (settings.enabled) {
				startPolling();
			} else {
				stopPolling();
			}
		}

		return updated;
	}

	// ============ Permission Functions ============

	async function requestPermission() {
		if (!("Notification" in window)) {
			console.warn("Desktop notifications not supported");
			return false;
		}

		if (Notification.permission === "granted") return true;
		if (Notification.permission === "denied") return false;

		const result = await Notification.requestPermission();
		return result === "granted";
	}

	function hasPermission() {
		return "Notification" in window && Notification.permission === "granted";
	}

	// ============ Core Notification Function ============

	function sendNotification(title, options) {
		options = options || {};
		if (!hasPermission()) return null;

		const notification = new Notification(title, {
			icon: "/favicon.ico",
			badge: "/favicon.ico",
			...options,
		});

		// Auto-close after 10 seconds
		setTimeout(function () {
			notification.close();
		}, 10000);

		return notification;
	}

	// ============ Appointment Checking ============

	async function checkUpcomingAppointments() {
		const settings = getSettings();
		if (!settings.enabled) return;

		try {
			const response = await fetch(
				"/api/notifications/upcoming-appointments?reminderMins=" +
					settings.appointmentReminderMins,
			);
			if (!response.ok) return;

			const appointments = await response.json();

			for (const appt of appointments) {
				if (notifiedAppointments.has(appt.id)) continue;

				sendNotification("Upcoming Appointment", {
					body:
						"Your " +
						appt.serviceType +
						" appointment at " +
						appt.hallName +
						" is in " +
						appt.minutesUntil +
						" minutes",
					tag: "appointment-" + appt.id,
				});

				notifiedAppointments.add(appt.id);
			}
		} catch (error) {
			console.error("Failed to check appointments:", error);
		}
	}

	// ============ Polling Functions ============

	function startPolling() {
		stopPolling();

		// Poll for appointments every 30 seconds
		checkUpcomingAppointments();
		appointmentPollInterval = setInterval(checkUpcomingAppointments, 30000);
	}

	function stopPolling() {
		if (appointmentPollInterval) {
			clearInterval(appointmentPollInterval);
			appointmentPollInterval = null;
		}
	}

	// ============ Initialization ============

	async function initNotifications() {
		const settings = getSettings();
		if (!settings.enabled) return;

		const hasPerms = await requestPermission();
		if (!hasPerms) {
			console.log("Notification permission denied");
			return;
		}

		startPolling();
	}

	// ============ Expose to window ============

	window.NotificationHandler = {
		getSettings: getSettings,
		updateSettings: updateSettings,
		requestPermission: requestPermission,
		hasPermission: hasPermission,
	};

	// Auto-initialize when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initNotifications);
	} else {
		initNotifications();
	}
})();
