// Helper function to format appointment time
export function formatAppointmentTime(date: Date) {
	const now = new Date();
	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	const isTomorrow =
		date.getDate() === now.getDate() + 1 &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	const timeString = date.toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});

	if (isToday) return `Today at ${timeString}`;
	if (isTomorrow) return `Tomorrow at ${timeString}`;
	return `${date.toLocaleDateString([], {
		weekday: "long",
		month: "short",
		day: "numeric",
	})} at ${timeString}`;
}

// Helper function to format notice time
export function formatNoticeTime(date: Date) {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffHours < 1) return "Just now";
	if (diffHours < 24)
		return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
	return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

// Helper function to calculate time remaining
export function getTimeRemaining(session: MachineSession) {
	const now = new Date();
	const start = new Date(session.startTime);
	const expectedEnd = new Date(session.expectedEndTime);
	const totalDuration = expectedEnd.getTime() - start.getTime();
	const elapsed = now.getTime() - start.getTime();

	let progress = 0;
	if (totalDuration > 0) {
		progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
	}

	const isFinished = progress >= 100 || session.sessionStatus === "completed";

	let timeLeft = "";
	if (isFinished) {
		if (session.actualEndTime) {
			const actualEnd = new Date(session.actualEndTime);
			timeLeft = `Finished ${actualEnd.toLocaleTimeString([], {
				hour: "numeric",
				minute: "2-digit",
			})}`;
		} else {
			timeLeft = "Finished";
		}
	} else {
		const remainingMs = expectedEnd.getTime() - now.getTime();
		const remainingMins = Math.ceil(remainingMs / (1000 * 60));
		timeLeft = `${remainingMins} min left`;
	}

	return {
		timeLeft,
		progress,
		isFinished,
	};
}
