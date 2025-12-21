export type ModelType = "text-to-image" | "vision";

export interface Model {
	id: string;
	displayName: string;
	type: ModelType;
	description: string;
	owner: string;
	name: string;
}

// Text-to-image models
export const TEXT_TO_IMAGE_MODELS: Model[] = [
	// Black Forest Labs - FLUX models
	{
		id: "black-forest-labs/flux-1.1-pro",
		displayName: "FLUX 1.1 Pro",
		type: "text-to-image",
		description: "Faster, better FLUX Pro with excellent image quality",
		owner: "black-forest-labs",
		name: "flux-1.1-pro",
	},
	{
		id: "black-forest-labs/flux-1.1-pro-ultra",
		displayName: "FLUX 1.1 Pro Ultra",
		type: "text-to-image",
		description: "Ultra mode supporting up to 4 megapixel outputs",
		owner: "black-forest-labs",
		name: "flux-1.1-pro-ultra",
	},
	{
		id: "black-forest-labs/flux-schnell",
		displayName: "FLUX Schnell",
		type: "text-to-image",
		description: "The fastest FLUX model for quick generation",
		owner: "black-forest-labs",
		name: "flux-schnell",
	},
	{
		id: "black-forest-labs/flux-dev",
		displayName: "FLUX Dev",
		type: "text-to-image",
		description: "12B parameter model with high quality output",
		owner: "black-forest-labs",
		name: "flux-dev",
	},
	{
		id: "black-forest-labs/flux-pro",
		displayName: "FLUX Pro",
		type: "text-to-image",
		description: "State-of-the-art with superior prompt adherence",
		owner: "black-forest-labs",
		name: "flux-pro",
	},
	// ByteDance - Seedream models
	{
		id: "bytedance/seedream-4.5",
		displayName: "Seedream 4.5",
		type: "text-to-image",
		description: "Latest Seedream with enhanced generation quality",
		owner: "bytedance",
		name: "seedream-4.5",
	},
	{
		id: "bytedance/seedream-4",
		displayName: "Seedream 4",
		type: "text-to-image",
		description: "Unified text-to-image at up to 4K resolution",
		owner: "bytedance",
		name: "seedream-4",
	},
	{
		id: "bytedance/seedream-3",
		displayName: "Seedream 3",
		type: "text-to-image",
		description: "Native high-resolution (2K) image generation",
		owner: "bytedance",
		name: "seedream-3",
	},
	{
		id: "bytedance/sdxl-lightning-4step",
		displayName: "SDXL Lightning",
		type: "text-to-image",
		description: "Ultra-fast 4-step generation",
		owner: "bytedance",
		name: "sdxl-lightning-4step",
	},
	// Google - Imagen models
	{
		id: "google/imagen-4",
		displayName: "Imagen 4",
		type: "text-to-image",
		description: "Google's flagship Imagen 4 model",
		owner: "google",
		name: "imagen-4",
	},
	{
		id: "google/imagen-4-fast",
		displayName: "Imagen 4 Fast",
		type: "text-to-image",
		description: "Fast version when speed and cost matter more",
		owner: "google",
		name: "imagen-4-fast",
	},
	{
		id: "google/imagen-4-ultra",
		displayName: "Imagen 4 Ultra",
		type: "text-to-image",
		description: "Ultra version for maximum quality",
		owner: "google",
		name: "imagen-4-ultra",
	},
	{
		id: "google/imagen-3",
		displayName: "Imagen 3",
		type: "text-to-image",
		description: "High quality with detail, rich lighting and beauty",
		owner: "google",
		name: "imagen-3",
	},
	{
		id: "google/imagen-3-fast",
		displayName: "Imagen 3 Fast",
		type: "text-to-image",
		description: "Faster, cheaper Imagen 3 variant",
		owner: "google",
		name: "imagen-3-fast",
	},
	{
		id: "google/nano-banana",
		displayName: "Nano Banana",
		type: "text-to-image",
		description: "Google's latest image generation model from Gemini 2.5",
		owner: "google",
		name: "nano-banana",
	},
	{
		id: "google/nano-banana-pro",
		displayName: "Nano Banana Pro",
		type: "text-to-image",
		description: "Premium Nano Banana with enhanced capabilities",
		owner: "google",
		name: "nano-banana-pro",
	},
	// Stability AI
	{
		id: "stability-ai/stable-diffusion-3.5-large",
		displayName: "SD 3.5 Large",
		type: "text-to-image",
		description: "High-resolution images with fine details",
		owner: "stability-ai",
		name: "stable-diffusion-3.5-large",
	},
	{
		id: "stability-ai/stable-diffusion-3.5-large-turbo",
		displayName: "SD 3.5 Large Turbo",
		type: "text-to-image",
		description: "Optimized for fewer inference steps",
		owner: "stability-ai",
		name: "stable-diffusion-3.5-large-turbo",
	},
];

