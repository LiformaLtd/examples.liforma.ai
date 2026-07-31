import type { SupportedFramework } from '$lib/frameworks';

export type ExampleMetadata = {
	slug: string;
	title: string;
	description: string;
	category: string;
	frameworks: SupportedFramework[];
	features: string[];
	githubPath: string;
	/** Local dev port (shared by vanilla and SvelteKit for this example). */
	localPort: number;
	/** Hosted runnable app (full lesson UI), when deployed. */
	liveAppUrl?: string;
	/** Hosted Meet page for the underlying avatar — not the full example app. */
	meetExperienceUrl?: string;
	specPath: string;
};

export const examples: ExampleMetadata[] = [
	{
		slug: 'spanish-tutor',
		title: 'Spanish Tutor',
		description:
			'Practise Spanish with an animated AI tutor. Lesson-based app pattern with close-before-switch UX.',
		category: 'Education',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Avatar Experience', 'Microphone', 'Transcript', 'Learning objective', 'Lessons'],
		githubPath: 'examples/spanish-tutor',
		localPort: 4001,
		liveAppUrl: 'https://spanish-tutor.examples.liforma.ai/',
		meetExperienceUrl: 'https://www.liforma.ai/meet/demo-spanish-cafe',
		specPath: 'examples/spanish-tutor/spec.md'
	},
	{
		slug: 'guided-practice',
		title: 'Guided practice',
		description:
			'Marvely-style scripted turns: presenter mode, speak() for tutor lines, manual Start/Stop listening, and host-side feedback.',
		category: 'Education',
		frameworks: ['sveltekit', 'vanilla'],
		features: [
			'Avatar Experience',
			'speak()',
			'Manual listening',
			'Presenter mode',
			'Host feedback'
		],
		githubPath: 'examples/guided-practice',
		localPort: 4002,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/guided-practice/spec.md'
	},
	{
		slug: 'speak-playground',
		title: 'Speak playground',
		description:
			'Type text and press Enter — the avatar speaks it. Toggle enqueue vs interrupt on speak().',
		category: 'Integration',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Avatar Experience', 'speak()', 'Enqueue vs interrupt', 'Presenter mode'],
		githubPath: 'examples/speak-playground',
		localPort: 4003,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/speak-playground/spec.md'
	}
];

export function getExample(slug: string): ExampleMetadata | undefined {
	return examples.find((example) => example.slug === slug);
}

export function implementationSourcePath(
	example: ExampleMetadata,
	framework: SupportedFramework
): string {
	return `${example.githubPath}/${framework}`;
}

export function isImplementationAvailable(
	example: ExampleMetadata,
	frameworkSlug: string
): boolean {
	return example.frameworks.includes(frameworkSlug as SupportedFramework);
}
