import DemoApp from './DemoApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>LiveKit embed</h1>
						<p className="lede">
							React (Vite) coffee-barista embed with LiveKit as bring-your-own voice.
							Integration: <code>@liforma/client/livekit</code>.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit"
						target="_blank"
						rel="noopener noreferrer"
					>
						BYO voice docs
					</a>
				</div>
			</header>
			<main className="app-main">
				<DemoApp />
			</main>
		</div>
	);
}
