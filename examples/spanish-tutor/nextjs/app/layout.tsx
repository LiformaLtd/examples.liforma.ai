import type { ReactNode } from 'react';

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body>
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
					<main className="app-main">{children}</main>
				</div>
			</body>
		</html>
	);
}
