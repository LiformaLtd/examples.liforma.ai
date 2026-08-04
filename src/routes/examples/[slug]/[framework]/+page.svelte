<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import CopyPrompt from '$lib/components/CopyPrompt.svelte';
	import { DEMO_EXPERIENCE_ID, githubTreePath, externalLinks } from '$lib/constants';
	import { implementationSourcePath } from '$lib/examples';
	import { exampleLocalUrl } from '$lib/examplePorts';
	import {
		frameworkEmbedSnippet,
		genericPortPrompt,
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
		return genericPortPrompt(example, framework.slug);
	});

	const embedSnippet = $derived(frameworkEmbedSnippet(example.kind, framework.slug));
	const embedSnippetLang = $derived(framework.slug === 'sveltekit' ? 'svelte' : 'html');

	const runCommands = $derived.by(() =>
		framework.slug === 'sveltekit'
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
			From the repo root, <code>./start</code> runs all examples (or <code>./start sveltekit</code> for
			SvelteKit apps). To run only this one:
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
		{:else if example.kind === 'embed'}
			<p>Load the CDN script and mount the web component with one experience id:</p>
		{:else if example.kind === 'widget'}
			<p>Load the CDN script and mount the experience widget custom element:</p>
		{:else if framework.slug === 'sveltekit'}
			<p>Mount <code>&lt;Experience /&gt;</code> from <code>@liforma/client/svelte</code>:</p>
		{:else}
			<p>Load the CDN script and mount the experience custom element:</p>
		{/if}
		<CodeBlock code={embedSnippet} lang={embedSnippetLang} filename="embed" />

		<h2>Key files</h2>
		<ul>
			{#if example.kind === 'embed' && framework.slug === 'sveltekit'}
				<li><code>src/routes/+page.svelte</code> — <code>&lt;Experience /&gt;</code> from <code>@liforma/client/svelte</code></li>
			{:else if example.kind === 'embed'}
				<li><code>index.html</code> — CDN script + <code>&lt;liforma-experience&gt;</code></li>
			{:else if example.kind === 'widget'}
				<li><code>index.html</code> — CDN script + <code>&lt;liforma-experience-widget&gt;</code></li>
				<li><code>styles.css</code> — page layout + fixed corner host</li>
			{:else if example.kind === 'presenter' && framework.slug === 'sveltekit'}
				<li><code>src/routes/+page.svelte</code> — host UI and Experience APIs</li>
				<li><code>src/lib/</code> — turns / feedback helpers when present</li>
			{:else if example.kind === 'presenter'}
				<li><code>index.html</code> — CDN script + page structure</li>
				<li><code>app.js</code> — <code>Experience.startSession</code>, speak / listen flow</li>
			{:else if framework.slug === 'sveltekit'}
				<li><code>src/lib/lessons.ts</code> — lesson data and per-lesson <code>experienceId</code></li>
				<li><code>src/routes/+page.svelte</code> — lesson UI, embed, and close-before-switch flow</li>
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
					Try live demo
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
				<a href={example.liveAppUrl} target="_blank" rel="noopener noreferrer">Live demo</a>
				— hosted {example.title} app (SvelteKit)
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
