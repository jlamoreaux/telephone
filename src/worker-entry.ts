import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";

// Create the TanStack Start handler
const startHandler = createStartHandler(defaultStreamHandler);

// Custom fetch handler that intercepts image requests
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle image serving from R2
		if (url.pathname.startsWith("/images/")) {
			const key = url.pathname.slice("/images/".length);

			if (!key) {
				return new Response("Not found", { status: 404 });
			}

			const bucket = env.IMAGES;
			if (!bucket) {
				return new Response("Storage not configured", { status: 500 });
			}

			const object = await bucket.get(key);

			if (!object) {
				return new Response("Image not found", { status: 404 });
			}

			const headers = new Headers();
			headers.set(
				"Content-Type",
				object.httpMetadata?.contentType || "image/png",
			);
			headers.set(
				"Cache-Control",
				object.httpMetadata?.cacheControl || "public, max-age=31536000",
			);
			headers.set("ETag", object.etag);

			return new Response(object.body, {
				status: 200,
				headers,
			});
		}

		// Pass all other requests to TanStack Start
		return startHandler(request, env, ctx);
	},
};
