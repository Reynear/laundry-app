import { and, eq, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { halls, machineSessions, machines } from "../db/schema/schema";

// Helper to map DB result to MachineSession type
type SessionDbResult = typeof machineSessions.$inferSelect & {
	machineType: string | null;
	hallName: string | null;
};

function mapToSession(
	row: SessionDbResult,
	currentUserId: number,
): MachineSession {
	return {
		id: row.id,
		machineId: row.machineId,
		machineType: (row.machineType as MachineType) || "washer",
		appointmentId: row.appointmentId,
		startedByUserId: row.startedByUserId,
		startTime: new Date(row.startTime),
		expectedEndTime: new Date(row.expectedEndTime),
		actualEndTime: row.actualEndTime ? new Date(row.actualEndTime) : undefined,
		sessionStatus: (row.status as SessionStatus) || "running",
		isUsersMachine: row.startedByUserId === currentUserId,
		hallName: row.hallName || undefined,
	};
}

class MachineSessionRepository {
	/**
	 * Get active sessions for a user
	 */
	async getActiveSessionsForUser(userId: number): Promise<MachineSession[]> {
		const rows = await db
			.select({
				...getTableColumns(machineSessions),
				machineType: machines.type,
				hallName: halls.name,
			})
			.from(machineSessions)
			.innerJoin(machines, eq(machineSessions.machineId, machines.id))
			.innerJoin(halls, eq(machines.hallId, halls.id))
			.where(
				and(
					eq(machineSessions.startedByUserId, userId),
					eq(machineSessions.status, "running"),
				),
			);

		return rows.map((row) => mapToSession(row, userId));
	}

	/**
	 * Get active sessions for a hall
	 */
	async getActiveSessionsByHall(
		hallId: number,
		currentUserId: number,
	): Promise<MachineSession[]> {
		const rows = await db
			.select({
				...getTableColumns(machineSessions),
				machineType: machines.type,
				hallName: halls.name,
			})
			.from(machineSessions)
			.innerJoin(machines, eq(machineSessions.machineId, machines.id))
			.innerJoin(halls, eq(machines.hallId, halls.id))
			.where(
				and(eq(machines.hallId, hallId), eq(machineSessions.status, "running")),
			);

		return rows.map((row) => mapToSession(row, currentUserId));
	}

	/**
	 * Start a new session
	 */
	async startSession(data: {
		machineId: number;
		appointmentId?: number | null;
		startedByUserId: number;
		startTime: Date;
		expectedEndTime: Date;
	}): Promise<MachineSession> {
		const [newSession] = await db
			.insert(machineSessions)
			.values({
				machineId: data.machineId,
				appointmentId: data.appointmentId,
				startedByUserId: data.startedByUserId,
				startTime: data.startTime,
				expectedEndTime: data.expectedEndTime,
				status: "running",
			})
			.returning();

		// Fetch with joins to return full object
		const rows = await db
			.select({
				...getTableColumns(machineSessions),
				machineType: machines.type,
				hallName: halls.name,
			})
			.from(machineSessions)
			.innerJoin(machines, eq(machineSessions.machineId, machines.id))
			.innerJoin(halls, eq(machines.hallId, halls.id))
			.where(eq(machineSessions.id, newSession.id));

		if (rows.length === 0) throw new Error("Failed to create session");
		return mapToSession(rows[0], data.startedByUserId);
	}
}

export const machineSessionRepository = new MachineSessionRepository();
