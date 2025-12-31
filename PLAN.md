# AI-rtic Phone - Implementation Plan

## Project Overview

A "telephone" game where AI models pass messages through a chain: text-to-image models generate images from prompts, vision models describe what they see, and that description becomes the next prompt. Users select their model lineup, provide an initial prompt, and watch the message transform.

---

## Current State

The project is a TanStack Start boilerplate with:
- ✅ TanStack Start/Router/Query configured
- ✅ Drizzle ORM + D1 setup (basic todos schema only)
- ✅ Cloudflare integration (Workers, D1, R2)
- ✅ Tailwind CSS v4 styling
- ✅ Biome linting/formatting
- ⚠️ No Replicate SDK installed
- ⚠️ No game logic implemented
- ⚠️ No actual routes beyond boilerplate

---

## Phase 1: Foundation & Infrastructure

### 1.1 Install Dependencies
- Add `replicate` npm package
- Verify all existing dependencies work

### 1.2 Environment Configuration
Update `src/env.ts` to include:
- `REPLICATE_API_TOKEN` (server-side, required)
- `R2_BUCKET_NAME` (server-side, for image storage)
- `R2_PUBLIC_URL` (client-side, for displaying images)

### 1.3 Database Schema
Replace demo `todos` table with game schema in `src/db/schema.ts`:

```
games
├── id (primary key)
├── initialPrompt (text)
├── status (enum: pending, running, completed, failed)
├── createdAt (timestamp)
└── completedAt (timestamp, nullable)

gameSteps
├── id (primary key)
├── gameId (foreign key → games)
├── stepNumber (integer)
├── modelId (text - e.g., "black-forest-labs/flux-schnell")
├── modelType (enum: text-to-image, vision)
├── input (text - prompt or image URL)
├── output (text - image URL or description)
├── predictionId (text - Replicate prediction ID)
├── status (enum: pending, running, succeeded, failed)
├── createdAt (timestamp)
└── completedAt (timestamp, nullable)
```

---

## Phase 2: Replicate Integration

### 2.1 Model Registry
Create `src/lib/models.ts` with curated model lists:

**Text-to-Image Models:**
- `black-forest-labs/flux-schnell` - Fast, high quality
- `black-forest-labs/flux-dev` - Higher quality, slower
- `stability-ai/sdxl` - Stable Diffusion XL
- `bytedance/sdxl-lightning-4step` - Very fast

**Vision/Analysis Models:**
- `meta/llama-3.2-90b-vision-instruct` - Llama vision
- `google/gemini-flash-1.5` - Gemini vision (if available)
- `yorickvp/llava-13b` - LLaVA

Each model entry should include:
- `id` (owner/name)
- `displayName`
- `type` (text-to-image | vision)
- `description`
- `averageTime` (for UI estimates)

### 2.2 Replicate Service
Create `src/lib/replicate.ts`:

```typescript
// Core functions:
createImagePrediction(modelId, prompt) → predictionId
createVisionPrediction(modelId, imageUrl, prompt) → predictionId
getPredictionStatus(predictionId) → status, output
waitForPrediction(predictionId) → output
```

### 2.3 Image Storage
Create `src/lib/storage.ts`:
- `uploadImageFromUrl(url)` - Fetch from Replicate, upload to R2
- `getPublicUrl(key)` - Generate public URL for stored image

---

## Phase 3: Core Game Logic

### 3.1 Game Engine
Create `src/lib/game-engine.ts`:

```typescript
interface GameConfig {
  initialPrompt: string;
  modelChain: ModelSelection[]; // Array of selected models in order
}

// Functions:
startGame(config) → gameId
processNextStep(gameId) → step result
getGameState(gameId) → full game with all steps
```

### 3.2 Server Functions
Create `src/server/game.ts`:

```typescript
// Using createServerFn from @tanstack/react-start
createGame(config) → { gameId }
getGame(gameId) → { game, steps }
runStep(gameId) → { step } // Trigger next step
cancelGame(gameId) → { success }
```

### 3.3 Polling/Real-time Updates
Options:
1. **Polling** (simpler): Client polls for updates every 2-3 seconds
2. **SSE** (better UX): Server-sent events for real-time step updates

