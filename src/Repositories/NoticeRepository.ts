import {
	and,
	desc,
	eq,
	getTableColumns,
	gte,
	isNull,
	lt,
	lte,
	or,
} from "drizzle-orm";
import { db } from "../db";
import { halls, notices, users } from "../db/schema/schema";

// Helper to map DB result to Notice type
// We need to join with users and halls to get names
type NoticeDbResult = typeof notices.$inferSelect & {
	authorFirstName: string | null;
	authorLastName: string | null;
	hallName: string | null;
};

function mapToNotice(row: NoticeDbResult): Notice {
	const authorName = [row.authorFirstName, row.authorLastName]
		.filter(Boolean)
		.join(" ");

	return {
		id: row.id,
		authorUserId: row.authorUserId,
		authorName: authorName || "Unknown",
		hallId: row.hallId,
		hallName: row.hallName,
		title: row.title,
		content: row.content,
		isPublished: row.isPublished ?? false,
		publishedAt: row.publishedAt ? new Date(row.publishedAt) : new Date(),
		type: (row.type as "alert" | "info") || "info",
		expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
	};
}

export class NoticeRepository {
	/**
	 * Get active notices (optionally filtered by hall)
	 */
	async getActiveNotices(hallId?: number): Promise<Notice[]> {
		const now = new Date();

		const query = db
			.select({
				...getTableColumns(notices),
				authorFirstName: users.firstName,
				authorLastName: users.lastName,
				hallName: halls.name,
			})
			.from(notices)
			.leftJoin(users, eq(notices.authorUserId, users.id))
			.leftJoin(halls, eq(notices.hallId, halls.id))
			.where(
				and(
					eq(notices.isPublished, true),
					// Published in the past (or now)
					lte(notices.publishedAt, now),
					// Not expired yet (or no expiration)
					or(isNull(notices.expiresAt), gte(notices.expiresAt, now)),
					// Filter by hall if provided (include global notices where hallId is null)
					hallId !== undefined
						? or(eq(notices.hallId, hallId), isNull(notices.hallId))
						: undefined,
				),
			)
			.orderBy(desc(notices.publishedAt));

		const rows = await query;
		return rows.map(mapToNotice);
	}

	/**
	 * Get recent notices (limit to specified count)
	 */
	async getRecentNotices(
		limit: number = 3,
		hallId?: number,
	): Promise<Notice[]> {
		const activeNotices = await this.getActiveNotices(hallId);
		return activeNotices.slice(0, limit);
	}

	/**
	 * Get expired notices
	 */
	async getExpiredNotices(hallId?: number): Promise<Notice[]> {
		const now = new Date();

		const query = db
			.select({
				...getTableColumns(notices),
				authorFirstName: users.firstName,
				authorLastName: users.lastName,
				hallName: halls.name,
			})
			.from(notices)
			.leftJoin(users, eq(notices.authorUserId, users.id))
			.leftJoin(halls, eq(notices.hallId, halls.id))
			.where(
				and(
					lt(notices.expiresAt, now),
					hallId !== undefined
						? or(eq(notices.hallId, hallId), isNull(notices.hallId))
						: undefined,
				),
			)
			.orderBy(desc(notices.expiresAt));

		const rows = await query;
		return rows.map(mapToNotice);
	}

	/**
	 * Get a notice by ID
	 */
	async getNoticeById(id: number): Promise<Notice | undefined> {
		const rows = await db
			.select({
				...getTableColumns(notices),
				authorFirstName: users.firstName,
				authorLastName: users.lastName,
				hallName: halls.name,
			})
			.from(notices)
			.leftJoin(users, eq(notices.authorUserId, users.id))
			.leftJoin(halls, eq(notices.hallId, halls.id))
			.where(eq(notices.id, id))
			.limit(1);

		if (rows.length === 0) return undefined;
		return mapToNotice(rows[0]);
	}

	/**
	 * Create a new notice
	 */
	async createNotice(data: {
		authorUserId: number;
		hallId?: number | null;
		title: string;
		content: string;
		isPublished: boolean;
		publishedAt?: Date;
		expiresAt?: Date;
		type: "alert" | "info";
	}): Promise<Notice> {
		const [newNotice] = await db
			.insert(notices)
			.values({
				authorUserId: data.authorUserId,
				hallId: data.hallId,
				title: data.title,
				content: data.content,
				isPublished: data.isPublished,
				publishedAt: data.publishedAt || new Date(),
				expiresAt: data.expiresAt,
				type: data.type,
			})
			.returning();

		// Fetch the full notice with joins to return correct type
		const created = await this.getNoticeById(newNotice.id);
		if (!created) throw new Error("Failed to create notice");
		return created;
	}

	/**
	 * Update a notice
	 */
	async updateNotice(
		id: number,
		data: Partial<{
			title: string;
			content: string;
			isPublished: boolean;
			expiresAt: Date | null;
			type: "alert" | "info";
		}>,
	): Promise<Notice | undefined> {
		await db.update(notices).set(data).where(eq(notices.id, id));

		return this.getNoticeById(id);
	}

	/**
	 * Delete a notice
	 */
	async deleteNotice(id: number): Promise<boolean> {
		const result = await db
			.delete(notices)
			.where(eq(notices.id, id))
			.returning();
		return result.length > 0;
	}
}

export const noticeRepository = new NoticeRepository();
