import { SpeakApp } from './SpeakApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Speak playground</h1>
						<p className="lede">
							Type a line and press <strong>Enter</strong> to call <code>speech.speak()</code>. Toggle{' '}
							<strong>Enqueue</strong> vs <strong>Interrupt</strong> and fire several lines quickly to
							see the difference.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://examples.liforma.ai/examples/speak-playground"
						target="_blank"
						rel="noopener noreferrer"
					>
						Example docs
					</a>
				</div>
			</header>
			<main className="app-main">
				<SpeakApp />
			</main>
		</div>
	);
}
