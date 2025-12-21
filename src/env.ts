import { env as cfEnv } from "cloudflare:workers";

// Re-export Cloudflare Workers env for server-side use
// The env object contains bindings defined in wrangler.jsonc and secrets from .dev.vars
export const env = cfEnv;
