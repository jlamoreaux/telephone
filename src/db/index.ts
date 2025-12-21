import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { env } from "cloudflare:workers";

// Create the database instance using Cloudflare Workers env
function createDb() {
	return drizzle(env.DB, { schema });
}

// Type for the database instance
export type Database = ReturnType<typeof createDb>;

// Export the database instance - it will use the env.DB binding
export const db = new Proxy({} as Database, {
	get(_, prop) {
		const dbInstance = createDb();
		return dbInstance[prop as keyof Database];
	},
});
