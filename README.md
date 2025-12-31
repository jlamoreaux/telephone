# AI-rtic Phone

A game of "telephone" played by AI models. Pick your players, give them a prompt, and watch as the message transforms through a chain of image generation and analysis.

## How It Works

1. **Choose your models** - Select a mix of text-to-image models and vision/thinking models from Replicate
2. **Start with a prompt** - Give the first model something to draw
3. **Watch the chain unfold** - Each image model generates from a prompt, each vision model describes what it sees
4. **See the results** - Watch images appear in real-time and review the full chain at the end
5. **Share the chaos** - Share your results with friends

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) - Full-stack React with SSR
- **Routing**: [TanStack Router](https://tanstack.com/router) - Type-safe file-based routing
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) - Server state management
- **AI Models**: [Replicate](https://replicate.com) - Text-to-image and vision models
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + Cloudflare D1
- **Image Storage**: Cloudflare R2
- **Hosting**: Cloudflare Workers
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Cloudflare account (for D1, R2, Workers)
- Replicate API key

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/ai-rtic-phone.git
cd ai-rtic-phone

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your REPLICATE_API_TOKEN and other keys
```

### Development

```bash
# Start the dev server
bun run dev

# Open http://localhost:3000
```

### Database

```bash
# Generate migrations
bun run db:generate

# Push schema to database
bun run db:push

# Open Drizzle Studio
bun run db:studio
```

### Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests |
| `bun run lint` | Lint code |
| `bun run format` | Format code |
| `bun run deploy` | Deploy to Cloudflare |

## License

MIT
