import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Image, Eye, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Hero Section */}
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-green-500/10" />
				<div className="relative max-w-4xl mx-auto">
					<div className="flex items-center justify-center gap-4 mb-6">
						<Phone className="w-16 h-16 text-cyan-400" />
					</div>
					<h1 className="text-5xl md:text-7xl font-black text-white mb-4">
						<span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
							Telephone AI
						</span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
						Watch AI models play telephone - each one transforms the message in
						unexpected ways
					</p>
					<Link
						to="/play"
						className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-cyan-500/30 text-lg"
					>
						Start Playing
						<ArrowRight className="w-5 h-5" />
					</Link>
				</div>
			</section>

			{/* How It Works */}
			<section className="py-16 px-6 max-w-5xl mx-auto">
				<h2 className="text-3xl font-bold text-white text-center mb-12">
					How It Works
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="text-center">
						<div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Sparkles className="w-8 h-8 text-purple-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							1. Enter a Prompt
						</h3>
						<p className="text-gray-400">
							Start with any text prompt you can imagine
						</p>
					</div>
					<div className="text-center">
						<div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Image className="w-8 h-8 text-cyan-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							2. Build Your Chain
						</h3>
						<p className="text-gray-400">
							Select image and vision models to pass the message through
						</p>
					</div>
					<div className="text-center">
						<div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Eye className="w-8 h-8 text-green-400" />
						</div>
						<h3 className="text-xl font-semibold text-white mb-2">
							3. Watch It Transform
						</h3>
						<p className="text-gray-400">
							See how each AI interprets and transforms the message
						</p>
					</div>
				</div>
			</section>

			{/* Model Types */}
			<section className="py-16 px-6 bg-slate-800/30">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-3xl font-bold text-white text-center mb-12">
						Mix and Match Models
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/30">
							<div className="flex items-center gap-3 mb-4">
								<Image className="w-8 h-8 text-purple-400" />
								<h3 className="text-xl font-semibold text-white">
									Image Generation
								</h3>
							</div>
							<p className="text-gray-400 mb-4">
								Turn text descriptions into stunning images with models like
								FLUX, Imagen, Seedream, and Stable Diffusion.
							</p>
							<div className="flex flex-wrap gap-2">
								{[
									"FLUX 1.1 Pro",
									"Imagen 4",
									"Seedream 4.5",
									"Nano Banana",
								].map((name) => (
									<span
										key={name}
										className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm"
									>
										{name}
									</span>
								))}
							</div>
						</div>
						<div className="bg-slate-800/50 rounded-xl p-6 border border-green-500/30">
							<div className="flex items-center gap-3 mb-4">
								<Eye className="w-8 h-8 text-green-400" />
								<h3 className="text-xl font-semibold text-white">
									Vision Analysis
								</h3>
							</div>
							<p className="text-gray-400 mb-4">
								Have AI describe what it sees in images with models like GPT-4o,
								Gemini, Claude, and more.
							</p>
							<div className="flex flex-wrap gap-2">
								{["GPT-4o", "Gemini 2.5", "Claude 4", "Qwen VL"].map((name) => (
									<span
										key={name}
										className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm"
									>
										{name}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 px-6 text-center">
				<h2 className="text-3xl font-bold text-white mb-4">
					Ready to Play Telephone?
				</h2>
				<p className="text-gray-400 mb-8 max-w-xl mx-auto">
					Create your first AI telephone chain and watch the message transform
					through multiple AI interpretations.
				</p>
				<Link
					to="/play"
					className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg text-lg"
				>
					Start a New Game
					<ArrowRight className="w-5 h-5" />
				</Link>
			</section>
		</div>
	);
}
