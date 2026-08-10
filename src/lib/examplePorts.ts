/** Gallery site (repo root `npm run dev`). */
export const GALLERY_PORT = 4000;

/** Canonical local port per example slug (vanilla and SvelteKit share the same port). */
export const EXAMPLE_PORTS: Record<string, number> = {
	'basic-embed': 4001,
	'experience-widget': 4002,
	'spanish-tutor': 4003,
	'guided-practice': 4004,
	'speak-playground': 4005,
	'elevenlabs-embed': 4006
};

export function getExamplePort(slug: string): number | undefined {
	return EXAMPLE_PORTS[slug];
}

export function exampleLocalUrl(slug: string): string | undefined {
	const port = getExamplePort(slug);
	return port ? `http://localhost:${port}` : undefined;
}