Recommend starting with polling, can add SSE later.

---

## Phase 4: User Interface

### 4.1 Route Structure
```
src/routes/
├── index.tsx          # Landing page → "Start New Game" CTA
├── play.tsx           # Game setup: select models, enter prompt
├── game.$gameId.tsx   # Live game view: watch chain unfold
├── history.tsx        # Browse past games
└── api/
    ├── games.ts       # REST endpoints for games
    └── predictions.ts # Webhook endpoint for Replicate
```

### 4.2 Components
```
src/components/
├── Header.tsx         # (exists) Update with nav
├── ModelSelector.tsx  # Drag-drop model lineup builder
├── ModelCard.tsx      # Individual model display
├── GameChain.tsx      # Visual chain of steps
├── StepCard.tsx       # Single step (image + description)
├── PromptInput.tsx    # Initial prompt entry
├── LoadingStep.tsx    # Animated loading state
└── ShareButton.tsx    # Share game results
```

### 4.3 Key UI Features
- **Model Selection**: Visual grid of available models, drag to reorder
- **Chain Preview**: Show the planned sequence before starting
- **Live Updates**: Steps appear as they complete with animations
- **Image Display**: Full-size image viewing, zoom capability
- **Comparison View**: Side-by-side of original prompt vs final result

---

## Phase 5: Polish & Features

### 5.1 Error Handling
- Graceful failure when a model fails
- Retry mechanism for transient errors
- User-friendly error messages

### 5.2 Rate Limiting
- Limit concurrent games per user/IP
- Implement queue if needed

### 5.3 Sharing
- Generate shareable URLs for completed games
- Open Graph meta tags for social previews
- Copy-to-clipboard for results

### 5.4 History & Persistence
- Browse past games
- Filter by date, status
- Delete old games

---

## Implementation Order

### Sprint 1: Minimal Playable Version
1. Install Replicate SDK
2. Update env.ts with REPLICATE_API_TOKEN
3. Create basic database schema (games, gameSteps)
4. Create Replicate service with basic prediction functions
5. Create `/play` route with hardcoded model list
6. Create `/game/$gameId` route with polling
7. Wire up end-to-end flow

### Sprint 2: Full Model Selection
1. Build out model registry with all supported models
2. Create ModelSelector component
3. Add drag-drop reordering
4. Show model details/previews

### Sprint 3: Storage & Persistence
1. Integrate R2 for image storage
2. Implement game history
3. Add `/history` route

### Sprint 4: Polish
1. Add animations and transitions
2. Implement sharing features
3. Add error handling and retry logic
4. Performance optimization

---

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/games` | Create new game |
| GET | `/api/games/:id` | Get game state |
| POST | `/api/games/:id/run` | Run next step |
| DELETE | `/api/games/:id` | Cancel/delete game |
| GET | `/api/games` | List user's games |
| POST | `/api/webhooks/replicate` | Replicate callback |

---

## Replicate API Usage

### Text-to-Image Prediction
```typescript
const prediction = await replicate.predictions.create({
  model: "black-forest-labs/flux-schnell",
  input: { prompt: "A cat wearing a top hat" }
});
// Poll prediction.id until status === "succeeded"
// Output: prediction.output[0] → image URL
```

### Vision Prediction
```typescript
const prediction = await replicate.predictions.create({
  model: "meta/llama-3.2-90b-vision-instruct",
  input: {
    image: "https://...",
    prompt: "Describe this image in detail for an artist to recreate it."
  }
});
// Output: prediction.output → text description
```

---

## Key Decisions

1. **Polling vs Webhooks**: Start with polling for simplicity; webhooks require public endpoint
2. **Image Storage**: R2 for persistence; Replicate URLs expire after 1 hour
3. **Model Selection**: Curated list rather than searching all Replicate models
4. **Vision Prompt**: Standardized prompt asking for artistic recreation details

---

## Success Criteria

- [ ] User can select 3+ models for a chain
- [ ] Game runs automatically through all steps
- [ ] Images display in real-time as they complete
- [ ] Final results show full transformation journey
- [ ] Games persist and can be viewed later
- [ ] Share links work with social previews
