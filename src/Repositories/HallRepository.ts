import { eq } from "drizzle-orm";
import { db } from "../db";
import { halls } from "../db/schema/schema";

/**
 * Repository for Hall data access
 */
class HallRepository {
	/**
	 * Get all halls
	 */
	async getAllHalls(): Promise<Hall[]> {
		const rows = await db.select().from(halls);
		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			openingTime: row.openingTime,
			closingTime: row.closingTime,
		}));
	}

	/**
	 * Get a hall by ID
	 */
	async getHallById(id: number): Promise<Hall | null> {
		const rows = await db.select().from(halls).where(eq(halls.id, id));
		if (rows.length === 0) return null;

		const row = rows[0];
		return {
			id: row.id,
			name: row.name,
			openingTime: row.openingTime,
			closingTime: row.closingTime,
		};
	}

	/**
	 * Get a hall by name
	 */
	async getHallByName(name: string): Promise<Hall | null> {
		const rows = await db.select().from(halls).where(eq(halls.name, name));
		if (rows.length === 0) return null;

		const row = rows[0];
		return {
			id: row.id,
			name: row.name,
			openingTime: row.openingTime,
			closingTime: row.closingTime,
		};
	}
}

// Export singleton instance
export const hallRepository = new HallRepository();
