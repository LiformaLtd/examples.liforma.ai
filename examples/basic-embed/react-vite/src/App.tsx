import { Demo } from './Demo';

export default function App() {
	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="header-inner">
					<div>
						<p className="eyebrow">Liforma example</p>
						<h1>Basic embed</h1>
					</div>
					<a
						className="docs-link"
						href="https://examples.liforma.ai/examples/basic-embed"
						target="_blank"
						rel="noopener noreferrer"
					>
						Example docs
					</a>
				</div>
			</header>
			<main className="app-main">
				<Demo />
			</main>
		</div>
	);
}
