import Replicate from "replicate";
import { getRequiredEnv } from "@/env";
import { getModelById, VISION_PROMPT, type ModelType } from "./models";

// Retry configuration
const RETRY_CONFIG = {
	maxRetries: 3,
	initialDelayMs: 1000,
	maxDelayMs: 10000,
	backoffMultiplier: 2,
};

// Retryable error codes (transient failures)
const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];

// Retry wrapper with exponential backoff
async function withRetry<T>(
	operation: () => Promise<T>,
	context: string,
): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Check if error is retryable
			const isRetryable = isRetryableError(error);

			if (!isRetryable || attempt === RETRY_CONFIG.maxRetries) {
				throw lastError;
			}

			// Calculate delay with exponential backoff and jitter
			const baseDelay =
				RETRY_CONFIG.initialDelayMs *
				Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
			const jitter = Math.random() * 0.3 * baseDelay;
			const delay = Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelayMs);

			console.log(
				`[Replicate] ${context} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}), retrying in ${Math.round(delay)}ms: ${lastError.message}`,
			);

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

// Check if an error is retryable
function isRetryableError(error: unknown): boolean {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		// Rate limiting
		if (message.includes("rate limit") || message.includes("429")) {
			return true;
		}

		// Server errors
		if (
			message.includes("500") ||
			message.includes("502") ||
			message.includes("503") ||
			message.includes("504")
		) {
			return true;
		}

		// Network errors
		if (
			message.includes("network") ||
			message.includes("timeout") ||
			message.includes("econnreset") ||
			message.includes("socket hang up")
		) {
			return true;
		}

		// Check for status code in error
		if ("status" in error && typeof error.status === "number") {
			return RETRYABLE_STATUS_CODES.includes(error.status);
		}
	}

	return false;
}

// Initialize Replicate client (server-side only)
function getClient() {
	// Ensure this only runs on the server
	if (typeof window !== "undefined") {
		throw new Error("Replicate client can only be used on the server");
	}

	const token = getRequiredEnv("REPLICATE_API_TOKEN");
	return new Replicate({ auth: token });
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

	return withRetry(async () => {
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
	}, `createImagePrediction(${modelId})`);
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

	return withRetry(async () => {
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
	}, `createVisionPrediction(${modelId})`);
}

// Get the current status of a prediction
export async function getPrediction(
	predictionId: string,
): Promise<PredictionResult> {
	const client = getClient();

	return withRetry(async () => {
		const prediction = await client.predictions.get(predictionId);

		return {
			id: prediction.id,
			status: prediction.status,
			output: prediction.output as string | string[] | undefined,
			error: prediction.error as string | undefined,
		};
	}, `getPrediction(${predictionId})`);
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
