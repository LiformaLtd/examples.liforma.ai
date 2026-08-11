import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
	title: 'LiveKit embed — Liforma Example',
	description:
		'Coffee-barista embed with LiveKit agent audio. Copy helloByo.ts into your product.'
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
								<h1>LiveKit embed</h1>
								<p className="lede">
									Next.js coffee-barista embed with LiveKit as speech-to-speech.
									Integration: <code>@liforma/client/livekit</code>.
								</p>
							</div>
							<a
								className="docs-link"
								href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit"
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
