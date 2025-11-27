import { db } from "../src/db";
import {
	appointments,
	halls,
	machineSessions,
	machines,
	notices,
	payments,
	shifts,
	users,
} from "../src/db/schema/schema";

/**
 * Reset the database by clearing all tables
 * Respects FK constraints by deleting in the correct order
 */
async function reset() {
	console.log("🔄 Starting database reset...\n");

	try {
		// Delete data in order that respects FK constraints
		// Child tables first, parent tables last
		console.log("🧹 Clearing all tables...");

		// 1. Delete notices (references users, halls)
		await db.delete(notices);
		console.log("   ✓ Cleared notices");

		// 2. Delete payments (references users)
		await db.delete(payments);
		console.log("   ✓ Cleared payments");

		// 3. Delete shifts (references users, halls)
		await db.delete(shifts);
		console.log("   ✓ Cleared shifts");

		// 4. Delete machine sessions (references machines, appointments, users)
		await db.delete(machineSessions);
		console.log("   ✓ Cleared machine sessions");

		// 5. Delete appointments (references users, halls, machines)
		await db.delete(appointments);
		console.log("   ✓ Cleared appointments");

		// 6. Delete machines (references halls)
		await db.delete(machines);
		console.log("   ✓ Cleared machines");

		// 7. Delete users (references halls)
		await db.delete(users);
		console.log("   ✓ Cleared users");

		// 8. Delete halls (parent table, no dependencies)
		await db.delete(halls);
		console.log("   ✓ Cleared halls");

		console.log("\n═══════════════════════════════════════════════════════");
		console.log("✅ Database reset complete!");
		console.log("═══════════════════════════════════════════════════════");
		console.log("All tables have been cleared.\n");

		// Check if user wants to re-seed
		const shouldSeed = process.argv.includes("--seed");
		if (shouldSeed) {
			console.log("🌱 Re-seeding database...\n");
			// Import and run seed script
			await import("./seed");
		} else {
			console.log("💡 Tip: Run 'bun run db:reset --seed' to reset and seed in one command\n");
		}
	} catch (error) {
		console.error("❌ Database reset failed:", error);
		process.exit(1);
	} finally {
		if (!process.argv.includes("--seed")) {
			process.exit(0);
		}
	}
}

reset();
