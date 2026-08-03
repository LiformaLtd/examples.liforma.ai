import { PracticeWorkspace } from './PracticeWorkspace';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Guided practice</h1>
						<p className="lede">
							Presenter mode with scripted <code>speak()</code> turns and Start → Stop → Next
							recording control.
						</p>
					</div>
					<a
						className="docs-link"
						href="https://examples.liforma.ai/examples/guided-practice"
						target="_blank"
						rel="noopener noreferrer"
					>
						Example docs
					</a>
				</div>
			</header>
			<main className="app-main">
				<PracticeWorkspace />
			</main>
		</div>
	);
}
