<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import CopyPrompt from '$lib/components/CopyPrompt.svelte';
	import { DEMO_EXPERIENCE_ID, githubTreePath, externalLinks } from '$lib/constants';
	import { implementationSourcePath, liveDemoLabel } from '$lib/examples';
	import { exampleLocalUrl } from '$lib/examplePorts';
	import {
		frameworkEmbedSnippet,
		genericPortPrompt,
		reactAgentPrompt,
		sveltekitAgentPrompt,
		vanillaAgentPrompt
	} from '$lib/prompts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const example = $derived(data.example);
	const framework = $derived(data.framework);
	const runnable = $derived(data.runnable);
	const hasImplementation = $derived(data.hasImplementation);
	const sourcePath = $derived(implementationSourcePath(example, framework.slug));

	const prompt = $derived.by(() => {
		if (framework.slug === 'sveltekit') {
			return sveltekitAgentPrompt(example);
		}
		if (framework.slug === 'vanilla') {
			return vanillaAgentPrompt(example);
		}
		if (framework.slug === 'nextjs' || framework.slug === 'react-vite') {
			return reactAgentPrompt(example, framework.slug);
		}
		return genericPortPrompt(example, framework.slug);
	});

	const embedSnippet = $derived(frameworkEmbedSnippet(example.kind, framework.slug));
	const embedSnippetLang = $derived(
		framework.slug === 'sveltekit'
			? 'svelte'
			: framework.slug === 'nextjs' || framework.slug === 'react-vite'
				? 'tsx'
				: 'html'
	);

	const runCommands = $derived.by(() =>
		framework.slug === 'sveltekit' ||
		framework.slug === 'nextjs' ||
		framework.slug === 'react-vite'
			? `cd ${sourcePath}
npm install
npm run dev
# http://localhost:${example.localPort}`
			: framework.slug === 'vanilla'
				? `cd ${sourcePath}
npx serve . -l tcp://localhost:${example.localPort}
# http://localhost:${example.localPort}`
				: ''
	);

	const localUrl = $derived(exampleLocalUrl(example.slug));
</script>

<svelte:head>
	<title>{example.title} ({framework.title}) — Liforma Examples</title>
	<meta
		name="description"
		content="{example.title} example for {framework.title}."
	/>
</svelte:head>

