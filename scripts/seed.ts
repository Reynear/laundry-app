import { db } from "../src/db";
import {
	appointments,
	halls,
	machineSessions,
	machines,
	notices,
	users,
} from "../src/db/schema/schema";

// =============================================================================
// SEED DATA CONFIGURATION
// =============================================================================

const HALLS_DATA = [
	{
		name: "Chancellor Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
	{
		name: "Taylor Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
	{
		name: "Preston Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
	{
		name: "Irvine Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
	{
		name: "Rex Nettleford Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
	{
		name: "Mary Seacole Hall",
		openingTime: "08:00",
		closingTime: "22:00",
		washerPrice: "250.00",
		dryerPrice: "200.00",
	},
];

const USERS_DATA = [
	{
		email: "user@mymona.uwi.edu",
		firstName: "John",
		lastName: "Smith",
		role: "student" as const,
		walletBalance: "1250.00",
		hallIndex: 0, // Chancellor Hall
	},
	{
		email: "staff@mymona.uwi.edu",
		firstName: "Staff",
		lastName: "Member",
		role: "staff" as const,
		walletBalance: "0.00",
		hallIndex: 0, // Chancellor Hall
	},
	{
		email: "manager@mymona.uwi.edu",
		firstName: "Manager",
		lastName: "User",
		role: "manager" as const,
		walletBalance: "0.00",
		hallIndex: 0, // Chancellor Hall
	},
	{
		email: "admin@mymona.uwi.edu",
		firstName: "Admin",
		lastName: "User",
		role: "admin" as const,
		walletBalance: "0.00",
		hallIndex: null,
	},
];

// Machine configuration per hall
// Each hall gets 6 washers and 4 dryers
function generateMachinesForHall(hallId: number) {
	const machineConfigs: Array<{
		hallId: number;
		type: "washer" | "dryer";
		durationMins: number;
		status: "available" | "in_use" | "out_of_service" | "maintenance";
	}> = [];

	// 6 Washers per hall
	const washerStatuses: Array<
		"available" | "in_use" | "out_of_service" | "maintenance"
	> = ["in_use", "available", "in_use", "available", "in_use", "available"];
	for (let i = 0; i < 6; i++) {
		machineConfigs.push({
			hallId,
			type: "washer",
			durationMins: 45,
			status: washerStatuses[i],
		});
	}

	// 4 Dryers per hall
	const dryerStatuses: Array<
		"available" | "in_use" | "out_of_service" | "maintenance"
	> = ["in_use", "available", "available", "out_of_service"];
	for (let i = 0; i < 4; i++) {
		machineConfigs.push({
			hallId,
			type: "dryer",
			durationMins: 60,
			status: dryerStatuses[i],
		});
	}

	return machineConfigs;
}

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function seed() {
	console.log("🌱 Starting database seed...\n");

	try {
		// 1. Clear existing data (order matters for FK constraints)
		console.log("🧹 Cleaning up existing data...");
		await db.delete(notices);
		await db.delete(machineSessions);
		await db.delete(appointments);
		await db.delete(machines);
		await db.delete(users);
		await db.delete(halls);
		console.log("   ✓ Cleared all tables\n");

		// 2. Insert Halls
		console.log("🏛️  Inserting halls...");
		const insertedHalls = await db.insert(halls).values(HALLS_DATA).returning();
		console.log(`   ✓ Inserted ${insertedHalls.length} halls\n`);

		// 3. Insert Users
		console.log("👥 Inserting users...");
		const usersToInsert = await Promise.all(
			USERS_DATA.map(async (userData) => ({
				email: userData.email,
				firstName: userData.firstName,
				lastName: userData.lastName,
				role: userData.role,
				walletBalance: userData.walletBalance,
				hallId:
					userData.hallIndex !== null
						? insertedHalls[userData.hallIndex].id
						: null,
				passwordHash: await Bun.password.hash(
					userData.role === "student" ? "user123" : "staff123",
				),
			})),
		);
		const insertedUsers = await db
			.insert(users)
			.values(usersToInsert)
			.returning();
		console.log(`   ✓ Inserted ${insertedUsers.length} users\n`);

		// Find specific users for later use
		const studentUser = insertedUsers.find((u) => u.role === "student");
		const staffUser = insertedUsers.find((u) => u.role === "staff");
		const managerUser = insertedUsers.find((u) => u.role === "manager");
		const adminUser = insertedUsers.find((u) => u.role === "admin");

		if (!studentUser || !staffUser || !managerUser || !adminUser) {
			throw new Error("Failed to find required users after insertion");
		}

		// 4. Insert Machines (for each hall)
		console.log("🔧 Inserting machines...");
		const allMachines: Array<{
			hallId: number;
			type: "washer" | "dryer";
			durationMins: number;
			status: "available" | "in_use" | "out_of_service" | "maintenance";
		}> = [];
		for (const hall of insertedHalls) {
			allMachines.push(...generateMachinesForHall(hall.id));
		}
		const insertedMachines = await db
			.insert(machines)
			.values(allMachines)
			.returning();
		console.log(`   ✓ Inserted ${insertedMachines.length} machines\n`);

		// Get machines for Chancellor Hall (first hall) for sample appointments
		const chancellorHall = insertedHalls[0];
		const chancellorMachines = insertedMachines.filter(
			(m) => m.hallId === chancellorHall.id,
		);
		const chancellorWashers = chancellorMachines.filter(
			(m) => m.type === "washer",
		);
		const chancellorDryers = chancellorMachines.filter(
			(m) => m.type === "dryer",
		);

		// 5. Insert Sample Appointments
		console.log("📅 Inserting sample appointments...");
		const now = new Date();

		// Helper to create appointment dates
		const createDate = (daysOffset: number, hours: number, minutes: number) => {
			const date = new Date(now);
			date.setDate(date.getDate() + daysOffset);
			date.setHours(hours, minutes, 0, 0);
			return date;
		};

		// Get prices from Chancellor Hall for sample appointments
		const chancellorHallPrices = HALLS_DATA[0];

		const appointmentsToInsert = [
			{
				userId: studentUser.id,
				hallId: chancellorHall.id,
				machineId: chancellorWashers[5]?.id ?? null, // W-06 (available)
				appointmentDatetime: createDate(0, 16, 30), // Today 4:30 PM
				durationMins: 45,
				serviceType: "wash" as const,
				status: "confirmed" as const,
				totalCost: chancellorHallPrices.washerPrice,
				createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
			},
			{
				userId: studentUser.id,
				hallId: chancellorHall.id,
				machineId: chancellorDryers[2]?.id ?? null, // D-09 (available)
				appointmentDatetime: createDate(0, 17, 30), // Today 5:30 PM
				durationMins: 60,
				serviceType: "dry" as const,
				status: "confirmed" as const,
				totalCost: chancellorHallPrices.dryerPrice,
				createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
			},
			{
				userId: studentUser.id,
				hallId: chancellorHall.id,
				machineId: chancellorWashers[3]?.id ?? null, // W-04 (available)
				appointmentDatetime: createDate(-1, 14, 0), // Yesterday 2:00 PM
				durationMins: 45,
				serviceType: "wash" as const,
				status: "completed" as const,
				totalCost: chancellorHallPrices.washerPrice,
				createdAt: createDate(-2, 14, 0),
			},
		];

		const insertedAppointments = await db
			.insert(appointments)
			.values(appointmentsToInsert)
			.returning();
		console.log(`   ✓ Inserted ${insertedAppointments.length} appointments\n`);

		// 6. Insert Sample Machine Sessions
		console.log("⏱️  Inserting sample machine sessions...");
		const sessionsToInsert = [
			{
				machineId: chancellorWashers[4]?.id ?? 1, // W-05 (in_use)
				appointmentId: insertedAppointments[0]?.id,
				startedByUserId: studentUser.id,
				startTime: new Date(now.getTime() - 35 * 60 * 1000), // Started 35 mins ago
				expectedEndTime: new Date(now.getTime() + 10 * 60 * 1000), // 10 mins remaining
				status: "running" as const,
			},
			{
				machineId: chancellorDryers[0]?.id ?? 1, // D-07 (in_use)
				appointmentId: null,
				startedByUserId: insertedUsers[0].id, // Another user
				startTime: new Date(now.getTime() - 60 * 60 * 1000), // Started 60 mins ago
				expectedEndTime: new Date(now.getTime()), // Just finished
				status: "running" as const,
			},
			{
				machineId: chancellorWashers[2]?.id ?? 1, // W-03 (in_use)
				appointmentId: null,
				startedByUserId: insertedUsers[0].id,
				startTime: new Date(now.getTime() - 21 * 60 * 1000), // Started 21 mins ago
				expectedEndTime: new Date(now.getTime() + 24 * 60 * 1000), // 24 mins remaining
				status: "running" as const,
			},
		];

		const insertedSessions = await db
			.insert(machineSessions)
			.values(sessionsToInsert)
			.returning();
		console.log(`   ✓ Inserted ${insertedSessions.length} machine sessions\n`);

		// 7. Insert Sample Notices
		console.log("📢 Inserting sample notices...");
		const noticesToInsert = [
			{
				authorUserId: staffUser.id,
				hallId: chancellorHall.id,
				title: "Maintenance Notice",
				content: "Floor 3 washers will be under maintenance this Saturday.",
				isPublished: true,
				publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
				type: "alert" as const,
			},
			{
				authorUserId: adminUser.id,
				hallId: null, // Global notice
				title: "New Payment Option",
				content: "You can now pay using mobile money!",
				isPublished: true,
				publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
				type: "info" as const,
			},
			{
				authorUserId: staffUser.id,
				hallId: chancellorHall.id,
				title: "Extended Hours",
				content: "Laundry rooms now open until 11 PM on weekdays.",
				isPublished: true,
				publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
				type: "info" as const,
			},
		];

		const insertedNotices = await db
			.insert(notices)
			.values(noticesToInsert)
			.returning();
		console.log(`   ✓ Inserted ${insertedNotices.length} notices\n`);

		// Summary
		console.log("═══════════════════════════════════════════════════════");
		console.log("✅ Database seeded successfully!");
		console.log("═══════════════════════════════════════════════════════");
		console.log(`
Summary:
  • ${insertedHalls.length} halls
  • ${insertedUsers.length} users
  • ${insertedMachines.length} machines (${insertedMachines.filter((m) => m.type === "washer").length} washers, ${insertedMachines.filter((m) => m.type === "dryer").length} dryers)
  • ${insertedAppointments.length} appointments
  • ${insertedSessions.length} machine sessions
  • ${insertedNotices.length} notices

Test Credentials:
  • Student: user@mymona.uwi.edu / user123
  • Staff:   staff@mymona.uwi.edu / staff123
  • Manager: manager@mymona.uwi.edu / staff123
  • Admin:   admin@mymona.uwi.edu / staff123
`);
	} catch (error) {
		console.error("❌ Database seed failed:", error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

seed();
