import { eq } from "drizzle-orm";
import { db } from "../db";
import { halls, users } from "../db/schema/schema";

class UserRepository {
	/**
	 * Get a user by ID
	 */
	async getUserById(id: number): Promise<User | null> {
		const rows = await db
			.select({
				id: users.id,
				email: users.email,
				firstName: users.firstName,
				lastName: users.lastName,
				hallId: users.hallId,
				hallName: halls.name,
				role: users.role,
				walletBalance: users.walletBalance,
			})
			.from(users)
			.leftJoin(halls, eq(users.hallId, halls.id))
			.where(eq(users.id, id));
		if (rows.length === 0) return null;

		const row = rows[0];
		return {
			id: row.id,
			email: row.email,
			firstName: row.firstName || "",
			lastName: row.lastName || "",
			hallId: row.hallId || 0,
			hallName: row.hallName || undefined,
			role: row.role as UserRole,
			walletBalance: row.walletBalance ? parseFloat(row.walletBalance) : 0,
		};
	}
}

export const userRepository = new UserRepository();
