import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, {
	prepare: false,
	idle_timeout: 20,
	max_lifetime: 60 * 30,
});
export const db = drizzle(client, { schema });
