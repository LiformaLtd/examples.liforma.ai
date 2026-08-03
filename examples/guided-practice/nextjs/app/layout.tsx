import type { ReactNode } from 'react';

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
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
					<main className="app-main">{children}</main>
				</div>
			</body>
		</html>
	);
}