// Vision models that can describe images
export const VISION_MODELS: Model[] = [
	// Google
	{
		id: "google/gemini-2.5-flash",
		displayName: "Gemini 2.5 Flash",
		type: "vision",
		description: "Google's fast hybrid AI model",
		owner: "google",
		name: "gemini-2.5-flash",
	},
	// OpenAI
	{
		id: "openai/gpt-4.1-mini",
		displayName: "GPT-4.1 Mini",
		type: "vision",
		description: "Latest OpenAI mini model with vision",
		owner: "openai",
		name: "gpt-4.1-mini",
	},
	{
		id: "openai/gpt-4o",
		displayName: "GPT-4o",
		type: "vision",
		description: "OpenAI's high-intelligence vision model",
		owner: "openai",
		name: "gpt-4o",
	},
	{
		id: "openai/gpt-4o-mini",
		displayName: "GPT-4o Mini",
		type: "vision",
		description: "Low latency, low cost GPT-4o variant",
		owner: "openai",
		name: "gpt-4o-mini",
	},
	// Anthropic
	{
		id: "anthropic/claude-4.5-sonnet",
		displayName: "Claude 4.5 Sonnet",
		type: "vision",
		description: "Best coding model with vision capabilities",
		owner: "anthropic",
		name: "claude-4.5-sonnet",
	},
	{
		id: "anthropic/claude-4-sonnet",
		displayName: "Claude 4 Sonnet",
		type: "vision",
		description: "Superior coding and reasoning capabilities",
		owner: "anthropic",
		name: "claude-4-sonnet",
	},
	{
		id: "anthropic/claude-3.7-sonnet",
		displayName: "Claude 3.7 Sonnet",
		type: "vision",
		description: "Intelligent Claude with hybrid reasoning",
		owner: "anthropic",
		name: "claude-3.7-sonnet",
	},
	{
		id: "anthropic/claude-3.5-sonnet",
		displayName: "Claude 3.5 Sonnet",
		type: "vision",
		description: "200K context with image understanding",
		owner: "anthropic",
		name: "claude-3.5-sonnet",
	},
	// Other vision models
	{
		id: "lucataco/moondream2",
		displayName: "Moondream 2",
		type: "vision",
		description: "Efficient small vision language model",
		owner: "lucataco",
		name: "moondream2",
	},
];

// All models combined
export const ALL_MODELS: Model[] = [...TEXT_TO_IMAGE_MODELS, ...VISION_MODELS];

// Helper to get model by ID
export function getModelById(id: string): Model | undefined {
	return ALL_MODELS.find((model) => model.id === id);
}

// Helper to get model type
export function getModelType(id: string): ModelType | undefined {
	return getModelById(id)?.type;
}

// Standard prompt for vision models to describe images
export const VISION_PROMPT = `Describe this image in detail as if you were giving instructions to an artist who needs to recreate it. Focus on:
- The main subject and its position
- Colors, lighting, and mood
- Style and artistic elements
- Background and environment
- Any text or symbols visible

Be specific and descriptive, but keep it to 2-3 sentences that capture the essence of the image.`;
