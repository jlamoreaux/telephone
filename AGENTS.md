# AGENTS.md

Guidelines for AI coding assistants working on this codebase.

## Project Overview

Telephone AI is an interactive game where AI models play "telephone" - a text-to-image model generates an image from a prompt, a vision model describes what it sees, and that description becomes the next prompt. This continues through a chain of models selected by the user.

## Architecture

### Stack
- **TanStack Start** - Full-stack React framework with SSR
- **TanStack Router** - File-based routing in `src/routes/`
- **TanStack Query** - Server state and caching
- **Drizzle ORM** - Database operations with D1
- **Replicate** - AI model API for image generation and vision
- **Cloudflare** - D1 (database), R2 (image storage), Workers (hosting)

### Key Directories
```
src/
├── routes/          # File-based routes (TanStack Router)
├── components/      # React components
├── db/              # Drizzle schema and database instance
├── integrations/    # Third-party integrations (TanStack Query)
└── env.ts           # Type-safe environment variables (T3Env)
```

### Routing Conventions
- Routes are defined as files in `src/routes/`
- `__root.tsx` is the root layout
- API routes use `.ts` extension (e.g., `api.names.ts` → `/api/names`)
- Page routes use `.tsx` extension

### Server Functions
Use `createServerFn` from `@tanstack/react-start` for server-side operations:
```ts
import { createServerFn } from "@tanstack/react-start";

const myServerFn = createServerFn({ method: "GET" }).handler(async () => {
  // Server-side code
});
```

## Code Style

### TypeScript
- Strict mode enabled
- Use path aliases: `@/*` maps to `src/*`
- Prefer explicit types over `any`

### Formatting
- **Biome** for linting and formatting
- Tab indentation, double quotes
- Run `bun run format` before committing

### Components
- Functional components with hooks
- Tailwind CSS for styling
- Lucide React for icons

### Data Fetching Patterns
1. **Server Functions** - For mutations and server-only data
2. **Route Loaders** - For SSR data requirements
3. **TanStack Query** - For client-side caching and real-time updates

## Environment Variables

Defined in `src/env.ts` using T3Env with Zod validation:
- Client-side: prefix with `VITE_`
- Server-side: no prefix required

Required variables:
- `REPLICATE_API_TOKEN` - Replicate API key
- `DATABASE_URL` - D1 database connection

## Database

### Schema Location
`src/db/schema.ts` - Drizzle schema definitions

### Commands
```bash
bun run db:generate  # Generate migrations
bun run db:push      # Push schema changes
bun run db:studio    # Open Drizzle Studio
```

## Testing

- **Vitest** for unit tests
- **Testing Library** for React component tests
- Run with `bun run test`

## Cloudflare Integration

### D1 (Database)
- SQLite-compatible
- Configure in `wrangler.jsonc`

### R2 (Storage)
- Used for storing generated images
- Configure buckets in `wrangler.jsonc`

### Workers
- Serverless deployment target
- Node.js compatibility enabled

## Common Tasks

### Adding a New Route
1. Create file in `src/routes/` (e.g., `game.tsx`)
2. Export a `Route` using `createFileRoute`
3. Add navigation link in `Header.tsx` if needed

### Adding a Server Function
```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const myFunction = createServerFn({ method: "POST" })
  .validator(z.object({ input: z.string() }))
  .handler(async ({ data }) => {
    // Implementation
  });
```

### Working with Replicate
- Use server functions to call Replicate API
- Store generated images in R2
- Poll for prediction completion or use webhooks

### Database Operations
```ts
import { db } from "@/db";
import { myTable } from "@/db/schema";

// Query
const items = await db.select().from(myTable);

// Insert
await db.insert(myTable).values({ ... });
```

## Don'ts

- Don't modify demo files (prefixed with `demo.` or in `demo/` folder) - these are boilerplate examples
- Don't commit `.env.local` or API keys
- Don't use `any` types without justification
- Don't skip Biome formatting checks
