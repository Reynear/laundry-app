import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { shifts, users, halls } from "../db/schema/schema";

export class ShiftRepository {
	// Gets shifts for a staff member
	async getShiftsByUser(userId: number, filter?: ShiftStatus): Promise<Shift[]> {
		const conditions = [eq(shifts.userId, userId)];
		if (filter) {
			conditions.push(eq(shifts.status, filter));
		}

		const result = await db
			.select({
				id: shifts.id,
				userId: shifts.userId,
				hallId: shifts.hallId,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				status: shifts.status,
				hallName: halls.name,
			})
			.from(shifts)
			.leftJoin(halls, eq(shifts.hallId, halls.id))
		const nextDay = new Date(filter.date);
		nextDay.setDate(nextDay.getDate() + 1);
		conditions.push(
			and(
				hallId: data.hallId,
				startTime: data.startTime,
				endTime: data.endTime,
				status: "pending",
		}).returning();

		return result[0] as Shift;
	}

	// Admin approves/rejects
	async updateShiftStatus(id: number, status: ShiftStatus): Promise < Shift | null > {
	const result = await db
		.update(shifts)
		.set({ status })
		.where(eq(shifts.id, id))
		.returning();

	return result[0] ? (result[0] as Shift) : null;
}

	// Delete a shift
	async deleteShift(id: number): Promise < boolean > {
	const result = await db.delete(shifts).where(eq(shifts.id, id)).returning();
	return result.length > 0;
}
}

export const shiftRepository = new ShiftRepository();