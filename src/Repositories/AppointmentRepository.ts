import { and, desc, eq, getTableColumns, gte, lte, or } from "drizzle-orm";
import { db } from "../db";
import { appointments, halls } from "../db/schema/schema";

// Type for DB result with hall join
type AppointmentDbResult = typeof appointments.$inferSelect & {
	hallName: string | null;
};

// Helper to map DB result to Appointment type
function mapToAppointment(row: AppointmentDbResult): Appointment {
	return {
		id: row.id,
		userId: row.userId,
		hallId: row.hallId,
		machineId: row.machineId,
		totalCost: parseFloat(row.totalCost),
		durationMins: row.durationMins,
		status: row.status as AppointmentStatus,
		serviceType: row.serviceType as ServiceType,
		appointmentDatetime: new Date(row.appointmentDatetime),
		createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
		cancelledAt: row.cancelledAt ? new Date(row.cancelledAt) : undefined,
		hallName: row.hallName || undefined,
	};
}

export class AppointmentRepository {
	/**
	 * Get upcoming appointments for a user
	 */
	async getUpcomingAppointments(userId: number): Promise<Appointment[]> {
		const now = new Date();
		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(
				and(
					eq(appointments.userId, userId),
					gte(appointments.appointmentDatetime, now),
					or(
						eq(appointments.status, "pending"),
						eq(appointments.status, "confirmed"),
					),
				),
			)
			.orderBy(appointments.appointmentDatetime);

		return rows.map(mapToAppointment);
	}

	/**
	 * Get all appointments for a user
	 */
	async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(eq(appointments.userId, userId));

		return rows.map(mapToAppointment);
	}

	/**
	 * Get appointments for a specific hall on a specific date
	 */
	async getAppointmentsByDate(
		hallId: number,
		date: Date,
	): Promise<Appointment[]> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(
				and(
					eq(appointments.hallId, hallId),
					gte(appointments.appointmentDatetime, startOfDay),
					lte(appointments.appointmentDatetime, endOfDay),
				),
			);

		return rows.map(mapToAppointment);
	}

	/**
	 * Get past appointments for a user
	 */
	async getPastAppointments(userId: number): Promise<Appointment[]> {
		const now = new Date();
		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(
				and(
					eq(appointments.userId, userId),
					or(
						lte(appointments.appointmentDatetime, now),
						eq(appointments.status, "completed"),
						eq(appointments.status, "cancelled"),
						eq(appointments.status, "no_show"),
					),
				),
			)
			.orderBy(desc(appointments.appointmentDatetime));

		return rows.map(mapToAppointment);
	}

	/**
	 * Create a new appointment
	 */
	async createAppointment(data: {
		userId: number;
		hallId: number;
		machineId: number;
		appointmentDatetime: Date;
		durationMins: number;
		serviceType: "wash" | "dry";
		totalCost: string; // Changed to string to match DB schema or keep number and convert
	}): Promise<Appointment> {
		const [newAppointment] = await db
			.insert(appointments)
			.values({
				userId: data.userId,
				hallId: data.hallId,
				machineId: data.machineId,
				appointmentDatetime: data.appointmentDatetime,
				durationMins: data.durationMins,
				serviceType: data.serviceType,
				status: "pending",
				totalCost: data.totalCost,
			})
			.returning();

		// Fetch with hall name
		const [appointmentWithHall] = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(eq(appointments.id, newAppointment.id));

		return mapToAppointment(appointmentWithHall);
	}

	/**
	 * Get a single appointment by ID
	 */
	async getAppointmentById(id: number): Promise<Appointment | null> {
		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(eq(appointments.id, id));

		if (rows.length === 0) return null;
		return mapToAppointment(rows[0]);
	}

	/**
	 * Delete an appointment
	 */
	async deleteAppointment(id: number): Promise<boolean> {
		const result = await db
			.delete(appointments)
			.where(eq(appointments.id, id))
			.returning();
		return result.length > 0;
	}

	/**
	 * Get all appointments (for staff view)
	 */
	async getAllAppointments(
		filter: "upcoming" | "past" | "all" = "all",
	): Promise<Appointment[]> {
		const now = new Date();

		let whereClause: ReturnType<typeof and> | undefined;
		if (filter === "upcoming") {
			whereClause = and(
				gte(appointments.appointmentDatetime, now),
				or(
					eq(appointments.status, "pending"),
					eq(appointments.status, "confirmed"),
				),
			);
		} else if (filter === "past") {
			whereClause = or(
				lte(appointments.appointmentDatetime, now),
				eq(appointments.status, "completed"),
				eq(appointments.status, "cancelled"),
				eq(appointments.status, "no_show"),
			);
		}

		const rows = await db
			.select({
				...getTableColumns(appointments),
				hallName: halls.name,
			})
			.from(appointments)
			.leftJoin(halls, eq(appointments.hallId, halls.id))
			.where(whereClause)
			.orderBy(
				filter === "past"
					? desc(appointments.appointmentDatetime)
					: appointments.appointmentDatetime,
			);

		return rows.map(mapToAppointment);
	}
}

export const appointmentRepository = new AppointmentRepository();
