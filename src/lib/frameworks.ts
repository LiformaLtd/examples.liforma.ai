export const supportedFrameworks = [
	'sveltekit',
	'nextjs',
	'react-vite',
	'vanilla',
	'vue',
	'nuxt',
	'astro',
	'angular'
] as const;

export type SupportedFramework = (typeof supportedFrameworks)[number];

export type FrameworkMetadata = {
	slug: SupportedFramework;
	title: string;
	description: string;
	priority: 1 | 2 | 3 | 4 | 5 | 6 | 7;
	implementationPhase: 1 | 2 | 3 | 4;
	available: boolean;
};

export const frameworks: FrameworkMetadata[] = [
	{
		slug: 'sveltekit',
		title: 'SvelteKit',
		description: '`<Experience />` from `@liforma/client/svelte` — full lesson UI with TypeScript and Svelte 5.',
		priority: 1,
		implementationPhase: 1,
		available: true
	},
	{
		slug: 'vanilla',
		title: 'Vanilla HTML',
		description: 'CDN script + `<liforma-experience>` — copy-paste friendly for any site.',
		priority: 2,
		implementationPhase: 1,
		available: true
	},
	{
		slug: 'nextjs',
		title: 'Next.js',
		description: '`@liforma/client/react` plus optional App Router session route helper.',
		priority: 3,
		implementationPhase: 2,
		available: true
	},
	{
		slug: 'react-vite',
		title: 'React (Vite)',
		description: 'Client-side React with `@liforma/client/react` — no Next.js server.',
		priority: 4,
		implementationPhase: 2,
		available: true
	},
	{
		slug: 'vue',
		title: 'Vue',
		description: 'Second major ecosystem with broad international adoption.',
		priority: 5,
		implementationPhase: 3,
		available: false
	},
	{
		slug: 'nuxt',
		title: 'Nuxt',
		description: 'Vue production framework for full-stack apps.',
		priority: 5,
		implementationPhase: 3,
		available: false
	},
	{
		slug: 'astro',
		title: 'Astro',
		description: 'Content sites, marketing pages, and docs where avatars embed well.',
		priority: 6,
		implementationPhase: 3,
		available: false
	},
	{
		slug: 'angular',
		title: 'Angular',
		description: 'Enterprise coverage for large structured codebases.',
		priority: 7,
		implementationPhase: 4,
		available: false
	}
];

export function getFramework(slug: string): FrameworkMetadata | undefined {
	return frameworks.find((framework) => framework.slug === slug);
}

export function getAvailableFrameworks(): FrameworkMetadata[] {
	return frameworks.filter((framework) => framework.available);
}

export function isSupportedFramework(slug: string): slug is SupportedFramework {
	return (supportedFrameworks as readonly string[]).includes(slug);
}
