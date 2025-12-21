import { createServerFn } from "@tanstack/react-start";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { games, gameSteps } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
	createPrediction,
	getPrediction,
	extractImageUrl,
	extractTextOutput,
} from "@/lib/replicate";
import { getModelById, getModelType } from "@/lib/models";

// Type definitions for inputs
interface CreateGameInput {
	initialPrompt: string;
	modelChain: string[];
}

interface GameIdInput {
	gameId: string;
}

// Create a new game
export const createGame = createServerFn({ method: "POST" })
	.inputValidator((data: CreateGameInput) => data)
	.handler(async ({ data }) => {
		const { initialPrompt, modelChain } = data;

		if (!initialPrompt || initialPrompt.length < 1) {
			throw new Error("Initial prompt is required");
		}
		if (!modelChain || modelChain.length < 2) {
			throw new Error("At least 2 models are required");
		}

		// Validate all models exist
		for (const modelId of modelChain) {
			const model = getModelById(modelId);
			if (!model) {
				throw new Error(`Invalid model: ${modelId}`);
			}
		}

		// Create the game
		const gameId = nanoid();
		await db.insert(games).values({
			id: gameId,
			initialPrompt,
			modelChain,
			status: "pending",
			currentStep: 0,
		});

		return { gameId };
	});

// Get a game with all its steps
export const getGame = createServerFn({ method: "GET" })
	.inputValidator((data: GameIdInput) => data)
	.handler(async ({ data }) => {
		const { gameId } = data;

		const game = await db.query.games.findFirst({
			where: eq(games.id, gameId),
		});

		if (!game) {
			throw new Error(`Game not found: ${gameId}`);
		}

		const steps = await db.query.gameSteps.findMany({
			where: eq(gameSteps.gameId, gameId),
			orderBy: (gameSteps, { asc }) => [asc(gameSteps.stepNumber)],
		});

		return { game, steps };
	});

// Start or continue running the game
export const runGameStep = createServerFn({ method: "POST" })
	.inputValidator((data: GameIdInput) => data)
	.handler(async ({ data }) => {
		const { gameId } = data;

		// Get current game state
		const game = await db.query.games.findFirst({
			where: eq(games.id, gameId),
		});

		if (!game) {
			throw new Error(`Game not found: ${gameId}`);
		}

		if (game.status === "completed" || game.status === "failed") {
			return { game, step: null, done: true };
		}

		const currentStepIndex = game.currentStep;
		const modelChain = game.modelChain as string[];

		// Check if game is complete
		if (currentStepIndex >= modelChain.length) {
			await db
				.update(games)
				.set({ status: "completed", completedAt: new Date() })
				.where(eq(games.id, gameId));
			return {
				game: { ...game, status: "completed" as const },
				step: null,
				done: true,
			};
		}

		// Get or create the current step
		let step = await db.query.gameSteps.findFirst({
			where: eq(gameSteps.gameId, gameId),
			orderBy: (gameSteps, { desc }) => [desc(gameSteps.stepNumber)],
		});

		// Determine the input for this step
		let input: string;
		if (currentStepIndex === 0) {
			input = game.initialPrompt;
		} else {
			// Get output from previous step (specifically stepNumber = currentStepIndex - 1)
			const previousStep = await db.query.gameSteps.findFirst({
				where: and(
					eq(gameSteps.gameId, gameId),
					eq(gameSteps.stepNumber, currentStepIndex - 1)
				),
			});
			if (!previousStep?.output) {
				throw new Error(`Previous step (step ${currentStepIndex - 1}) has no output`);
			}
			input = previousStep.output;
		}

		const modelId = modelChain[currentStepIndex];
		const modelType = getModelType(modelId);

		if (!modelType) {
			throw new Error(`Invalid model: ${modelId}`);
		}

		// Check if step exists and needs to be created or polled
		if (!step || step.stepNumber !== currentStepIndex) {
			// Create new step
			const stepId = nanoid();
			await db.insert(gameSteps).values({
				id: stepId,
				gameId,
				stepNumber: currentStepIndex,
				modelId,
				modelType,
				input,
				status: "pending",
			});

			step = await db.query.gameSteps.findFirst({
				where: eq(gameSteps.id, stepId),
			});

			// Update game status
			await db
				.update(games)
				.set({ status: "running" })
				.where(eq(games.id, gameId));
		}

		if (!step) {
			throw new Error("Failed to create step");
		}

		// If step is pending, start the prediction
		if (step.status === "pending") {
			try {
				const prediction = await createPrediction(modelId, modelType, input);
				await db
					.update(gameSteps)
					.set({
						predictionId: prediction.id,
						status: "running",
					})
					.where(eq(gameSteps.id, step.id));

				step = {
					...step,
					predictionId: prediction.id,
					status: "running" as const,
				};
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";
				await db
					.update(gameSteps)
					.set({ status: "failed", error: errorMessage })
					.where(eq(gameSteps.id, step.id));
				await db
					.update(games)
					.set({ status: "failed" })
					.where(eq(games.id, gameId));
				throw error;
			}
		}

		// If step is running, check prediction status
		if (step.status === "running" && step.predictionId) {
			const prediction = await getPrediction(step.predictionId);

			if (prediction.status === "succeeded") {
				// Extract output based on model type
				let output: string | null;
				if (modelType === "text-to-image") {
					output = extractImageUrl(prediction.output);
				} else {
					output = extractTextOutput(prediction.output);
				}

				if (!output) {
					throw new Error("Prediction succeeded but no output found");
				}

				await db
					.update(gameSteps)
					.set({
						status: "succeeded",
						output,
						completedAt: new Date(),
					})
					.where(eq(gameSteps.id, step.id));

				// Move to next step
				await db
					.update(games)
					.set({ currentStep: currentStepIndex + 1 })
					.where(eq(games.id, gameId));

				step = { ...step, status: "succeeded" as const, output };
			} else if (prediction.status === "failed") {
				await db
					.update(gameSteps)
					.set({ status: "failed", error: prediction.error || "Prediction failed" })
					.where(eq(gameSteps.id, step.id));
				await db
					.update(games)
					.set({ status: "failed" })
					.where(eq(games.id, gameId));
				step = { ...step, status: "failed" as const, error: prediction.error };
			}
			// If still processing, just return current state
		}

		// Get updated game
		const updatedGame = await db.query.games.findFirst({
			where: eq(games.id, gameId),
		});

		return {
			game: updatedGame,
			step,
			done:
				updatedGame?.status === "completed" || updatedGame?.status === "failed",
		};
	});

// Get all games (for history)
export const listGames = createServerFn({ method: "GET" }).handler(async () => {
	const allGames = await db.query.games.findMany({
		orderBy: (games, { desc }) => [desc(games.createdAt)],
		limit: 50,
	});
	return { games: allGames };
});
