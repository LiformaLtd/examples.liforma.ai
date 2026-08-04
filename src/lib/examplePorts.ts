/** Gallery site (repo root `npm run dev`). */
export const GALLERY_PORT = 4000;

/** Canonical local port per example slug (vanilla and SvelteKit share the same port). */
export const EXAMPLE_PORTS: Record<string, number> = {
	'basic-embed': 4001,
	'spanish-tutor': 4002,
	'guided-practice': 4003,
	'speak-playground': 4004
};

export function getExamplePort(slug: string): number | undefined {
	return EXAMPLE_PORTS[slug];
}

export function exampleLocalUrl(slug: string): string | undefined {
	const port = getExamplePort(slug);
	return port ? `http://localhost:${port}` : undefined;
}
