import DemoApp from './DemoApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Deepgram Voice Agent embed</h1>
						<p className="lede">
							React (Vite) coffee-barista embed with Deepgram Voice Agent as speech-to-speech.
							Integration: <code>@liforma/client/deepgram</code>.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram"
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
