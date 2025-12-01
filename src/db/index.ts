import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

// Support both DATABASE_URL and individual DB_* variables (for Sevalla internal connections)
const connectionString =
	process.env.DATABASE_URL ||
	(process.env.DB_HOST
		? `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE}`
		: undefined);

if (!connectionString) {
	throw new Error(
		"Database connection not configured. Set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables.",
	);
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, {
	prepare: false,
	idle_timeout: 20,
	max_lifetime: 60 * 30,
});
export const db = drizzle(client, { schema });
