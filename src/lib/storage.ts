import { env } from "@/env";

/**
 * Upload an image from a URL to R2 storage
 * Returns the public R2 URL for the stored image
 */
export async function uploadImageToR2(
	sourceUrl: string,
	key: string,
): Promise<string> {
	// Ensure this only runs on the server
	if (typeof window !== "undefined") {
		throw new Error("R2 storage can only be used on the server");
	}

	const bucket = env.IMAGES;
	if (!bucket) {
		throw new Error("IMAGES R2 bucket is not configured");
	}

	// Fetch the image from the source URL
	const response = await fetch(sourceUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
	}

	// Get content type from response
	const contentType = response.headers.get("content-type") || "image/png";

	// Get the image data as ArrayBuffer
	const imageData = await response.arrayBuffer();

	// Upload to R2
	await bucket.put(key, imageData, {
		httpMetadata: {
			contentType,
			cacheControl: "public, max-age=31536000", // Cache for 1 year
		},
	});

	// Return the path served by our custom worker entry
	// This will be converted to an absolute URL when needed for OG tags
	return `/images/${key}`;
}

/**
 * Generate a unique key for storing a game's OG image
 */
export function generateOgImageKey(gameId: string): string {
	return `og/${gameId}.png`;
}

/**
 * Download an image and upload it to R2 for OG sharing
 */
export async function saveOgImage(
	gameId: string,
	sourceUrl: string,
): Promise<string> {
	const key = generateOgImageKey(gameId);
	return uploadImageToR2(sourceUrl, key);
}
