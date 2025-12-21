/**
 * Generate a default OG image for Telephone AI using Replicate
 * Run with: bun run scripts/generate-og-image.ts
 */

import Replicate from "replicate";
import { writeFileSync } from "fs";
import { join } from "path";

const PROMPT = `A vibrant, modern illustration for "Telephone AI" - an AI game where messages transform through chains of AI models.
Show an abstract representation of the telephone game concept: colorful speech bubbles or thought clouds connected in a chain,
transforming from text to images and back. Use a dark slate blue background (#0f172a) with cyan (#22d3ee) and purple (#a855f7) accents.
Modern, minimal, tech aesthetic. No text or words in the image.`;

async function generateOgImage() {
	const token = process.env.REPLICATE_API_TOKEN;
	if (!token) {
		console.error("Error: REPLICATE_API_TOKEN environment variable is required");
		console.error("Run with: REPLICATE_API_TOKEN=your_token bun run scripts/generate-og-image.ts");
		process.exit(1);
	}

	const replicate = new Replicate({ auth: token });

	console.log("Generating OG image with google/nano-banana-pro...");
	console.log("Prompt:", PROMPT);
	console.log("");

	try {
		// Create prediction and wait for it to complete
		let prediction = await replicate.predictions.create({
			model: "google/nano-banana-pro",
			input: {
				prompt: PROMPT,
				aspect_ratio: "16:9",
			},
		});

		console.log("Prediction created:", prediction.id);
		console.log("Waiting for completion...");

		// Poll until complete
		while (prediction.status !== "succeeded" && prediction.status !== "failed") {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			prediction = await replicate.predictions.get(prediction.id);
			console.log("Status:", prediction.status);
		}

		if (prediction.status === "failed") {
			throw new Error(`Prediction failed: ${prediction.error}`);
		}

		console.log("Raw output:", JSON.stringify(prediction.output, null, 2));

		// Extract URL from output
		const output = prediction.output;
		let imageUrl: string;
		if (Array.isArray(output) && output.length > 0) {
			imageUrl = String(output[0]);
		} else if (typeof output === "string") {
			imageUrl = output;
		} else if (output && typeof output === "object" && "url" in output) {
			imageUrl = String(output.url);
		} else {
			throw new Error("No image URL returned from Replicate");
		}

		console.log("Image generated:", imageUrl);
		console.log("");
		console.log("Downloading image...");

		// Download the image
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new Error(`Failed to download image: ${response.status}`);
		}

		const buffer = await response.arrayBuffer();
		const outputPath = join(process.cwd(), "public", "og-default.png");

		writeFileSync(outputPath, Buffer.from(buffer));

		console.log(`Saved to: ${outputPath}`);
		console.log("");
		console.log("Done! The OG image has been saved to public/og-default.png");
		console.log("It will be used as the default social sharing image for the site.");

	} catch (error) {
		console.error("Error generating image:", error);
		process.exit(1);
	}
}

generateOgImage();
