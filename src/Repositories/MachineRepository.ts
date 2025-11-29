import { eq } from "drizzle-orm";
import { db } from "../db";
import { machines } from "../db/schema/schema";

class MachineRepository {
	/**
	 * Get all machines for a hall
	 */
	async getMachinesByHall(hallId: number): Promise<Machine[]> {
		const rows = await db
			.select()
			.from(machines)
			.where(eq(machines.hallId, hallId));

		return rows.map((row) => ({
			id: row.id,
			hallId: row.hallId,
			type: row.type as MachineType,
			durationMins: row.durationMins || 45,
			status: row.status as MachineStatus,
		}));
	}

	/**
	 * Get a machine by ID
	 */
	async getMachineById(id: number): Promise<Machine | undefined> {
		const rows = await db.select().from(machines).where(eq(machines.id, id));
		if (rows.length === 0) return undefined;

		const row = rows[0];
		return {
			id: row.id,
			hallId: row.hallId,
			type: row.type as MachineType,
			durationMins: row.durationMins || 45,
			status: row.status as MachineStatus,
		};
	}
}

export const machineRepository = new MachineRepository();
