import { defineConfig } from "drizzle-kit";

// Build connection URL from individual variables if DATABASE_URL is not set
const connectionUrl =
	process.env.DATABASE_URL ||
	`postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE}`;

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: connectionUrl,
	},
});
