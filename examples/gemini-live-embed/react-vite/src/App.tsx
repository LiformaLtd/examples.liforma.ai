import DemoApp from './DemoApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Gemini Live embed</h1>
						<p className="lede">
							React (Vite) coffee-barista embed with Gemini Live as speech-to-speech.
							Integration: <code>@liforma/client/google</code>.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/gemini"
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
