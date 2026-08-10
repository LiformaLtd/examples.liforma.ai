import DemoApp from './DemoApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>OpenAI Realtime embed</h1>
						<p className="lede">
							React (Vite) coffee-barista embed with OpenAI Realtime as speech-to-speech.
							Integration: <code>@liforma/client/openai</code>.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai"
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
