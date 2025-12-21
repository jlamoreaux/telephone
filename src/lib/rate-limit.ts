import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Rate limit configuration
export const RATE_LIMITS = {
	create_game: {
		maxRequests: 10, // Maximum requests per window
		windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
	},
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}

/**
 * Check and update rate limit for an action
 * Uses a fixed window approach
 */
export async function checkRateLimit(
	identifier: string,
	action: RateLimitAction,
): Promise<RateLimitResult> {
	const config = RATE_LIMITS[action];
	const now = new Date();
	const windowStart = new Date(
		Math.floor(now.getTime() / config.windowMs) * config.windowMs,
	);
	const resetAt = new Date(windowStart.getTime() + config.windowMs);

	// Create a composite key for this identifier + action
	const key = `${identifier}:${action}`;

	// Try to get existing rate limit record
	const existing = await db.query.rateLimits.findFirst({
		where: and(eq(rateLimits.id, key), eq(rateLimits.action, action)),
	});

	if (!existing || existing.windowStart.getTime() < windowStart.getTime()) {
		// No record or window has expired - create/reset with count of 1
		await db
			.insert(rateLimits)
			.values({
				id: key,
				action,
				count: 1,
				windowStart,
			})
			.onConflictDoUpdate({
				target: rateLimits.id,
				set: {
					count: 1,
					windowStart,
				},
			});

		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetAt,
		};
	}

	// Check if limit exceeded
	if (existing.count >= config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetAt,
		};
	}

	// Increment count
	await db
		.update(rateLimits)
		.set({ count: existing.count + 1 })
		.where(eq(rateLimits.id, key));

	return {
		allowed: true,
		remaining: config.maxRequests - existing.count - 1,
		resetAt,
	};
}

/**
 * Get client IP from request headers
 * Works with Cloudflare Workers
 */
export function getClientIP(request: Request): string {
	// Cloudflare provides the real client IP in this header
	const cfIP = request.headers.get("CF-Connecting-IP");
	if (cfIP) return cfIP;

	// Fallback to X-Forwarded-For
	const forwardedFor = request.headers.get("X-Forwarded-For");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	// Fallback to X-Real-IP
	const realIP = request.headers.get("X-Real-IP");
	if (realIP) return realIP;

	// Default fallback
	return "unknown";
}

/**
 * Create a rate limit error response
 */
export function rateLimitExceededError(result: RateLimitResult): Error {
	const retryAfter = Math.ceil(
		(result.resetAt.getTime() - Date.now()) / 1000,
	);
	const error = new Error(
		`Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
	);
	(error as any).retryAfter = retryAfter;
	(error as any).statusCode = 429;
	return error;
}
