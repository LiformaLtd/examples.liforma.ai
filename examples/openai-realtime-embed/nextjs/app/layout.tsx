import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
	title: 'OpenAI Realtime embed — Liforma Example',
	description:
		'Coffee-barista embed with OpenAI Realtime as speech-to-speech via @liforma/client/openai.'
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
								<h1>OpenAI Realtime embed</h1>
								<p className="lede">
									Next.js coffee-barista embed with OpenAI Realtime as speech-to-speech.
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
					<main className="app-main">{children}</main>
				</div>
			</body>
		</html>
	);
}
