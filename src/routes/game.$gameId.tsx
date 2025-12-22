import { useEffect, useState, useCallback, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Image,
	Eye,
	CheckCircle,
	XCircle,
	Loader2,
	ArrowRight,
	RotateCcw,
	Share2,
	Check,
} from "lucide-react";
import { getGame, runGameStep } from "@/server/game";
import { getModelById } from "@/lib/models";
import type { Game, GameStep } from "@/db/schema";

// Validate URL to prevent XSS
function isValidImageUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ["http:", "https:"].includes(parsed.protocol);
	} catch {
		return false;
	}
}

// LocalStorage key for Replicate API token
const REPLICATE_TOKEN_KEY = "replicate_api_token";

function getStoredToken(): string {
	if (typeof window === "undefined") return "";
	return localStorage.getItem(REPLICATE_TOKEN_KEY) || "";
}

// Get site URL from environment (set in production)
const SITE_URL = process.env.SITE_URL || "";

export const Route = createFileRoute("/game/$gameId")({
	component: GamePage,
	loader: async ({ params }) => {
		const result = await getGame({ data: { gameId: params.gameId } });
		return result;
	},
	head: ({ loaderData, params }) => {
		const { game } = loaderData;
		const title =
			game.status === "completed"
				? `AI-rtic Phone - Complete`
				: `AI-rtic Phone - In Progress`;

		// Truncate prompt for description
		const promptPreview =
			game.initialPrompt.length > 100
				? `${game.initialPrompt.slice(0, 100)}...`
				: game.initialPrompt;

		// Use the stored OG image URL from R2 (persisted and won't expire)
		// Make it absolute if SITE_URL is set and it's a relative path
		let ogImage = game.ogImageUrl;
		if (ogImage && SITE_URL && ogImage.startsWith("/")) {
			ogImage = `${SITE_URL}${ogImage}`;
		}

		const gameUrl = SITE_URL ? `${SITE_URL}/game/${params.gameId}` : "";

		const meta: Array<Record<string, string>> = [
			{ title },
			{
				property: "og:title",
				content: title,
			},
			{
				property: "og:description",
				content: `Starting prompt: "${promptPreview}"`,
			},
			{
				name: "twitter:title",
				content: title,
			},
			{
				name: "twitter:description",
				content: `Starting prompt: "${promptPreview}"`,
			},
		];

		if (ogImage) {
			meta.push(
				{ property: "og:image", content: ogImage },
				{ name: "twitter:image", content: ogImage }
			);
		}

		if (gameUrl) {
			meta.push(
				{ property: "og:url", content: gameUrl },
				{ name: "twitter:url", content: gameUrl }
			);
		}

		return { meta };
	},
});

function StepCard({
	step,
	isActive,
	animationDelay = 0,
}: {
	step: GameStep;
	isActive: boolean;
	animationDelay?: number;
}) {
	const model = getModelById(step.modelId);
	const isImage = step.modelType === "text-to-image";

	return (
		<div
			className={`rounded-xl border p-4 transition-all animate-fade-in-up ${
				isActive
					? "border-cyan-500 bg-slate-800/80 shadow-lg shadow-cyan-500/10 animate-pulse-glow"
					: step.status === "succeeded"
						? "border-green-500/50 bg-slate-800/50"
						: step.status === "failed"
							? "border-red-500/50 bg-slate-800/50"
							: "border-slate-700 bg-slate-800/30"
			}`}
			style={{ animationDelay: `${animationDelay}ms` }}
		>
			{/* Header */}
			<div className="flex items-center gap-3 mb-3">
				<div
					className={`w-10 h-10 rounded-full flex items-center justify-center ${
						isImage ? "bg-amber-500/20" : "bg-blue-500/20"
					}`}
				>
					{isImage ? (
						<Image className="w-5 h-5 text-amber-400" />
					) : (
						<Eye className="w-5 h-5 text-blue-400" />
					)}
				</div>
				<div className="flex-1">
					<div className="font-medium text-white">
						{model?.displayName || step.modelId}
					</div>
					<div className="text-sm text-gray-400">
						Step {step.stepNumber + 1}
					</div>
				</div>
				<div>
					{step.status === "succeeded" && (
						<CheckCircle className="w-5 h-5 text-blue-400" />
					)}
					{step.status === "failed" && (
						<XCircle className="w-5 h-5 text-red-400" />
					)}
					{(step.status === "running" || step.status === "pending") &&
						isActive && (
							<Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
						)}
				</div>
			</div>

			{/* Input */}
			<div className="mb-3">
				<div className="text-xs text-gray-500 mb-1">Input:</div>
				{isValidImageUrl(step.input) ? (
					<img
						src={step.input}
						alt="Input"
						className="w-full max-h-48 object-contain rounded-lg bg-slate-900"
						referrerPolicy="no-referrer"
					/>
				) : (
					<p className="text-sm text-gray-300 bg-slate-900/50 p-2 rounded-lg line-clamp-3">
						{step.input}
					</p>
				)}
			</div>

			{/* Output */}
			{step.status === "succeeded" && step.output && (
				<div>
					<div className="text-xs text-gray-500 mb-1">Output:</div>
					{isImage ? (
						<img
							src={step.output}
							alt="Generated"
							className="w-full rounded-lg shadow-lg"
						/>
					) : (
						<p className="text-sm text-gray-300 bg-slate-900/50 p-2 rounded-lg">
							{step.output}
						</p>
					)}
				</div>
			)}

			{/* Error */}
			{step.status === "failed" && step.error && (
				<div className="mt-2 p-2 bg-red-500/20 rounded-lg text-red-400 text-sm">
					{step.error}
				</div>
			)}

			{/* Loading */}
			{isActive && (step.status === "running" || step.status === "pending") && (
				<div className="flex items-center gap-2 text-cyan-400 text-sm">
					<Loader2 className="w-4 h-4 animate-spin" />
					<span className="animate-shimmer bg-clip-text">
						{step.status === "pending" ? "Starting..." : "Processing..."}
					</span>
				</div>
			)}
		</div>
	);
}

