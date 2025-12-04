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
			.where(and(...conditions))
			.orderBy(desc(shifts.startTime));
		return result as Shift[];
	}


	// Get all shifts for a hall (for admin)
	async getShiftsByHall(hallId: number, filter?: { status?: ShiftStatus; date?: Date }): Promise<Shift[]> {
		const conditions = [eq(shifts.hallId, hallId)];
		if (filter?.status && filter.status !== ("all" as any)) {
			conditions.push(eq(shifts.status, filter.status));
		}
		if (filter?.date) {
			const nextDay = new Date(filter.date);
			nextDay.setDate(nextDay.getDate() + 1);
			conditions.push(
				gte(shifts.startTime, filter.date),
				lte(shifts.startTime, nextDay)
			);
		}
		const result = await db
			.select({
				id: shifts.id,
				userId: shifts.userId,
				hallId: shifts.hallId,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				status: shifts.status,
				staffName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
			})
			.from(shifts)
			.leftJoin(users, eq(shifts.userId, users.id))
			.where(and(...conditions))
			.orderBy(desc(shifts.startTime));
		return result as Shift[];
	}


	// Get all pending shifts (for admin approval)
	async getAllPendingShifts(filter?: { date?: Date }): Promise<Shift[]> {
		const conditions = [eq(shifts.status, "pending")];
		if (filter?.date) {
			const nextDay = new Date(filter.date);
			nextDay.setDate(nextDay.getDate() + 1);
			conditions.push(
				and(
					gte(shifts.startTime, filter.date),
					lte(shifts.startTime, nextDay)
				)
			);
		}
		const result = await db
			.select({
				id: shifts.id,
				userId: shifts.userId,
				hallId: shifts.hallId,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				status: shifts.status,
				staffName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
				hallName: halls.name,
			})
			.from(shifts)
			.leftJoin(users, eq(shifts.userId, users.id))
			.leftJoin(halls, eq(shifts.hallId, halls.id))
			.where(and(...conditions))
			.orderBy(desc(shifts.startTime));
		return result as Shift[];
	}
	// Get all shifts (for admin view with filters)
	async getAllShifts(filter?: { status?: ShiftStatus; date?: Date }): Promise<Shift[]> {
		const conditions = [];
		if (filter?.status && filter.status !== ("all" as any)) {
			conditions.push(eq(shifts.status, filter.status));
		}
		if (filter?.date) {
			const nextDay = new Date(filter.date);
			nextDay.setDate(nextDay.getDate() + 1);
			conditions.push(
				and(
					gte(shifts.startTime, filter.date),
					lte(shifts.startTime, nextDay)
				)
			);
		}
		const query = db
			.select({
				id: shifts.id,
				userId: shifts.userId,
				hallId: shifts.hallId,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				status: shifts.status,
				staffName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
				hallName: halls.name,
			})
			.from(shifts)
			.leftJoin(users, eq(shifts.userId, users.id))
			.leftJoin(halls, eq(shifts.hallId, halls.id));
		
		const result = conditions.length > 0
			? await query.where(and(...conditions)).orderBy(desc(shifts.startTime))
			: await query.orderBy(desc(shifts.startTime));
		return result as Shift[];
	}
	// Get single shift
	async getShiftById(id: number): Promise<Shift | null> {
		const result = await db
			.select()
			.from(shifts)
			.where(eq(shifts.id, id))
			.limit(1);
		return result[0] ? (result[0] as Shift) : null;
	}


	// Staff creates a shift request
	async createShift(data: { userId: number; hallId: number; startTime: Date; endTime: Date }): Promise<Shift> {
		const result = await db.insert(shifts).values({
			userId: data.userId,
			hallId: data.hallId,
			startTime: data.startTime,
			endTime: data.endTime,
			status: "pending",
		}).returning();
		return result[0] as Shift;
	}


	// Admin approves/rejects
	async updateShiftStatus(id: number, status: ShiftStatus): Promise<Shift | null> {
		const result = await db
			.update(shifts)
			.set({ status })
			.where(eq(shifts.id, id))
			.returning();

		return result[0] ? (result[0] as Shift) : null;
	}
	// Delete a shift
	async deleteShift(id: number): Promise<boolean> {
		const result = await db.delete(shifts).where(eq(shifts.id, id)).returning();
		return result.length > 0;
	}


	// Get shifts for a specific week (for weekly calendar view)
	async getShiftsForWeek(hallId: number, weekStart: Date): Promise<Shift[]> {
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekStart.getDate() + 7);
		const result = await db
			.select({
				id: shifts.id,
				userId: shifts.userId,
				hallId: shifts.hallId,
				startTime: shifts.startTime,
				endTime: shifts.endTime,
				status: shifts.status,
				staffName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
				hallName: halls.name,
			})
			.from(shifts)
			.leftJoin(users, eq(shifts.userId, users.id))
			.leftJoin(halls, eq(shifts.hallId, halls.id))
			.where(
				and(
					eq(shifts.hallId, hallId),
					gte(shifts.startTime, weekStart),
					lte(shifts.startTime, weekEnd)
				)
			)
			.orderBy(shifts.startTime);
		return result as Shift[];
	}
}

export const shiftRepository = new ShiftRepository();