/**
 * Seed Notification Test Appointments
 *
 * Creates appointments at times that will trigger desktop notifications
 * for testing the notification system.
 *
 * Usage: bun run scripts/seedNotificationTest.ts
 */

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { appointments, halls, machines, users } from "../src/db/schema/schema";

// All available reminder options (must match NotificationSettings.tsx)
const REMINDER_OPTIONS = [5, 15, 30, 60];

async function seedNotificationTestAppointments() {
	console.log("🔔 Seeding notification test appointments...\n");

	try {
		// Get the default student user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, "user@mymona.uwi.edu"))
			.limit(1);

		if (!user) {
			console.error(
				"❌ Default user not found. Run 'bun run scripts/seed.ts' first.",
			);
			process.exit(1);
		}

		// Get the first hall
		const [hall] = await db.select().from(halls).limit(1);

		if (!hall) {
			console.error("❌ No halls found. Run 'bun run scripts/seed.ts' first.");
			process.exit(1);
		}

		// Get an available washer from that hall
		const [machine] = await db
			.select()
			.from(machines)
			.where(eq(machines.hallId, hall.id))
			.limit(1);

		if (!machine) {
			console.error(
				"❌ No machines found. Run 'bun run scripts/seed.ts' first.",
			);
			process.exit(1);
		}

		const now = new Date();

		console.log(`📅 Creating appointments for user: ${user.email}`);
		console.log(`🏛️  Hall: ${hall.name}`);
		console.log(`⏰ Current time: ${now.toLocaleTimeString()}\n`);

		// Create an appointment for each reminder option
		// Each appointment is scheduled exactly at the reminder time
		for (const reminderMins of REMINDER_OPTIONS) {
			const appointmentTime = new Date(
				now.getTime() + reminderMins * 60 * 1000,
			);

			await db.insert(appointments).values({
				userId: user.id,
				hallId: hall.id,
				machineId: machine.id,
				appointmentDatetime: appointmentTime,
				durationMins: machine.type === "washer" ? 45 : 60,
				serviceType: machine.type === "washer" ? "wash" : "dry",
				status: "confirmed",
				totalCost: machine.pricePerCycle || "250.00",
			});

			console.log(
				`   ✓ Created appointment at ${appointmentTime.toLocaleTimeString()} (${reminderMins} mins from now)`,
			);
		}

		console.log("\n═══════════════════════════════════════════════════════");
		console.log("✅ Notification test appointments created!");
		console.log("═══════════════════════════════════════════════════════");
		console.log(`
To test notifications:

1. Start the server:
   bun run src/index.tsx

2. Login as: user@mymona.uwi.edu / user123

3. Go to /settings and:
   - Click "Request notification permission"
   - Make sure "Enable Notifications" is checked
   - Select any reminder time (5, 15, 30, or 60 minutes)

4. The notification should appear within 30 seconds
   (polling interval is 30 seconds)

Appointments created:
${REMINDER_OPTIONS.map((mins) => {
	const time = new Date(now.getTime() + mins * 60 * 1000);
	return `  • ${time.toLocaleTimeString()} - triggers with ${mins}-min reminder`;
}).join("\n")}

Note: Notifications only trigger when appointment is within ±1 minute
of the reminder time.
`);
	} catch (error) {
		console.error("❌ Failed to seed notification test appointments:", error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

seedNotificationTestAppointments();
