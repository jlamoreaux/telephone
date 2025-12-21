import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const games = sqliteTable("games", {
	id: text("id").primaryKey(), // nanoid
	initialPrompt: text("initial_prompt").notNull(),
	modelChain: text("model_chain", { mode: "json" }).notNull().$type<string[]>(), // JSON array of model IDs
	status: text("status", {
		enum: ["pending", "running", "completed", "failed"],
	})
		.notNull()
		.default("pending"),
	currentStep: integer("current_step").notNull().default(0),
	ogImageUrl: text("og_image_url"), // R2 URL for Open Graph sharing image
	creatorIp: text("creator_ip"), // IP address of the creator (for history filtering)
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	completedAt: integer("completed_at", { mode: "timestamp" }),
}, (table) => [
	index("games_status_idx").on(table.status),
	index("games_created_at_idx").on(table.createdAt),
	index("games_creator_ip_idx").on(table.creatorIp),
]);

export const gameSteps = sqliteTable("game_steps", {
	id: text("id").primaryKey(), // nanoid
	gameId: text("game_id")
		.notNull()
		.references(() => games.id, { onDelete: "cascade" }),
	stepNumber: integer("step_number").notNull(),
	modelId: text("model_id").notNull(), // e.g., "black-forest-labs/flux-schnell"
	modelType: text("model_type", {
		enum: ["text-to-image", "vision"],
	}).notNull(),
	input: text("input").notNull(), // prompt or image URL
	output: text("output"), // image URL or description (null until complete)
	predictionId: text("prediction_id"), // Replicate prediction ID
	status: text("status", {
		enum: ["pending", "running", "succeeded", "failed"],
	})
		.notNull()
		.default("pending"),
	error: text("error"), // Error message if failed
	createdAt: integer("created_at", { mode: "timestamp" }).default(
		sql`(unixepoch())`,
	),
	completedAt: integer("completed_at", { mode: "timestamp" }),
}, (table) => [
	index("game_steps_game_id_idx").on(table.gameId),
	index("game_steps_game_step_idx").on(table.gameId, table.stepNumber),
]);

// Rate limiting table for tracking API usage per IP
export const rateLimits = sqliteTable("rate_limits", {
	id: text("id").primaryKey(), // IP address or identifier
	action: text("action").notNull(), // e.g., "create_game"
	count: integer("count").notNull().default(0),
	windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
}, (table) => [
	index("rate_limits_action_idx").on(table.id, table.action),
]);

// Type exports for use in the app
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type GameStep = typeof gameSteps.$inferSelect;
export type NewGameStep = typeof gameSteps.$inferInsert;
export type RateLimit = typeof rateLimits.$inferSelect;
