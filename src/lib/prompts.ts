import { DEMO_EXPERIENCE_ID } from '$lib/constants';
import type { ExampleKind, ExampleMetadata } from '$lib/examples';
import type { SupportedFramework } from '$lib/frameworks';

export function sveltekitAgentPrompt(example: ExampleMetadata): string {
	if (example.slug === 'elevenlabs-embed') {
		return `Use the Liforma ElevenLabs embed SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Copy \`src/lib/helloByo.ts\` (\`startByoSpeech\` → \`connectElevenLabsAgent\`) into your product — that is the integration.
\`src/routes/+page.svelte\` is demo scaffolding only; \`src/lib/config.ts\` is suggested agent prompt text.

Preserve:
- \`<Experience />\` from \`@liforma/client/svelte\` in presenter mode with \`speechInputMode="off"\`
- \`startByoSpeech(experience, { signedUrl })\` after audio unlock (thin wrapper over \`connectElevenLabsAgent\`)
- signed-URL mint on a server route (never ship ElevenLabs API keys to production browsers)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- your ElevenLabs agent
- production signed-URL backend`;
	}

	if (example.slug === 'openai-realtime-embed') {
		return `Use the Liforma OpenAI Realtime embed SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Copy \`src/lib/helloByo.ts\` (\`startByoSpeech\` → \`connectOpenAiRealtime\`) into your product — that is the integration.
\`src/routes/+page.svelte\` is demo scaffolding only; \`src/lib/config.ts\` is suggested Realtime instructions.

Preserve:
- \`<Experience />\` from \`@liforma/client/svelte\` in presenter mode with \`speechInputMode="off"\`
- \`startByoSpeech(experience, { ephemeralKey, instructions })\` after audio unlock (thin wrapper over \`connectOpenAiRealtime\`)
- ephemeral Realtime client secret minted on a server route (never ship OPENAI_API_KEY to production browsers)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Realtime model / voice / instructions
- production ephemeral-secret backend`;
	}

	if (example.slug === 'deepgram-embed') {
		return `Use the Liforma Deepgram Voice Agent embed SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Copy \`src/lib/helloByo.ts\` (\`startByoSpeech\` → \`connectDeepgramAgent\`) into your product — that is the integration.
\`src/routes/+page.svelte\` is demo scaffolding only; \`src/lib/config.ts\` is suggested agent Settings defaults.

Preserve:
- \`<Experience />\` from \`@liforma/client/svelte\` in presenter mode with \`speechInputMode="off"\`
- \`startByoSpeech(experience, { proxyUrl, agent? })\` after audio unlock (thin wrapper over \`connectDeepgramAgent\`)
- same-origin WebSocket proxy that adds \`Authorization: Token …\` upstream (browsers cannot set WS auth headers)
- Vite plugin attaching \`shared/deepgram-agent-proxy.mjs\` (SvelteKit HTTP handlers cannot upgrade WebSockets)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Deepgram agent Settings
- production WebSocket proxy backend`;
	}

	if (example.slug === 'livekit-embed') {
		return `Use the Liforma LiveKit embed SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Copy \`src/lib/helloByo.ts\` (\`startByoSpeech\` → \`connectLiveKitAgent\`) into your product — that is the integration.
\`src/routes/+page.svelte\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/svelte\` in presenter mode with \`speechInputMode="off"\`
- \`startByoSpeech(experience, { url, token })\` after audio unlock (thin wrapper over \`connectLiveKitAgent\`)
- participant token minted on a server route (never ship LIVEKIT_API_SECRET to browsers)
- peer dependency \`livekit-client\`
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- LiveKit room / agent identity filter
- production token-mint backend`;
	}

	if (example.slug === 'gemini-live-embed') {
		return `Use the Liforma Gemini Live embed SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Copy \`src/lib/helloByo.ts\` (\`startByoSpeech\` → \`connectGeminiLive\`) into your product — that is the integration.
\`src/routes/+page.svelte\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/svelte\` in presenter mode with \`speechInputMode="off"\`
- \`startByoSpeech(experience, { proxyUrl })\` after audio unlock (thin wrapper over \`connectGeminiLive\`)
- same-origin WebSocket proxy that terminates Gemini Live with server-side API key + setup inject
- Vite plugin attaching \`shared/gemini-live-proxy.mjs\` (SvelteKit HTTP handlers cannot upgrade WebSockets)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Gemini Live model / system instruction
- production WebSocket proxy backend`;
	}


	if (example.kind === 'widget') {
		return `Use the Liforma ${example.title} SvelteKit example as source material.

Source repo folder: ${example.githubPath}/sveltekit

Preserve:
- \`<ExperienceWidget />\` from \`@liforma/client/svelte\`
- \`position="bottom-right"\` (self-positioned FAB — no host corner CSS required)
- \`prefetch="idle"\` for one-gesture expand
- thumb plates from the public preview API (optional \`galleryThumb\` override)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- surrounding marketing page copy`;
	}

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

Copy \`helloByo.js\` (\`startByoSpeech\`) — thin wrapper over \`bridge.js\` / \`connectElevenLabsAgent\`.
\`app.js\` is demo scaffolding only. Prefer \`@liforma/client/elevenlabs\` in bundled apps.

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- ElevenLabs → Liforma bridge (mute ElevenLabs speaker; pipe PCM into createUtterance)
- local signed-URL proxy pattern (never ship ElevenLabs API keys to production browsers)

Adapt:
- branding
- experience id
- your ElevenLabs agent
- production signed-URL backend`;
	}

	if (example.slug === 'openai-realtime-embed') {
		return `Use the Liforma OpenAI Realtime embed example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Copy \`helloByo.js\` (\`startByoSpeech\`) — thin wrapper over \`bridge.js\` / \`connectOpenAiRealtime\`.
\`app.js\` is demo scaffolding only. Prefer \`@liforma/client/openai\` in bundled apps.

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- OpenAI Realtime → Liforma bridge (pipe PCM + transcript into createUtterance)
- local ephemeral client-secret mint pattern (never ship OPENAI_API_KEY to production browsers)

Adapt:
- branding
- experience id
- Realtime model / voice / instructions
- production ephemeral-secret backend`;
	}

	if (example.slug === 'deepgram-embed') {
		return `Use the Liforma Deepgram Voice Agent embed example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Copy \`helloByo.js\` (\`startByoSpeech\`) — thin wrapper over \`bridge.js\` / \`connectDeepgramAgent\`.
\`app.js\` is demo scaffolding only. Prefer \`@liforma/client/deepgram\` in bundled apps.

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- Deepgram Voice Agent → Liforma bridge (pipe PCM + transcript into createUtterance)
- same-origin WebSocket proxy (\`server.mjs\` + \`shared/deepgram-agent-proxy.mjs\`) — never ship Deepgram API keys to production browsers as WS Authorization

Adapt:
- branding
- experience id
- Deepgram agent Settings
- production WebSocket proxy backend`;
	}

	if (example.slug === 'livekit-embed') {
		return `Use the Liforma LiveKit embed example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Copy \`helloByo.js\` (\`startByoSpeech\`) — thin wrapper over \`bridge.js\` / \`connectLiveKitAgent\`.
\`app.js\` is demo scaffolding only. Prefer \`@liforma/client/livekit\` in bundled apps.

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- LiveKit → Liforma bridge (pipe remote MediaStreamTrack into createUtterance + transcript)
- local participant-token mint pattern (never ship LIVEKIT_API_SECRET to production browsers)

Adapt:
- branding
- experience id
- LiveKit room / agent
- production token-mint backend`;
	}

	if (example.slug === 'gemini-live-embed') {
		return `Use the Liforma Gemini Live embed example as source material to build a vanilla HTML app.

Source repo folder: ${example.githubPath}/vanilla

Copy \`helloByo.js\` (\`startByoSpeech\`) — thin wrapper over \`bridge.js\` / \`connectGeminiLive\`.
\`app.js\` is demo scaffolding only. Prefer \`@liforma/client/google\` in bundled apps.

Preserve:
- CDN script: https://cdn.liforma.ai/sdk/v2/client.js
- \`Experience.startSession\` in presenter mode with \`speechInputMode: 'off'\`
- Gemini Live → Liforma bridge (pipe PCM + transcript into createUtterance)
- same-origin WebSocket proxy (\`server.mjs\` + \`shared/gemini-live-proxy.mjs\`) — never ship Google API keys to production browsers

Adapt:
- branding
- experience id
- Gemini Live model / system instruction
- production WebSocket proxy backend`;
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
- \`<liforma-experience-widget>\` corner launcher with \`position="bottom-right"\`
- \`prefetch="idle"\` for one-gesture expand
- light collapsed mount (preview API thumb plates until click)
- copy-paste friendly structure (index.html + styles.css) — no host corner CSS required for anchored position

Adapt:
- branding
- experience id
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

export function reactAgentPrompt(
	example: ExampleMetadata,
	framework: 'nextjs' | 'react-vite'
): string {
	const folder = `${example.githubPath}/${framework}`;
	const frameworkLabel = framework === 'nextjs' ? 'Next.js App Router' : 'React (Vite)';
	const nextNote =
		framework === 'nextjs'
			? `- \`'use client'\` on the Experience mount component
- import from \`@liforma/client/react\` (not \`/next\` — that export is the session-route helper)`
			: `- import from \`@liforma/client/react\``;

	if (example.slug === 'elevenlabs-embed') {
		return `Use the Liforma ElevenLabs embed ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Copy \`helloByo.ts\` (\`startByoSpeech\` → \`connectElevenLabsAgent\`) into your product — that is the integration.
\`DemoApp.tsx\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`startByoSpeech(experience, { signedUrl })\` after audio unlock (thin wrapper over \`connectElevenLabsAgent\`)
- signed-URL mint on a server route / Vite middleware (never ship ElevenLabs API keys to production browsers)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- your ElevenLabs agent
- production signed-URL backend`;
	}

	if (example.slug === 'openai-realtime-embed') {
		return `Use the Liforma OpenAI Realtime embed ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Copy \`helloByo.ts\` (\`startByoSpeech\` → \`connectOpenAiRealtime\`) into your product — that is the integration.
\`DemoApp.tsx\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`startByoSpeech(experience, { ephemeralKey, instructions })\` after audio unlock (thin wrapper over \`connectOpenAiRealtime\`)
- ephemeral Realtime client secret minted on a server route / Vite middleware (never ship OPENAI_API_KEY to browsers)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Realtime model / voice / instructions
- production ephemeral-secret backend`;
	}

	if (example.slug === 'deepgram-embed') {
		const proxyNote =
			framework === 'nextjs'
				? `- custom \`server.mjs\` wrapping Next + \`attachDeepgramAgentProxy\` (App Router cannot upgrade WebSockets)`
				: `- Vite plugin attaching \`shared/deepgram-agent-proxy.mjs\` via \`configureServer\` / \`configurePreviewServer\``;
		return `Use the Liforma Deepgram Voice Agent embed ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Copy \`helloByo.ts\` (\`startByoSpeech\` → \`connectDeepgramAgent\`) into your product — that is the integration.
\`DemoApp.tsx\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`startByoSpeech(experience, { proxyUrl, agent? })\` after audio unlock (thin wrapper over \`connectDeepgramAgent\`)
- same-origin WebSocket proxy that adds \`Authorization: Token …\` upstream (browsers cannot set WS auth headers)
${proxyNote}
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Deepgram agent Settings
- production WebSocket proxy backend`;
	}

	if (example.slug === 'livekit-embed') {
		return `Use the Liforma LiveKit embed ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Copy \`helloByo.ts\` (\`startByoSpeech\` → \`connectLiveKitAgent\`) into your product — that is the integration.
\`DemoApp.tsx\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`startByoSpeech(experience, { url, token })\` after audio unlock (thin wrapper over \`connectLiveKitAgent\`)
- participant token minted on a server route / Vite middleware (never ship LIVEKIT_API_SECRET to browsers)
- peer dependency \`livekit-client\`
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- LiveKit room / agent
- production token-mint backend`;
	}

	if (example.slug === 'gemini-live-embed') {
		const proxyNote =
			framework === 'nextjs'
				? `- custom \`server.mjs\` wrapping Next + \`attachGeminiLiveProxy\` (App Router cannot upgrade WebSockets)`
				: `- Vite plugin attaching \`shared/gemini-live-proxy.mjs\` via \`configureServer\` / \`configurePreviewServer\``;
		return `Use the Liforma Gemini Live embed ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Copy \`helloByo.ts\` (\`startByoSpeech\` → \`connectGeminiLive\`) into your product — that is the integration.
\`DemoApp.tsx\` is demo scaffolding only.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`startByoSpeech(experience, { proxyUrl })\` after audio unlock (thin wrapper over \`connectGeminiLive\`)
- same-origin WebSocket proxy that terminates Gemini Live with server-side API key + setup inject
${proxyNote}
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- Gemini Live model / system instruction
- production WebSocket proxy backend`;
	}


	if (example.kind === 'widget') {
		return `Use the Liforma ${example.title} ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Start from \`Demo.tsx\` — that is the integration.

Preserve:
- \`<ExperienceWidget />\` from \`@liforma/client/react\`
${nextNote}
- \`position="bottom-right"\` (self-positioned FAB — no host corner CSS required)
- \`prefetch="idle"\` for one-gesture expand
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- surrounding marketing page copy`;
	}

	if (example.kind === 'embed') {
		return `Use the Liforma ${example.title} ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Preserve:
- \`<Experience experienceId="…" />\` from \`@liforma/client/react\`
${nextNote}
- one public experience id (no lesson catalogue, no sessionEndpoint)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- experience id
- surrounding page chrome`;
	}

	if (example.kind === 'lessons') {
		return `Use the Liforma ${example.title} ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Start from \`TutorApp.tsx\` — lesson selection + Experience mount rules.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` with \`language="es"\`
${nextNote}
- close-before-switch: do not change \`experienceId\` while a session is mounted; unmount first
- mount Experience only when the session is active
- per-lesson \`experienceId\` in lesson data (not environment variables)
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- lesson content
- experience IDs per lesson
- surrounding product UI`;
	}

	if (example.slug === 'speak-playground') {
		return `Use the Liforma Speak playground ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Start from \`SpeakWorkspace.tsx\` / \`SpeakApp.tsx\` — that is the speak() integration.

Preserve:
- \`<Experience />\` from \`@liforma/client/react\` in presenter mode with \`speechInputMode="off"\`
${nextNote}
- \`experience.speech.speak({ text, queue: 'append' | 'replace-active' })\`
- Enqueue = \`append\`; Interrupt = \`replace-active\`; \`AbortError\` means interrupted
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- host UI
- experience id`;
	}

	return `Use the Liforma ${example.title} ${frameworkLabel} example as source material.

Source repo folder: ${folder}

Preserve:
- React \`Experience\` / speak API usage shown in the example
${nextNote}
- TypeScript and normal CSS (no Tailwind)

Adapt:
- branding
- host UI / turns
- experience id`;
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
- preview API thumb + expand-on-click overlay (\`position="bottom-right"\`)`
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
			'Thumb plates from the public preview API (optional galleryThumb override).'
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

	if (kind === 'embed' && (frameworkSlug === 'nextjs' || frameworkSlug === 'react-vite')) {
		const nextClient = frameworkSlug === 'nextjs' ? `'use client';\n\n` : '';
		return `${nextClient}import { Experience } from '@liforma/client/react';

export function Demo() {
  return <Experience experienceId="${DEMO_EXPERIENCE_ID}" />;
}`;
	}

	if (kind === 'embed') {
		return `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<liforma-experience experience-id="${DEMO_EXPERIENCE_ID}"></liforma-experience>`;
	}

	if (kind === 'widget' && frameworkSlug === 'sveltekit') {
		return `<script>
  import { ExperienceWidget } from '@liforma/client/svelte';
</script>

<ExperienceWidget
  experienceId="${DEMO_EXPERIENCE_ID}"
  alt="Talk to our barista"
  position="bottom-right"
  offset={16}
  prefetch="idle"
/>`;
	}

	if (kind === 'widget' && (frameworkSlug === 'nextjs' || frameworkSlug === 'react-vite')) {
		const nextClient = frameworkSlug === 'nextjs' ? `'use client';\n\n` : '';
		return `${nextClient}import { ExperienceWidget } from '@liforma/client/react';

export function Demo() {
  return (
    <ExperienceWidget
      experienceId="${DEMO_EXPERIENCE_ID}"
      alt="Talk to our barista"
      position="bottom-right"
      offset={16}
      prefetch="idle"
    />
  );
}`;
	}

	if (kind === 'widget') {
		return `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<liforma-experience-widget
  experience-id="${DEMO_EXPERIENCE_ID}"
  alt="Talk to our barista"
  position="bottom-right"
  offset="16"
  prefetch="idle"
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
