<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import CopyPrompt from '$lib/components/CopyPrompt.svelte';
	import { DEMO_EXPERIENCE_ID, githubTreePath, externalLinks } from '$lib/constants';
	import { implementationSourcePath } from '$lib/examples';
	import { exampleLocalUrl } from '$lib/examplePorts';
	import {
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
			return sveltekitAgentPrompt(example.title, example.githubPath);
		}
		if (framework.slug === 'vanilla') {
			return vanillaAgentPrompt(example.title, example.githubPath);
		}
		return genericPortPrompt(example.title, example.githubPath, framework.slug);
	});

	const webComponentSnippet = `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>

<!-- experience-id comes from the selected lesson -->
<liforma-experience experience-id="\${lesson.experienceId}"></liforma-experience>`;

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
			This implementation is available in the repository. Fork it, run locally, and adapt the lesson
			UI around the same Liforma web component embed.
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

		<h2>Lesson data</h2>
		<p>
			Each lesson has its own <code>experienceId</code> in <code>src/lib/lessons.ts</code> (SvelteKit) or
			<code>lessons.js</code> (vanilla). Every ID maps to a Liforma Experience with a different scenario,
			location, and tutor prompt — for example café lessons use <code>{DEMO_EXPERIENCE_ID}</code>.
		</p>

		<h2>Liforma integration</h2>
		<p>Load the CDN script and mount the experience custom element with the selected lesson's ID:</p>
		<CodeBlock code={webComponentSnippet} lang="html" filename="embed" />

		<h2>Key files</h2>
		<ul>
			{#if framework.slug === 'sveltekit'}
				<li><code>src/lib/lessons.ts</code> — lesson data and per-lesson <code>experienceId</code></li>
				<li><code>src/routes/+page.svelte</code> — <code>&lt;Experience /&gt;</code> from <code>@liforma/client/svelte</code></li>
				<li><code>src/routes/+page.svelte</code> — lesson UI and close-before-switch flow</li>
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
				<a href={example.meetExperienceUrl}>Avatar on Meet</a>
				— hosted avatar experience without the lesson app UI
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