function GamePage() {
	const initialData = Route.useLoaderData();
	const [game, setGame] = useState<Game>(initialData.game);
	const [steps, setSteps] = useState<GameStep[]>(initialData.steps);
	const [isPolling, setIsPolling] = useState(false);
	const [errorCount, setErrorCount] = useState(0);
	const [copied, setCopied] = useState(false);
	const [apiToken, setApiToken] = useState("");
	const [tokenError, setTokenError] = useState(false);
	const isMountedRef = useRef(true);

	// Load token from localStorage on mount
	useEffect(() => {
		const stored = getStoredToken();
		setApiToken(stored);
		if (stored) {
			// Start polling only after token is loaded
			setIsPolling(true);
		} else {
			setTokenError(true);
		}
	}, []);

	const runStep = useCallback(async () => {
		if (game.status === "completed" || game.status === "failed") {
			setIsPolling(false);
			return;
		}

		if (!apiToken) {
			setTokenError(true);
			setIsPolling(false);
			return;
		}

		try {
			const result = await runGameStep({ data: { gameId: game.id, replicateToken: apiToken } });

			// Check if component is still mounted
			if (!isMountedRef.current) return;

			if (result.game) {
				setGame(result.game);
			}

			// Update steps from result instead of making another API call
			if (result.step) {
				setSteps((prev) => {
					const existing = prev.find((s) => s.id === result.step?.id);
					if (existing) {
						return prev.map((s) => (s.id === result.step?.id ? result.step! : s));
					}
					return [...prev, result.step!];
				});
			}

			if (result.done) {
				// Fetch final state once when done
				const fullState = await getGame({ data: { gameId: game.id } });
				if (isMountedRef.current) {
					setSteps(fullState.steps);
					setIsPolling(false);
				}
			}

			setErrorCount(0); // Reset error count on success
		} catch (error) {
			console.error("Error running step:", error);
			setErrorCount((prev) => prev + 1);

			// Stop polling after 5 consecutive errors
			if (errorCount >= 4) {
				setIsPolling(false);
			}
		}
	}, [game.id, game.status, errorCount, apiToken]);

	useEffect(() => {
		isMountedRef.current = true;

		if (!isPolling) return;

		// Start running immediately
		runStep();

		// Poll every 3 seconds
		const interval = setInterval(runStep, 3000);
		return () => {
			isMountedRef.current = false;
			clearInterval(interval);
		};
	}, [isPolling, runStep]);

	// Validate modelChain with runtime check
	const modelChain = Array.isArray(game.modelChain) ? game.modelChain : [];
	const progress = Math.min(
		(steps.filter((s) => s.status === "succeeded").length / modelChain.length) *
			100,
		100,
	);

	// If no token and game is not complete, show error
	if (tokenError && game.status !== "completed" && game.status !== "failed") {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
				<div className="max-w-md mx-auto text-center py-20">
					<h1 className="text-2xl font-bold text-white mb-4">
						API Token Required
					</h1>
					<p className="text-gray-400 mb-6">
						To run this game, you need to provide your Replicate API token.
						Please go back to the play page and enter your token.
					</p>
					<Link
						to="/play"
						className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors"
					>
						Go to Play Page
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">
						{game.status === "completed"
							? "Game Complete!"
							: game.status === "failed"
								? "Game Failed"
								: "Game in Progress"}
					</h1>
					<p className="text-gray-400">
						{game.status === "running" || game.status === "pending"
							? "Watch as each model transforms the message..."
							: game.status === "completed"
								? "See how the message transformed through the chain"
								: "Something went wrong during the game"}
					</p>
				</div>

				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex justify-between text-sm text-gray-400 mb-2">
						<span>Progress</span>
						<span>
							{steps.filter((s) => s.status === "succeeded").length} /{" "}
							{modelChain.length} steps
						</span>
					</div>
					<div className="h-2 bg-slate-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Initial Prompt */}
				<div className="mb-6 p-4 rounded-xl border border-slate-700 bg-slate-800/50 animate-fade-in-up">
					<div className="text-sm text-gray-400 mb-1">Starting Prompt</div>
					<p className="text-white">{game.initialPrompt}</p>
				</div>

				{/* Steps */}
				<div className="space-y-4">
					{steps.map((step, index) => (
						<div key={step.id} className="animate-fade-in">
							<StepCard
								step={step}
								isActive={
									game.currentStep === step.stepNumber &&
									(game.status === "running" || game.status === "pending")
								}
								animationDelay={index * 100}
							/>
							{index < steps.length - 1 && (
								<div className="flex justify-center py-2">
									<ArrowRight className="w-5 h-5 text-gray-600 animate-fade-in" style={{ animationDelay: `${index * 100 + 50}ms` }} />
								</div>
							)}
						</div>
					))}

					{/* Pending steps placeholder */}
					{game.status !== "completed" &&
						game.status !== "failed" &&
						modelChain.slice(steps.length).map((modelId, index) => {
							const model = getModelById(modelId);
							const isImage = model?.type === "text-to-image";
							return (
								<div key={`pending-${modelId}-${index}`}>
									{steps.length > 0 || index > 0 ? (
										<div className="flex justify-center py-2">
											<ArrowRight className="w-5 h-5 text-gray-600" />
										</div>
									) : null}
									<div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 opacity-50">
										<div className="flex items-center gap-3">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													isImage ? "bg-purple-500/10" : "bg-green-500/10"
												}`}
											>
												{isImage ? (
													<Image className="w-5 h-5 text-amber-400/50" />
												) : (
													<Eye className="w-5 h-5 text-blue-400/50" />
												)}
											</div>
											<div>
												<div className="font-medium text-gray-500">
													{model?.displayName || modelId}
												</div>
												<div className="text-sm text-gray-600">
													Step {steps.length + index + 1} - Waiting...
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
				</div>

				{/* Final Result */}
				{game.status === "completed" && steps.length > 0 && (() => {
					const lastStep = steps[steps.length - 1];
					if (!lastStep.output) return null;
					return (
						<div className="mt-8 p-6 rounded-xl border-2 border-cyan-500/50 bg-slate-800/50 animate-fade-in-up animate-pulse-glow">
							<h2 className="text-xl font-semibold text-white mb-4 text-center">
								Final Result
							</h2>
							<div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
								{lastStep.modelType === "text-to-image" && isValidImageUrl(lastStep.output) ? (
									<img
										src={lastStep.output}
										alt="Final result"
										className="w-full rounded-lg shadow-xl"
										referrerPolicy="no-referrer"
									/>
								) : (
									<p className="text-lg text-gray-300 text-center">
										{lastStep.output}
									</p>
								)}
							</div>
						</div>
					);
				})()}

				{/* Actions */}
				<div className="mt-8 flex justify-center gap-4">
					<Link
						to="/play"
						className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center gap-2 transition-colors"
					>
						<RotateCcw className="w-5 h-5" />
						New Game
					</Link>
					{game.status === "completed" && (
						<button
							type="button"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(window.location.href);
									setCopied(true);
									setTimeout(() => setCopied(false), 2000);
								} catch (error) {
									console.error("Failed to copy:", error);
								}
							}}
							className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium flex items-center gap-2 transition-colors"
						>
							{copied ? (
								<>
									<Check className="w-5 h-5" />
									Copied!
								</>
							) : (
								<>
									<Share2 className="w-5 h-5" />
									Share
								</>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
