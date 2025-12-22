import { Link } from "@tanstack/react-router";
import { Play, History } from "lucide-react";

export default function Header() {
	return (
		<header className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm text-white border-b border-slate-700">
			<Link to="/" className="group flex items-center gap-1">
				<span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-orange-400 transition-all">
					AI
				</span>
				<span className="text-xl font-bold text-white group-hover:text-gray-200 transition-colors">
					-rtic Phone
				</span>
			</Link>

			<nav className="flex items-center gap-4">
				<Link
					to="/play"
					className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
					activeProps={{
						className:
							"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400",
					}}
				>
					<Play className="w-4 h-4" />
					<span>Play</span>
				</Link>
				<Link
					to="/history"
					className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
					activeProps={{
						className:
							"flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400",
					}}
				>
					<History className="w-4 h-4" />
					<span>History</span>
				</Link>
			</nav>
		</header>
	);
}
