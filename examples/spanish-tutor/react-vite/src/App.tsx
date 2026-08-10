import TutorApp from './TutorApp';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Spanish Tutor</h1>
					</div>
					<a
						className="docs-link"
						href="https://examples.liforma.ai/examples/spanish-tutor"
						target="_blank"
						rel="noopener noreferrer"
					>
						Example docs
					</a>
				</div>
			</header>
			<main className="app-main">
				<TutorApp />
			</main>
		</div>
	);
}
