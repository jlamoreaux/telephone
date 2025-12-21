import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Plus,
	Trash2,
	Play,
	Image,
	Eye,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { TEXT_TO_IMAGE_MODELS, VISION_MODELS, type Model } from "@/lib/models";
import { createGame } from "@/server/game";

export const Route = createFileRoute("/play")({
	component: PlayPage,
});

function ModelCard({
	model,
	onAdd,
	disabled,
}: {
	model: Model;
	onAdd: () => void;
	disabled?: boolean;
}) {
	const isImage = model.type === "text-to-image";
	return (
		<button
			type="button"
			onClick={onAdd}
			disabled={disabled}
			className={`p-3 rounded-lg border text-left transition-all ${
				disabled
					? "opacity-50 cursor-not-allowed border-slate-700 bg-slate-800/30"
					: "border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-700/50 cursor-pointer"
			}`}
		>
			<div className="flex items-center gap-2 mb-1">
				{isImage ? (
					<Image className="w-4 h-4 text-purple-400" />
				) : (
					<Eye className="w-4 h-4 text-green-400" />
				)}
				<span className="font-medium text-white text-sm">
					{model.displayName}
				</span>
			</div>
			<p className="text-xs text-gray-400 line-clamp-1">{model.description}</p>
		</button>
	);
}

function ChainStep({
	model,
	index,
	onRemove,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: {
	model: Model;
	index: number;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
}) {
	const isImage = model.type === "text-to-image";
	return (
		<div className="flex items-center gap-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50">
			<div className="flex flex-col gap-0.5">
				<button
					type="button"
					onClick={onMoveUp}
					disabled={isFirst}
					className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronUp className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={onMoveDown}
					disabled={isLast}
					className="p-0.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
				>
					<ChevronDown className="w-4 h-4" />
				</button>
			</div>
			<div
				className={`w-8 h-8 rounded-full flex items-center justify-center ${
					isImage ? "bg-purple-500/20" : "bg-green-500/20"
				}`}
			>
				{isImage ? (
					<Image className="w-4 h-4 text-purple-400" />
				) : (
					<Eye className="w-4 h-4 text-green-400" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-white text-sm truncate">
					{model.displayName}
				</div>
				<div className="text-xs text-gray-400">
					Step {index + 1} &middot;{" "}
					{isImage ? "Generates image" : "Describes image"}
				</div>
			</div>
			<button
				type="button"
				onClick={onRemove}
				className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
			>
				<Trash2 className="w-4 h-4" />
			</button>
		</div>
	);
}

function PlayPage() {
	const navigate = useNavigate();
	const [prompt, setPrompt] = useState("");
	const [chain, setChain] = useState<Model[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addToChain = (model: Model) => {
		setChain([...chain, model]);
	};

	const removeFromChain = (index: number) => {
		setChain(chain.filter((_, i) => i !== index));
	};

	const moveUp = (index: number) => {
		if (index === 0) return;
		const newChain = [...chain];
		[newChain[index - 1], newChain[index]] = [
			newChain[index],
			newChain[index - 1],
		];
		setChain(newChain);
	};

	const moveDown = (index: number) => {
		if (index === chain.length - 1) return;
		const newChain = [...chain];
		[newChain[index], newChain[index + 1]] = [
			newChain[index + 1],
			newChain[index],
		];
		setChain(newChain);
	};

	const canStart = prompt.trim().length > 0 && chain.length >= 2;

	const handleStart = async () => {
		if (!canStart) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const result = await createGame({
				data: {
					initialPrompt: prompt.trim(),
					modelChain: chain.map((m) => m.id),
				},
			});
			navigate({ to: "/game/$gameId", params: { gameId: result.gameId } });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create game");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-white mb-2">
						Start a New Game
					</h1>
					<p className="text-gray-400">
						Build your AI chain and watch the telephone game unfold
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left: Model Selection */}
					<div className="lg:col-span-2 space-y-6">
						{/* Prompt Input */}
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<label
								htmlFor="prompt"
								className="block text-lg font-semibold text-white mb-3"
							>
								Starting Prompt
							</label>
							<textarea
								id="prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe the first image you want to generate..."
								className="w-full h-24 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
							/>
						</div>

						{/* Text-to-Image Models */}
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<div className="flex items-center gap-2 mb-4">
								<Image className="w-5 h-5 text-purple-400" />
								<h2 className="text-lg font-semibold text-white">
									Image Generation Models
								</h2>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{TEXT_TO_IMAGE_MODELS.map((model) => (
									<ModelCard
										key={model.id}
										model={model}
										onAdd={() => addToChain(model)}
									/>
								))}
							</div>
						</div>

						{/* Vision Models */}
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<div className="flex items-center gap-2 mb-4">
								<Eye className="w-5 h-5 text-green-400" />
								<h2 className="text-lg font-semibold text-white">
									Vision Models
								</h2>
							</div>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{VISION_MODELS.map((model) => (
									<ModelCard
										key={model.id}
										model={model}
										onAdd={() => addToChain(model)}
									/>
								))}
							</div>
						</div>
					</div>

					{/* Right: Chain Builder */}
					<div className="lg:col-span-1">
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 sticky top-6">
							<h2 className="text-lg font-semibold text-white mb-4">
								Your Chain
							</h2>

							{chain.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
									<p>Click models to add them to your chain</p>
									<p className="text-sm mt-1">Minimum 2 models required</p>
								</div>
							) : (
								<div className="space-y-2 mb-4">
									{chain.map((model, index) => (
										<ChainStep
											key={`${model.id}-${index}`}
											model={model}
											index={index}
											onRemove={() => removeFromChain(index)}
											onMoveUp={() => moveUp(index)}
											onMoveDown={() => moveDown(index)}
											isFirst={index === 0}
											isLast={index === chain.length - 1}
										/>
									))}
								</div>
							)}

							{/* Chain Flow Preview */}
							{chain.length > 0 && (
								<div className="mt-4 pt-4 border-t border-slate-700">
									<div className="text-sm text-gray-400 mb-2">Flow:</div>
									<div className="text-xs text-gray-500">
										<span className="text-cyan-400">Prompt</span>
										{chain.map((model, i) => (
											<span key={`flow-${model.id}-${i}`}>
												{" → "}
												<span
													className={
														model.type === "text-to-image"
															? "text-purple-400"
															: "text-green-400"
													}
												>
													{model.displayName}
												</span>
											</span>
										))}
									</div>
								</div>
							)}

							{error && (
								<div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
									{error}
								</div>
							)}

							<button
								type="button"
								onClick={handleStart}
								disabled={!canStart || isSubmitting}
								className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
									canStart && !isSubmitting
										? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
										: "bg-slate-700 text-gray-500 cursor-not-allowed"
								}`}
							>
								{isSubmitting ? (
									<>
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Starting...
									</>
								) : (
									<>
										<Play className="w-5 h-5" />
										Start Game
									</>
								)}
							</button>

							{!canStart && chain.length > 0 && chain.length < 2 && (
								<p className="text-center text-sm text-gray-500 mt-2">
									Add at least one more model
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
