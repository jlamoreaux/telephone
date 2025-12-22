import { useState, useRef, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Plus,
	Trash2,
	Play,
	Image,
	Eye,
	GripVertical,
	AlertTriangle,
	Shuffle,
	Dices,
} from "lucide-react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TEXT_TO_IMAGE_MODELS, VISION_MODELS, type Model } from "@/lib/models";
import { createGame } from "@/server/game";

// Chain limits (must match server-side constants)
const MAX_CHAIN_LENGTH = 10;
const MAX_MODEL_USES = 2;

export const Route = createFileRoute("/play")({
	component: PlayPage,
});

function ModelCard({
	model,
	onAdd,
	disabled,
	useCount = 0,
}: {
	model: Model;
	onAdd: () => void;
	disabled?: boolean;
	useCount?: number;
}) {
	const isImage = model.type === "text-to-image";
	const isMaxed = useCount >= MAX_MODEL_USES;
	return (
		<button
			type="button"
			onClick={onAdd}
			disabled={disabled}
			className={`p-3 rounded-lg border text-left transition-all relative ${
				disabled
					? "opacity-50 cursor-not-allowed border-slate-700 bg-slate-800/30"
					: "border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-700/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
			}`}
		>
			{useCount > 0 && (
				<div
					className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
						isMaxed
							? "bg-red-500/80 text-white"
							: "bg-cyan-500/80 text-white"
					}`}
				>
					{useCount}
				</div>
			)}
			<div className="flex items-center gap-2 mb-1">
				{isImage ? (
					<Image className="w-4 h-4 text-amber-400" />
				) : (
					<Eye className="w-4 h-4 text-blue-400" />
				)}
				<span className="font-medium text-white text-sm">
					{model.displayName}
				</span>
			</div>
			<p className="text-xs text-gray-400 line-clamp-2">{model.description}</p>
		</button>
	);
}

// Chain item with unique ID for drag-and-drop
interface ChainItem {
	id: string;
	model: Model;
}

function SortableChainStep({
	item,
	index,
	onRemove,
}: {
	item: ChainItem;
	index: number;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const isImage = item.model.type === "text-to-image";

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 p-3 rounded-lg border bg-slate-800/50 ${
				isDragging
					? "border-cyan-500 shadow-lg shadow-cyan-500/20 z-50"
					: "border-slate-700"
			}`}
		>
			<button
				type="button"
				className="p-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing touch-none"
				{...attributes}
				{...listeners}
			>
				<GripVertical className="w-4 h-4" />
			</button>
			<div
				className={`w-8 h-8 rounded-full flex items-center justify-center ${
					isImage ? "bg-amber-500/20" : "bg-blue-500/20"
				}`}
			>
				{isImage ? (
					<Image className="w-4 h-4 text-amber-400" />
				) : (
					<Eye className="w-4 h-4 text-blue-400" />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-white text-sm break-words">
					{item.model.displayName}
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
	const [chain, setChain] = useState<ChainItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextId, setNextId] = useState(1);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.max(96, textarea.scrollHeight)}px`;
		}
	}, [prompt]);

	// DnD sensors for pointer and keyboard
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Count how many times each model is used in the chain
	const getModelUseCount = (modelId: string): number => {
		return chain.filter((item) => item.model.id === modelId).length;
	};

	// Check if a model can be added (not at max uses and chain not full)
	const canAddModel = (modelId: string): boolean => {
		if (chain.length >= MAX_CHAIN_LENGTH) return false;
		return getModelUseCount(modelId) < MAX_MODEL_USES;
	};

	const addToChain = (model: Model) => {
		if (!canAddModel(model.id)) return;
		setChain([...chain, { id: `chain-${nextId}`, model }]);
		setNextId(nextId + 1);
	};

	const removeFromChain = (id: string) => {
		setChain(chain.filter((item) => item.id !== id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			setChain((items) => {
				const oldIndex = items.findIndex((item) => item.id === active.id);
				const newIndex = items.findIndex((item) => item.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const autoSortChain = () => {
		const imageModels = chain.filter((item) => item.model.type === "text-to-image");
		const visionModels = chain.filter((item) => item.model.type === "vision");

		const sorted: ChainItem[] = [];
		const maxLen = Math.max(imageModels.length, visionModels.length);

		for (let i = 0; i < maxLen; i++) {
			if (i < imageModels.length) sorted.push(imageModels[i]);
			if (i < visionModels.length) sorted.push(visionModels[i]);
		}

		setChain(sorted);
	};

	// Validate chain pattern: must be image → vision → image → vision → ... → image
	const validateChainPattern = (): { valid: boolean; errors: string[]; hints: string[] } => {
		const errors: string[] = [];
		const hints: string[] = [];

		if (chain.length < 3) {
			errors.push("Need at least 3 models");
			hints.push("Try: Image → Vision → Image");
			return { valid: false, errors, hints };
		}

		// Must start with image
		if (chain[0].model.type !== "text-to-image") {
			errors.push("First model must generate an image");
			hints.push("Drag an image model to position 1, or use auto-sort");
		}

		// Must end with image
		if (chain[chain.length - 1].model.type !== "text-to-image") {
			errors.push("Last model must generate an image");
			hints.push("Add an image model at the end, or use auto-sort");
		}

		// Must alternate
		for (let i = 0; i < chain.length - 1; i++) {
			if (chain[i].model.type === chain[i + 1].model.type) {
				const type = chain[i].model.type === "text-to-image" ? "image" : "vision";
				errors.push(`Steps ${i + 1} & ${i + 2} are both ${type} models`);
				if (!hints.length) {
					hints.push("Use auto-sort to fix the order automatically");
				}
			}
		}

		return { valid: errors.length === 0, errors, hints };
	};

	// Random fill: generates a valid chain with n models
	const randomFill = (count: number) => {
		// Must be odd number >= 3 for valid pattern
		const validCount = Math.max(3, count % 2 === 0 ? count + 1 : count);
		const limitedCount = Math.min(validCount, MAX_CHAIN_LENGTH);

		const newChain: ChainItem[] = [];
		let id = nextId;

		for (let i = 0; i < limitedCount; i++) {
			const isImageSlot = i % 2 === 0;
			const modelList = isImageSlot ? TEXT_TO_IMAGE_MODELS : VISION_MODELS;
			const randomModel = modelList[Math.floor(Math.random() * modelList.length)];
			newChain.push({ id: `chain-${id}`, model: randomModel });
			id++;
		}

		setChain(newChain);
		setNextId(id);
	};

	const chainValidation = chain.length > 0 ? validateChainPattern() : { valid: false, errors: [], hints: [] };
	const canStart = prompt.trim().length > 0 && chain.length >= 3 && chainValidation.valid;

	// Info warnings (non-blocking)
	const warnings: string[] = [];
	if (chain.length >= MAX_CHAIN_LENGTH) {
		warnings.push(`Chain is at maximum length (${MAX_CHAIN_LENGTH} models)`);
	}

	const handleStart = async () => {
		if (!canStart) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const result = await createGame({
				data: {
					initialPrompt: prompt.trim(),
					modelChain: chain.map((item) => item.model.id),
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
				<div className="text-center mb-8 animate-fade-in-up">
					<h1 className="text-4xl font-bold text-white mb-2">
						Start a New Game
					</h1>
					<p className="text-gray-400 mb-4">
						Build your AI chain and watch the telephone game unfold
					</p>
					<div className="flex flex-wrap justify-center gap-x-2 text-sm text-gray-500">
						<span>Describe something wild</span>
						<span className="text-amber-400">→</span>
						<span>AI draws it</span>
						<span className="text-blue-400">→</span>
						<span>AI describes it</span>
						<span className="text-amber-400">→</span>
						<span>Repeat until chaos</span>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Prompt Input - always first */}
					<div className="lg:col-span-2 order-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<label
								htmlFor="prompt"
								className="block text-lg font-semibold text-white mb-3"
							>
								Starting Prompt
							</label>
							<textarea
								ref={textareaRef}
								id="prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe the first image you want to generate..."
								className="w-full min-h-24 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none overflow-hidden"
							/>
						</div>
					</div>

					{/* Chain Builder - second on mobile, right column on desktop */}
					<div className="lg:col-span-1 order-2 lg:order-3 lg:row-span-3">
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 sticky top-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-lg font-semibold text-white">
									Your Chain
								</h2>
								<div className="flex items-center gap-2">
									{chain.length >= 2 && (
										<button
											type="button"
											onClick={autoSortChain}
											className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
											title="Auto-sort: Reorder to Image → Vision → Image pattern"
										>
											<Shuffle className="w-4 h-4" />
										</button>
									)}
									<span className={`text-sm ${chain.length >= MAX_CHAIN_LENGTH ? 'text-red-400' : 'text-gray-400'}`}>
										{chain.length}/{MAX_CHAIN_LENGTH}
									</span>
								</div>
							</div>

							{chain.length === 0 ? (
								<div className="text-center py-6 text-gray-500">
									<Dices className="w-8 h-8 mx-auto mb-3 opacity-50" />
									<p className="text-sm mb-3">Quick start with random models:</p>
									<div className="flex justify-center gap-2 mb-4">
										{[3, 5, 7].map((n) => (
											<button
												key={n}
												type="button"
												onClick={() => randomFill(n)}
												className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
											>
												{n} models
											</button>
										))}
									</div>
									<p className="text-xs text-gray-600">or pick your own below</p>
								</div>
							) : (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={chain.map((item) => item.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className="space-y-2 mb-4">
											{chain.map((item, index) => (
												<SortableChainStep
													key={item.id}
													item={item}
													index={index}
													onRemove={() => removeFromChain(item.id)}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							)}

							{/* Pattern Errors (blocking) */}
							{chainValidation.errors.length > 0 && (
								<div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
									<div className="space-y-1 mb-2">
										{chainValidation.errors.map((err, i) => (
											<div key={i} className="flex items-start gap-2 text-red-400 text-sm">
												<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
												<span>{err}</span>
											</div>
										))}
									</div>
									{chainValidation.hints.length > 0 && (
										<div className="text-xs text-gray-400 border-t border-red-500/20 pt-2 mt-2">
											{chainValidation.hints[0]}
										</div>
									)}
								</div>
							)}

							{/* Info Warnings (non-blocking) */}
							{warnings.length > 0 && (
								<div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
									{warnings.map((warning, i) => (
										<div key={i} className="flex items-start gap-2 text-yellow-400 text-sm">
											<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
											<span>{warning}</span>
										</div>
									))}
								</div>
							)}

							{/* Chain Flow Preview */}
							{chain.length > 0 && (
								<div className="pt-4 border-t border-slate-700">
									<div className="text-sm text-gray-400 mb-2">Flow:</div>
									<div className="text-xs text-gray-500 flex flex-wrap items-center gap-1">
										<span className="text-cyan-400">Prompt</span>
										{chain.map((item, i) => (
											<span key={`flow-${item.id}`} className="flex items-center">
												<span className="mx-1">→</span>
												<span
													className={
														item.model.type === "text-to-image"
															? "text-amber-400"
															: "text-blue-400"
													}
												>
													{item.model.displayName}
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

							{!canStart && chain.length > 0 && !prompt.trim() && (
								<p className="text-center text-sm text-gray-500 mt-2">
									Enter a prompt to start
								</p>
							)}
						</div>
					</div>

					{/* Text-to-Image Models */}
					<div className="lg:col-span-2 order-3 lg:order-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<div className="flex items-center gap-2 mb-4">
								<Image className="w-5 h-5 text-amber-400" />
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
										disabled={!canAddModel(model.id)}
										useCount={getModelUseCount(model.id)}
									/>
								))}
							</div>
						</div>
					</div>

					{/* Vision Models */}
					<div className="lg:col-span-2 order-4 lg:order-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
						<div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
							<div className="flex items-center gap-2 mb-4">
								<Eye className="w-5 h-5 text-blue-400" />
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
										disabled={!canAddModel(model.id)}
										useCount={getModelUseCount(model.id)}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
