import { DEMO_EXPERIENCE_ID } from '$lib/constants';
import type { ExampleKind, ExampleMetadata } from '$lib/examples';
import type { SupportedFramework } from '$lib/frameworks';

export function sveltekitAgentPrompt(example: ExampleMetadata): string {
	if (example.kind === 'embed') {
		return `Use the Liforma ${example.title} example as source material to build a SvelteKit app.

Source repo folder: ${example.githubPath}/sveltekit

Preserve:
- \`<Experience experienceId="…" />\` from \`@liforma/client/svelte\`
- one public experience id (no lesson catalogue)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- surrounding page chrome`;
	}

	if (example.kind === 'presenter') {
		return `Use the Liforma ${example.title} example as source material to build a SvelteKit app.

Source repo folder: ${example.githubPath}/sveltekit

Preserve:
- \`Experience\` from \`@liforma/client/svelte\` (or JS \`Experience.startSession\` + \`attach\`)
- presenter / speak API usage shown in the example
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- scripted lines / host UI
- experience id
- surrounding product UI`;
	}

	return `Use the Liforma ${example.title} example as source material to build a SvelteKit app.

Source repo folder: ${example.githubPath}/sveltekit

Preserve:
- Liforma experience embed via \`<Experience />\` from \`@liforma/client/svelte\`
- microphone permission guidance
- lesson selection with close-before-switch (no mid-session lesson change)
- learning goal card and session status
- transcript / session notes panel
- responsive layout
- per-lesson \`experienceId\` in lesson data (not environment variables)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- lesson content
- experience IDs per lesson
- surrounding product UI`;
}

export function vanillaAgentPrompt(example: ExampleMetadata): string {
	if (example.slug === 'elevenlabs-embed') {
		return `Use the Liforma ElevenLabs embed example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`@elevenlabs/client\` Conversation (websocket) muted with \`setVolume({ volume: 0 })\`
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- pipe ElevenLabs \`onAudio\` PCM into \`experience.speech.createUtterance\` / \`write\` / \`close\`
- local signed-URL proxy pattern (never ship ElevenLabs API keys to production browsers)
- copy-paste friendly structure (index.html + app.js + server.mjs)

Adapt:
- branding
- experience id
- your ElevenLabs agent
- production signed-URL backend`;
	}

	if (example.kind === 'embed') {
		return `Use the Liforma ${example.title} example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`<liforma-experience experience-id="..." />\` embed
- one public experience id (no lesson catalogue)
- copy-paste friendly structure (index.html + app.js)

Adapt:
- branding
- experience id
- surrounding page layout`;
	}

	if (example.kind === 'widget') {
		return `Use the Liforma ${example.title} example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`<liforma-experience-widget>\` corner launcher with gallery-thumb
- light collapsed mount (images only until click)
- fixed host CSS for corner placement
- copy-paste friendly structure (index.html + styles.css)

Adapt:
- branding
- experience id / gallery thumb URLs
- host page layout`;
	}

	if (example.kind === 'presenter') {
		return `Use the Liforma ${example.title} example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` + \`attach\` / speak API usage shown in the example
- copy-paste friendly structure (index.html + app.js)

Adapt:
- branding
- scripted lines / host UI
- experience id
- surrounding page layout`;
	}

	return `Use the Liforma ${example.title} example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`<liforma-experience experience-id="..." />\` embed
- lesson list with close-before-switch behaviour
- learning goal card, session controls, session notes
- copy-paste friendly structure (index.html + app.js)

Adapt:
- branding
- lesson content
- experience IDs
- surrounding page layout`;
}

export function genericPortPrompt(
	example: ExampleMetadata,
	framework: SupportedFramework
): string {
	const preserve =
		example.kind === 'embed'
			? `- \`<liforma-experience>\` / \`<Experience />\` hello-world embed
- one public experience id`
			: example.kind === 'widget'
				? `- \`<liforma-experience-widget>\` / \`ExperienceWidget\` corner launcher
- gallery thumb + expand-on-click overlay`
				: example.kind === 'presenter'
					? `- presenter / speak API integration shown in the example
- host-owned UI around the embed`
					: `- \`<liforma-experience>\` web component integration
- lesson-based UX and close-before-switch flow
- learning goal and session status UI`;

	return `Port the Liforma ${example.title} example to ${framework}.

Start from the SvelteKit and vanilla references in ${example.githubPath}.

Preserve:
${preserve}

Use framework-native patterns. Do not depend on unpublished npm packages.`;
}

export function exampleOverviewBullets(kind: ExampleKind): string[] {
	if (kind === 'embed') {
		return [
			'Hello-world embed — one experience id and one Experience / web component mount.',
			'Public session mint with conversation-mode player defaults.',
			'No host-side speak, listen, or lesson chrome.'
		];
	}
	if (kind === 'widget') {
		return [
			'Corner ExperienceWidget — collapsed thumb until the user clicks.',
			'In-page overlay expand; session mint and player load on expand by default.',
			'Same gallery-thumb plates as ExperienceThumbnail.'
		];
	}
	if (kind === 'presenter') {
		return [
			'Presenter-mode integration using Experience.speech.speak() (and related APIs).',
			'Host-owned UI for scripted lines, listening control, and/or feedback.',
			'CDN / SDK embed of a public demo experience.'
		];
	}
	return [
		'Lesson-based app pattern — the app chooses a lesson; the lesson chooses the Liforma Experience.',
		'CDN <liforma-experience> / <Experience /> embed for public experiences.',
		'Close-before-switch — users end the session before picking another lesson.',
		'Learning goals, session status, microphone guidance, and session notes UI.'
	];
}

export function frameworkEmbedSnippet(kind: ExampleKind, frameworkSlug: string): string {
	if (kind === 'embed' && frameworkSlug === 'sveltekit') {
		return `<script>
  import { Experience } from '@liforma/client/svelte';
</script>

<Experience experienceId="${DEMO_EXPERIENCE_ID}" />`;
	}

	if (kind === 'embed') {
		return `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<liforma-experience experience-id="${DEMO_EXPERIENCE_ID}"></liforma-experience>`;
	}

	if (kind === 'widget') {
		return `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<liforma-experience-widget
  experience-id="${DEMO_EXPERIENCE_ID}"
  alt="Talk to our barista"
  position="bottom-right"
  offset="16"
></liforma-experience-widget>`;
	}

	if (frameworkSlug === 'sveltekit') {
		return `<script>
  import { Experience } from '@liforma/client/svelte';
</script>

<Experience experienceId={lesson.experienceId} />`;
	}

	return `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<!-- experience-id comes from the selected lesson / session config -->
<liforma-experience experience-id="\${lesson.experienceId}"></liforma-experience>`;
}
