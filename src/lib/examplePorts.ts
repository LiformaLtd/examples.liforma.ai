/** Gallery site (repo root `npm run dev`). */
export const GALLERY_PORT = 4000;

/** Canonical local port per example slug (vanilla and SvelteKit share the same port). */
export const EXAMPLE_PORTS: Record<string, number> = {
	'spanish-tutor': 4001,
	'guided-practice': 4002
};

export function getExamplePort(slug: string): number | undefined {
	return EXAMPLE_PORTS[slug];
}

export function exampleLocalUrl(slug: string): string | undefined {
	const port = getExamplePort(slug);
	return port ? `http://localhost:${port}` : undefined;
}
