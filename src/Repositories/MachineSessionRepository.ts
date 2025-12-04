import { and, eq, getTableColumns, inArray } from "drizzle-orm";
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

type MachineWithSession = typeof machines.$inferSelect & {
	session?: MachineSession | null;
};

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

	/**
	 * Get machines with active sessions
	 */
	async getMachinesWithSessions(
		hallId: number,
		currentUserId = 0,
	): Promise<MachineWithSession[]> {
		// fetch machines for the hall
		const machineRows = await db
			.select()
			.from(machines)
			.where(eq(machines.hallId, hallId));

		if (machineRows.length === 0) return [];

		const machineIds = machineRows.map((m) => m.id);

		// fetch running sessions for those machines, include machine type and hall name for mapping
		const sessionRows = await db
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
					eq(machineSessions.status, "running"),
					inArray(machineSessions.machineId, machineIds),
				),
			);

		// build a map machineId -> session
		const sessionMap = new Map<number, SessionDbResult>();
		for (const s of sessionRows as SessionDbResult[]) {
			sessionMap.set(s.machineId, s);
		}

		// attach session (if any) to each machine
		const results: MachineWithSession[] = machineRows.map((m) => {
			const sessionRow = sessionMap.get(m.id);
			return {
				...m,
				session: sessionRow ? mapToSession(sessionRow, currentUserId) : null,
			};
		});

		return results;
	}

	/**
	 * Get a session by ID with hall info
	 */
	async getSessionById(
		sessionId: number,
	): Promise<{ id: number; hallId: number } | null> {
		const rows = await db
			.select({
				id: machineSessions.id,
				hallId: machines.hallId,
			})
			.from(machineSessions)
			.innerJoin(machines, eq(machineSessions.machineId, machines.id))
			.where(eq(machineSessions.id, sessionId));

		if (rows.length === 0) return null;
		return rows[0];
	}

	/**
	 * End a session
	 */
	async endSession(sessionId: number): Promise<void> {
		await db
			.update(machineSessions)
			.set({ status: "completed", actualEndTime: new Date() })
			.where(eq(machineSessions.id, sessionId));
	}
}

export const machineSessionRepository = new MachineSessionRepository();

