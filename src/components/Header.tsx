import { Link } from "@tanstack/react-router";
import { Phone, Play, History } from "lucide-react";

export default function Header() {
	return (
		<header className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm text-white border-b border-slate-700">
			<Link to="/" className="flex items-center gap-2">
				<Phone className="w-6 h-6 text-cyan-400" />
				<span className="text-xl font-bold">Telephone AI</span>
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
			</nav>
		</header>
	);
}
