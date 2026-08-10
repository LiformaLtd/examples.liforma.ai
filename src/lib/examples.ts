import type { SupportedFramework } from '$lib/frameworks';

/** Drives gallery copy and framework detail pages. */
export type ExampleKind = 'embed' | 'widget' | 'lessons' | 'presenter';

export type ExampleMetadata = {
	slug: string;
	title: string;
	description: string;
	category: string;
	kind: ExampleKind;
	frameworks: SupportedFramework[];
	features: string[];
	githubPath: string;
	/** Local dev port (shared by vanilla and SvelteKit for this example). */
	localPort: number;
	/** Hosted runnable app (full lesson UI), when deployed. */
	liveAppUrl?: string;
	/** Hosted Meet page for the underlying experience — not the full example app. */
	meetExperienceUrl?: string;
	specPath: string;
};

export const examples: ExampleMetadata[] = [
	{
		slug: 'basic-embed',
		title: 'Basic embed',
		description:
			'Hello-world experience embed: one experience id and one Experience component. No custom speak or listen UI.',
		category: 'Getting started',
		kind: 'embed',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Experience', 'Public session mint'],
		githubPath: 'examples/basic-embed',
		localPort: 4001,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/basic-embed/spec.md'
	},
	{
		slug: 'experience-widget',
		title: 'Experience widget',
		description:
			'Corner launcher: collapsed thumb until click, then an in-page overlay conversation. Light until expand.',
		category: 'Getting started',
		kind: 'widget',
		frameworks: ['vanilla'],
		features: ['ExperienceWidget', 'Public session mint', 'Overlay expand'],
		githubPath: 'examples/experience-widget',
		localPort: 4002,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/experience-widget/spec.md'
	},
	{
		slug: 'spanish-tutor',
		title: 'Spanish Tutor',
		description:
			'Practise Spanish with an animated AI tutor. Lesson-based app pattern with close-before-switch UX.',
		category: 'Education',
		kind: 'lessons',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Experience', 'Microphone', 'Transcript', 'Learning objective', 'Lessons'],
		githubPath: 'examples/spanish-tutor',
		localPort: 4003,
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
		kind: 'presenter',
		frameworks: ['sveltekit', 'vanilla', 'nextjs', 'react-vite'],
		features: [
			'Experience',
			'speak()',
			'Manual listening',
			'Presenter mode',
			'Host feedback'
		],
		githubPath: 'examples/guided-practice',
		localPort: 4004,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/guided-practice/spec.md'
	},
	{
		slug: 'speak-playground',
		title: 'Speak playground',
		description:
			'Type text and press Enter — the experience speaks it. Toggle enqueue vs interrupt on speak().',
		category: 'Integration',
		kind: 'presenter',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Experience', 'speak()', 'Enqueue vs interrupt', 'Presenter mode'],
		githubPath: 'examples/speak-playground',
		localPort: 4005,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/speak-playground/spec.md'
	},
	{
		slug: 'elevenlabs-embed',
		title: 'ElevenLabs embed',
		description:
			'Basic coffee-barista embed with ElevenLabs Agents as speech-to-speech — pipe agent PCM into createUtterance.',
		category: 'Integration',
		kind: 'embed',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Experience', 'ElevenLabs Agents', 'createUtterance', 'BYO voice'],
		githubPath: 'examples/elevenlabs-embed',
		localPort: 4006,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/elevenlabs-embed/spec.md'
	},
	{
		slug: 'openai-realtime-embed',
		title: 'OpenAI Realtime embed',
		description:
			'Basic coffee-barista embed with OpenAI Realtime as speech-to-speech — pipe PCM + transcript into createUtterance.',
		category: 'Integration',
		kind: 'embed',
		frameworks: ['sveltekit', 'vanilla'],
		features: ['Experience', 'OpenAI Realtime', 'createUtterance', 'BYO voice', 'transcript'],
		githubPath: 'examples/openai-realtime-embed',
		localPort: 4007,
		meetExperienceUrl: 'https://www.liforma.ai/meet',
		specPath: 'examples/openai-realtime-embed/spec.md'
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