<div class="page-shell prose">
	<p class="eyebrow">
		<a href="/examples/{example.slug}">{example.title}</a>
		· {framework.title}
	</p>
	<h1>{example.title} — {framework.title}</h1>

	{#if runnable}
		<span class="badge available">Runnable in repo</span>
	{:else if hasImplementation}
		<span class="badge planned">Coming later</span>
	{:else}
		<span class="badge planned">Not started</span>
	{/if}

	{#if runnable}
		<p>
			{#if example.kind === 'embed'}
				This is the hello-world integration. Fork it, run locally, and drop the same embed into your
				product shell.
			{:else if example.kind === 'widget'}
				This is the site-wide corner widget pattern. Fork it, run locally, and place the same launcher
				on your marketing or support pages.
			{:else if example.kind === 'presenter'}
				This implementation is available in the repository. Fork it, run locally, and adapt the host
				UI around the same Experience speak / listen APIs.
			{:else}
				This implementation is available in the repository. Fork it, run locally, and adapt the lesson
				UI around the same Liforma embed.
			{/if}
		</p>

		<h2>Run locally</h2>
		<p>
			From the repo root, <code>./start</code> runs all examples (or
			<code>./start sveltekit</code> / <code>./start nextjs</code> /
			<code>./start react-vite</code> for those frameworks). To run only this one:
		</p>
		<CodeBlock code={runCommands} lang="bash" filename="terminal" />
		{#if localUrl}
			<p>Local URL: <a href={localUrl}>{localUrl}</a></p>
		{/if}

		{#if example.kind === 'lessons'}
			<h2>Lesson data</h2>
			<p>
				Each lesson has its own <code>experienceId</code> in <code>src/lib/lessons.ts</code> (SvelteKit) or
				<code>lessons.js</code> (vanilla). Every ID maps to a Liforma Experience with a different scenario,
				location, and tutor prompt — for example café lessons use <code>{DEMO_EXPERIENCE_ID}</code>.
			</p>
		{:else if example.kind === 'embed' || example.kind === 'widget'}
			<h2>Experience id</h2>
			<p>
				The demo uses a single public experience id
				(<code>{DEMO_EXPERIENCE_ID}</code>) written directly in the page.
			</p>
		{/if}

		<h2>Liforma integration</h2>
		{#if example.kind === 'embed' && framework.slug === 'sveltekit'}
			<p>Import the Svelte component and pass one experience id:</p>
		{:else if example.kind === 'embed' && framework.slug === 'nextjs'}
			<p>
				Use a client component and import <code>Experience</code> from
				<code>@liforma/client/react</code> (not <code>/next</code>):
			</p>
		{:else if example.kind === 'embed' && framework.slug === 'react-vite'}
			<p>Import <code>Experience</code> from <code>@liforma/client/react</code> and pass one experience id:</p>
		{:else if example.kind === 'embed'}
			<p>Load the CDN script and mount the web component with one experience id:</p>
		{:else if example.kind === 'widget' && framework.slug === 'sveltekit'}
			<p>Mount <code>&lt;ExperienceWidget /&gt;</code> from <code>@liforma/client/svelte</code>:</p>
		{:else if example.kind === 'widget'}
			<p>Load the CDN script and mount the experience widget custom element:</p>
		{:else if framework.slug === 'sveltekit'}
			<p>Mount <code>&lt;Experience /&gt;</code> from <code>@liforma/client/svelte</code>:</p>
		{:else if framework.slug === 'nextjs' || framework.slug === 'react-vite'}
			<p>Mount <code>&lt;Experience /&gt;</code> from <code>@liforma/client/react</code>:</p>
		{:else}
			<p>Load the CDN script and mount the experience custom element:</p>
		{/if}
		<CodeBlock code={embedSnippet} lang={embedSnippetLang} filename="embed" />

		<h2>Key files</h2>
		<ul>
			{#if example.slug === 'elevenlabs-embed' || example.slug === 'openai-realtime-embed' || example.slug === 'deepgram-embed' || example.slug === 'livekit-embed' || example.slug === 'gemini-live-embed'}
				{#if framework.slug === 'sveltekit'}
					<li>
						<code>src/lib/helloByo.ts</code> — <strong>copy into your product</strong> —
						<code>startByoSpeech</code> (thin SDK call)
					</li>
					<li><code>src/routes/+page.svelte</code> — demo scaffolding only (Connect / Start UI)</li>
					{#if example.slug === 'deepgram-embed'}
						<li><code>../../shared/deepgram-agent-proxy.mjs</code> — demo WS proxy</li>
						<li><code>vite.config.ts</code> — attaches WS proxy</li>
					{:else if example.slug === 'gemini-live-embed'}
						<li><code>../../shared/gemini-live-proxy.mjs</code> — demo WS proxy</li>
						<li><code>vite.config.ts</code> — attaches WS proxy</li>
					{:else if example.slug === 'livekit-embed'}
						<li><code>src/routes/api/livekit-token/+server.ts</code> — demo token mint</li>
					{:else}
						<li><code>src/routes/api/…/+server.ts</code> — demo credential mint</li>
					{/if}
				{:else if framework.slug === 'nextjs'}
					<li>
						<code>lib/helloByo.ts</code> — <strong>copy into your product</strong> —
						<code>startByoSpeech</code> (thin SDK call)
					</li>
					<li><code>app/DemoApp.tsx</code> — demo scaffolding only (Connect / Start UI)</li>
					{#if example.slug === 'deepgram-embed' || example.slug === 'gemini-live-embed'}
						<li><code>server.mjs</code> — custom server: Next + WS proxy</li>
					{:else if example.slug === 'livekit-embed'}
						<li><code>app/api/livekit-token/route.ts</code> — demo token mint</li>
					{:else}
						<li><code>app/api/…/route.ts</code> — demo credential mint</li>
					{/if}
				{:else if framework.slug === 'react-vite'}
					<li>
						<code>src/lib/helloByo.ts</code> — <strong>copy into your product</strong> —
						<code>startByoSpeech</code> (thin SDK call)
					</li>
					<li><code>src/DemoApp.tsx</code> — demo scaffolding only (Connect / Start UI)</li>
					{#if example.slug === 'deepgram-embed' || example.slug === 'gemini-live-embed'}
						<li><code>vite.config.ts</code> — attaches WS proxy</li>
					{:else}
						<li><code>server/api-handlers.mjs</code> — demo credential mint</li>
					{/if}
				{:else}
					<li>
						<code>helloByo.js</code> — <strong>copy the npm pattern from docs</strong> —
						vanilla wraps <code>bridge.js</code>
					</li>
					<li><code>app.js</code> — demo scaffolding only</li>
					<li><code>bridge.js</code> — CDN port of the SDK helper</li>
					<li><code>server.mjs</code> — demo mint / proxy</li>
				{/if}
			{:else if example.kind === 'embed' && framework.slug === 'sveltekit'}
				<li><code>src/routes/+page.svelte</code> — <code>&lt;Experience /&gt;</code> from <code>@liforma/client/svelte</code></li>
			{:else if example.kind === 'embed' && framework.slug === 'nextjs'}
				<li><code>app/Demo.tsx</code> — client <code>&lt;Experience /&gt;</code> from <code>@liforma/client/react</code></li>
				<li><code>app/page.tsx</code> — App Router page</li>
			{:else if example.kind === 'embed' && framework.slug === 'react-vite'}
				<li><code>src/Demo.tsx</code> — <code>&lt;Experience /&gt;</code> from <code>@liforma/client/react</code></li>
				<li><code>src/App.tsx</code> — page chrome</li>
			{:else if example.kind === 'embed'}
				<li><code>index.html</code> — CDN script + <code>&lt;liforma-experience&gt;</code></li>
			{:else if example.kind === 'widget' && framework.slug === 'sveltekit'}
				<li><code>src/routes/+page.svelte</code> — marketing copy + <code>&lt;ExperienceWidget /&gt;</code></li>
			{:else if example.kind === 'widget' && framework.slug === 'nextjs'}
				<li><code>app/Demo.tsx</code> — <code>&lt;ExperienceWidget /&gt;</code> from <code>@liforma/client/react</code></li>
			{:else if example.kind === 'widget' && framework.slug === 'react-vite'}
				<li><code>src/Demo.tsx</code> — <code>&lt;ExperienceWidget /&gt;</code> from <code>@liforma/client/react</code></li>
			{:else if example.kind === 'widget'}
				<li><code>index.html</code> — CDN script + <code>&lt;liforma-experience-widget&gt;</code></li>
				<li><code>styles.css</code> — marketing page layout</li>
			{:else if example.slug === 'speak-playground' && (framework.slug === 'nextjs' || framework.slug === 'react-vite')}
				<li><code>SpeakWorkspace.tsx</code> / <code>SpeakApp.tsx</code> — <code>speech.speak(&#123; queue &#125;)</code> integration</li>
				<li><code>lib/config.ts</code> — experience id + demo lines</li>
			{:else if example.kind === 'presenter' && framework.slug === 'sveltekit'}
				<li><code>src/routes/+page.svelte</code> — host UI and Experience APIs</li>
				<li><code>src/lib/</code> — turns / feedback helpers when present</li>
			{:else if example.kind === 'presenter' && (framework.slug === 'nextjs' || framework.slug === 'react-vite')}
				<li><code>PracticeApp.tsx</code> / workspace component — host UI and Experience APIs</li>
				<li><code>lib/</code> — turns / feedback helpers when present</li>
			{:else if example.kind === 'presenter'}
				<li><code>index.html</code> — CDN script + page structure</li>
				<li><code>app.js</code> — <code>Experience.startSession</code>, speak / listen flow</li>
			{:else if framework.slug === 'sveltekit'}
				<li><code>src/lib/lessons.ts</code> — lesson data and per-lesson <code>experienceId</code></li>
				<li><code>src/routes/+page.svelte</code> — lesson UI, embed, and close-before-switch flow</li>
			{:else if framework.slug === 'nextjs' || framework.slug === 'react-vite'}
				<li><code>TutorApp.tsx</code> — lesson UI, embed, and close-before-switch flow</li>
				<li><code>lib/lessons.ts</code> — lesson data and per-lesson <code>experienceId</code></li>
			{:else}
				<li><code>lessons.js</code> — lesson data</li>
				<li><code>app.js</code> — session state and embed mount</li>
				<li><code>index.html</code> — page structure + CDN script</li>
			{/if}
		</ul>

		<div class="actions">
			{#if example.liveAppUrl && framework.slug === 'sveltekit'}
				<a
					class="btn primary"
					href={example.liveAppUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					{liveDemoLabel(example)}
				</a>
			{/if}
			<a
				class="btn"
				class:primary={!example.liveAppUrl || framework.slug !== 'sveltekit'}
				class:secondary={!!example.liveAppUrl && framework.slug === 'sveltekit'}
				href={githubTreePath(sourcePath)}
				target="_blank"
				rel="noopener noreferrer"
			>
				View source on GitHub
			</a>
			<a class="btn secondary" href="/frameworks/{framework.slug}">Framework overview</a>
		</div>
	{:else}
		<p>
			<strong>{framework.title}</strong> for {example.title} is planned for Phase
			{framework.implementationPhase}. Use the SvelteKit or vanilla implementation as reference
			material until this port ships.
		</p>
		<div class="actions">
			<a class="btn secondary" href="/examples/{example.slug}/sveltekit">SvelteKit reference</a>
			<a class="btn secondary" href="/examples/{example.slug}/vanilla">Vanilla reference</a>
		</div>
	{/if}

	<h2>Related docs</h2>
	<ul>
		<li><a href={externalLinks.docsEmbed}>Embed an Experience</a></li>
		<li><a href={externalLinks.docsWebComponent}>Web Component reference</a></li>
		{#if example.liveAppUrl && framework.slug === 'sveltekit'}
			<li>
				<a href={example.liveAppUrl} target="_blank" rel="noopener noreferrer"
					>{liveDemoLabel(example)}</a
				>
				— hosted {example.title} app (SvelteKit){#if example.liveDemoMode === 'local-only'}
					(clone/run notice — WS proxy){/if}
			</li>
		{/if}
		{#if example.meetExperienceUrl}
			<li>
				<a href={example.meetExperienceUrl}>Experience on Meet</a>
				— hosted experience without the lesson app UI
			</li>
		{/if}
	</ul>

	<CopyPrompt prompt={prompt} />
</div>

<style>
	.eyebrow {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.eyebrow a {
		font-weight: 600;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}
</style>
