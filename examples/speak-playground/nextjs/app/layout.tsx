import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
	title: 'Speak playground — Liforma Example',
	description:
		'Type text and hear the experience speak it. Toggle enqueue vs interrupt on speech.speak({ queue }).'
};

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
								<h1>Speak playground</h1>
								<p className="lede">
									Type a line and press <strong>Enter</strong> to call{' '}
									<code>speech.speak()</code>. Toggle <strong>Enqueue</strong> vs{' '}
									<strong>Interrupt</strong> and fire several lines quickly to see the difference.
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
					<main className="app-main">{children}</main>
				</div>
			</body>
		</html>
	);
}
