export const GITHUB_REPO = 'https://github.com/charlesatliforma/examples.liforma.ai';

export const DEMO_EXPERIENCE_ID = 'exp_01EXAMPLES_COFFEE_BARISTA';

export const externalLinks = {
	www: 'https://www.liforma.ai',
	app: 'https://app.liforma.ai',
	docs: 'https://docs.liforma.ai',
	docsQuickStart: 'https://docs.liforma.ai/getting-started/quick-start',
	docsEmbed: 'https://docs.liforma.ai/guides/embed',
	docsWebComponent: 'https://docs.liforma.ai/sdk-reference/web-component',
	meetExperience: 'https://www.liforma.ai/meet/demo-spanish-cafe'
} as const;

export function githubTreePath(path: string): string {
	return `${GITHUB_REPO}/tree/main/${path}`;
}

export function githubRawPath(path: string): string {
	return `${GITHUB_REPO}/blob/main/${path}`;
}
