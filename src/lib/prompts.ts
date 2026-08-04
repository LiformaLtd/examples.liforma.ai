import type { SupportedFramework } from '$lib/frameworks';

export function sveltekitAgentPrompt(exampleTitle: string, githubPath: string): string {
	return `Use the Liforma ${exampleTitle} example as source material to build a SvelteKit app.

Source repo folder: ${githubPath}/sveltekit

Preserve:
- Liforma experience embed via CDN web component (\`<liforma-experience experience-id="..." />\`)
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

export function vanillaAgentPrompt(exampleTitle: string, githubPath: string): string {
	return `Use the Liforma ${exampleTitle} example as source material to build a vanilla HTML app.

Source repo folder: ${githubPath}/vanilla

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
	exampleTitle: string,
	githubPath: string,
	framework: SupportedFramework
): string {
	return `Port the Liforma ${exampleTitle} example to ${framework}.

Start from the SvelteKit and vanilla references in ${githubPath}.

Preserve:
- \`<liforma-experience>\` web component integration
- lesson-based UX and close-before-switch flow
- learning goal and session status UI

Use framework-native patterns. Do not depend on unpublished npm packages.`;
}
