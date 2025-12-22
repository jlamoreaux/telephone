import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Clock,
	CheckCircle,
	XCircle,
	Loader2,
	ArrowRight,
	Play,
} from "lucide-react";
import { listGames } from "@/server/game";
import type { Game } from "@/db/schema";

export const Route = createFileRoute("/history")({
	component: HistoryPage,
	loader: async () => {
		const result = await listGames();
		return result;
	},
});

function formatDate(date: Date | null): string {
	if (!date) return "Unknown";
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function GameCard({ game }: { game: Game }) {
	const modelChain = Array.isArray(game.modelChain) ? game.modelChain : [];

	return (
		<Link
			to="/game/$gameId"
			params={{ gameId: game.id }}
			className="block p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all group"
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					{/* Status Badge */}
					<div className="flex items-center gap-2 mb-2">
						{game.status === "completed" && (
							<span className="flex items-center gap-1 text-blue-400 text-sm">
								<CheckCircle className="w-4 h-4" />
								Completed
							</span>
						)}
						{game.status === "failed" && (
							<span className="flex items-center gap-1 text-red-400 text-sm">
								<XCircle className="w-4 h-4" />
								Failed
							</span>
						)}
						{(game.status === "running" || game.status === "pending") && (
							<span className="flex items-center gap-1 text-cyan-400 text-sm">
								<Loader2 className="w-4 h-4 animate-spin" />
								In Progress
							</span>
						)}
						<span className="text-gray-500 text-sm">
							{formatDate(game.createdAt)}
						</span>
					</div>

					{/* Prompt */}
					<p className="text-white font-medium line-clamp-2 mb-2">
						{game.initialPrompt}
					</p>

					{/* Model Count */}
					<p className="text-gray-400 text-sm">
						{modelChain.length} models in chain
					</p>
				</div>

				{/* Arrow */}
				<div className="flex-shrink-0 mt-2">
					<ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
				</div>
			</div>
		</Link>
	);
}

function HistoryPage() {
	const { games } = Route.useLoaderData();

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-3xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8 animate-fade-in-up">
					<div className="flex items-center justify-center gap-3 mb-4">
						<Clock className="w-10 h-10 text-cyan-400" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">Game History</h1>
					<p className="text-gray-400">
						Browse your past games and see how messages transformed
					</p>
				</div>

				{/* Games List */}
				{games.length === 0 ? (
					<div className="text-center py-16 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
						<p className="text-gray-400 mb-6">No games yet. Start your first one!</p>
						<Link
							to="/play"
							className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 hover:scale-105 active:scale-95 text-white font-semibold rounded-xl transition-all"
						>
							<Play className="w-5 h-5" />
							Start a New Game
						</Link>
					</div>
				) : (
					<div className="space-y-3">
						{games.map((game, index) => (
							<div
								key={game.id}
								className="animate-fade-in-up"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<GameCard game={game} />
							</div>
						))}
					</div>
				)}

				{/* New Game Button */}
				{games.length > 0 && (
					<div className="mt-8 text-center">
						<Link
							to="/play"
							className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
						>
							<Play className="w-5 h-5" />
							Start a New Game
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
