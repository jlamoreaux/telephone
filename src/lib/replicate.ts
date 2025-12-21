import Replicate from "replicate";
import { env } from "@/env";
import { getModelById, VISION_PROMPT, type ModelType } from "./models";

// Initialize Replicate client (server-side only)
function getClient() {
	return new Replicate({
		auth: env.REPLICATE_API_TOKEN,
	});
}

export interface PredictionResult {
	id: string;
	status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
	output?: string | string[];
	error?: string;
}

// Create a text-to-image prediction
export async function createImagePrediction(
	modelId: string,
	prompt: string,
): Promise<PredictionResult> {
	const client = getClient();
	const model = getModelById(modelId);

	if (!model || model.type !== "text-to-image") {
		throw new Error(`Invalid text-to-image model: ${modelId}`);
	}

	const prediction = await client.predictions.create({
		model: modelId,
		input: {
			prompt,
			// Common defaults that work across most models
			num_outputs: 1,
		},
	});

	return {
		id: prediction.id,
		status: prediction.status,
		output: prediction.output as string[] | undefined,
		error: prediction.error as string | undefined,
	};
}

// Build the input object based on model-specific requirements
// Each model has a different schema for image input
function buildVisionInput(modelId: string, imageUrl: string): Record<string, unknown> {
	// Google Gemini models use 'images' (array)
	if (modelId.startsWith("google/gemini")) {
		return {
			images: [imageUrl],
			prompt: VISION_PROMPT,
		};
	}

	// OpenAI models use 'image_input' (array)
	if (modelId.startsWith("openai/")) {
		return {
			image_input: [imageUrl],
			prompt: VISION_PROMPT,
		};
	}

	// Anthropic Claude models use 'image' (single)
	if (modelId.startsWith("anthropic/")) {
		return {
			image: imageUrl,
			prompt: VISION_PROMPT,
		};
	}

	// LLaVA models use 'image' (single)
	if (modelId.includes("llava")) {
		return {
			image: imageUrl,
			prompt: VISION_PROMPT,
		};
	}

	// Moondream uses 'image' (single)
	if (modelId.includes("moondream")) {
		return {
			image: imageUrl,
			prompt: VISION_PROMPT,
		};
	}

	// Default format - 'image' (single)
	return {
		image: imageUrl,
		prompt: VISION_PROMPT,
	};
}

// Create a vision prediction to describe an image
export async function createVisionPrediction(
	modelId: string,
	imageUrl: string,
): Promise<PredictionResult> {
	const client = getClient();
	const model = getModelById(modelId);

	if (!model || model.type !== "vision") {
		throw new Error(`Invalid vision model: ${modelId}`);
	}

	const input = buildVisionInput(modelId, imageUrl);

	const prediction = await client.predictions.create({
		model: modelId,
		input,
	});

	return {
		id: prediction.id,
		status: prediction.status,
		output: prediction.output as string | undefined,
		error: prediction.error as string | undefined,
	};
}

// Get the current status of a prediction
export async function getPrediction(
	predictionId: string,
): Promise<PredictionResult> {
	const client = getClient();
	const prediction = await client.predictions.get(predictionId);

	return {
		id: prediction.id,
		status: prediction.status,
		output: prediction.output as string | string[] | undefined,
		error: prediction.error as string | undefined,
	};
}

// Wait for a prediction to complete (with polling)
export async function waitForPrediction(
	predictionId: string,
	maxAttempts = 60,
	intervalMs = 2000,
): Promise<PredictionResult> {
	const client = getClient();

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const prediction = await client.predictions.get(predictionId);

		if (
			prediction.status === "succeeded" ||
			prediction.status === "failed" ||
			prediction.status === "canceled"
		) {
			return {
				id: prediction.id,
				status: prediction.status,
				output: prediction.output as string | string[] | undefined,
				error: prediction.error as string | undefined,
			};
		}

		// Wait before polling again
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error(`Prediction ${predictionId} timed out after ${maxAttempts} attempts`);
}

// Helper to extract the image URL from a prediction output
export function extractImageUrl(output: string | string[] | undefined): string | null {
	if (!output) return null;
	if (Array.isArray(output)) {
		return output[0] || null;
	}
	// Check if output is a URL
	if (typeof output === "string" && output.startsWith("http")) {
		return output;
	}
	return null;
}

// Helper to extract text from a vision prediction output
export function extractTextOutput(output: string | string[] | undefined): string | null {
	if (!output) return null;
	if (Array.isArray(output)) {
		return output.join("");
	}
	return output;
}

// Create a prediction based on model type
export async function createPrediction(
	modelId: string,
	modelType: ModelType,
	input: string,
): Promise<PredictionResult> {
	if (modelType === "text-to-image") {
		return createImagePrediction(modelId, input);
	}
	return createVisionPrediction(modelId, input);
}
