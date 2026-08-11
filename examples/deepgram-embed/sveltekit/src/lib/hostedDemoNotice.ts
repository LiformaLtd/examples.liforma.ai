/** Hosted *.examples.liforma.ai cannot run the Deepgram WS proxy. */

export function isHostedExamplesDemo(): boolean {
	if (typeof window === 'undefined') return false;
	const host = window.location.hostname.toLowerCase();
	if (host === 'localhost' || host === '127.0.0.1') return false;
	return (
		host.endsWith('.examples.liforma.ai') ||
		host === 'examples.liforma.ai' ||
		host.endsWith('.vercel.app')
	);
}

export const HOSTED_WS_PROXY_NOTICE = {
	title: 'Run Deepgram locally',
	body: 'This demo needs a same-origin WebSocket proxy for Deepgram Voice Agent, which is not available on the hosted Vercel deploy. Clone the example and run it on your machine.',
	cloneHint:
		'git clone https://github.com/LiformaLtd/examples.liforma.ai.git && cd examples.liforma.ai/examples/deepgram-embed && ./start  # → http://localhost:4008',
	githubUrl:
		'https://github.com/LiformaLtd/examples.liforma.ai/tree/main/examples/deepgram-embed'
} as const;
