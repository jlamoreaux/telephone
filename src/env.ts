import { env as cfEnv } from "cloudflare:workers";

// Re-export Cloudflare Workers env for server-side use
// The env object contains bindings defined in wrangler.jsonc and secrets from .dev.vars
export const env = cfEnv;

// Validation helper for required environment variables
export function getRequiredEnv(key: keyof typeof cfEnv): string {
	const value = cfEnv[key];
	if (!value || typeof value !== "string") {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
}
