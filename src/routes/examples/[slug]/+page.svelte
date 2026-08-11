<script lang="ts">
	import CopyPrompt from '$lib/components/CopyPrompt.svelte';
	import { githubRawPath, githubTreePath, externalLinks, GITHUB_REPO } from '$lib/constants';
	import { liveDemoLabel } from '$lib/examples';
	import { getFramework } from '$lib/frameworks';
	import { exampleOverviewBullets } from '$lib/prompts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const example = $derived(data.example);
	const overviewBullets = $derived(exampleOverviewBullets(example.kind));

	const agentPrompt = $derived(
		example.kind === 'embed'
			? `Use the Liforma ${example.title} example to build an app in your chosen framework.

Read:
- ${githubRawPath(example.specPath)}
- ${githubTreePath(example.githubPath)}

Preserve the hello-world Experience embed (one experience id, no lesson catalogue).`
			: example.kind === 'widget'
				? `Use the Liforma ${example.title} example to build an app in your chosen framework.

Read:
- ${githubRawPath(example.specPath)}
- ${githubTreePath(example.githubPath)}

Preserve the ExperienceWidget corner launcher (thumb until click, in-page overlay expand).`
				: example.kind === 'presenter'
					? `Use the Liforma ${example.title} example to build an app in your chosen framework.

Read:
- ${githubRawPath(example.specPath)}
- ${githubTreePath(example.githubPath)}

Preserve the presenter / speak API integration and host-owned UI around the embed.`
					: `Use the Liforma ${example.title} example to build an app in your chosen framework.

Read:
- ${githubRawPath(example.specPath)}
- ${githubTreePath(example.githubPath)}

Preserve lesson-based UX, Liforma Experience embed, and close-before-switch lesson flow.`
	);
</script>

<svelte:head>
	<title>{example.title} — Liforma Examples</title>
	<meta name="description" content={example.description} />
</svelte:head>

<div class="page-shell prose">
	<p class="eyebrow">{example.category}</p>
	<h1>{example.title}</h1>
	<p>{example.description}</p>

	<ul class="meta-list">
		{#each example.features as feature (feature)}
			<li><span class="badge">{feature}</span></li>
		{/each}
	</ul>

	<div class="actions">
		{#if example.liveAppUrl}
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
			class:primary={!example.liveAppUrl}
			class:secondary={!!example.liveAppUrl}
			href="/examples/{example.slug}/sveltekit"
		>
			Run locally
		</a>
		<a class="btn secondary" href={githubTreePath(example.githubPath)} target="_blank" rel="noopener noreferrer">
			GitHub source
		</a>
		{#if example.meetExperienceUrl}
			<a
				class="btn secondary"
				href={example.meetExperienceUrl}
				target="_blank"
				rel="noopener noreferrer"
				title="Hosted experience only — no lesson UI"
			>
				Experience on Meet
			</a>
		{/if}
		<a class="btn secondary" href={githubRawPath(example.specPath)} target="_blank" rel="noopener noreferrer">
			spec.md
		</a>
	</div>

	<h2>What it demonstrates</h2>
	<ul>
		{#each overviewBullets as bullet (bullet)}
			<li>{bullet}</li>
		{/each}
	</ul>

	<h2>Implementations</h2>
	<div class="card-grid">
		{#each example.frameworks as frameworkSlug (frameworkSlug)}
			{@const framework = getFramework(frameworkSlug)}
			<a class="card" href="/examples/{example.slug}/{frameworkSlug}">
				<span class="badge available">{framework?.title ?? frameworkSlug}</span>
				<h3>{framework?.title ?? frameworkSlug}</h3>
				<p>{framework?.description ?? ''}</p>
				<span class="card-link">View implementation →</span>
			</a>
		{/each}
	</div>

	<h2>Related</h2>
	<ul>
		{#if example.liveAppUrl}
			<li>
				<a href={example.liveAppUrl} target="_blank" rel="noopener noreferrer"
					>{liveDemoLabel(example)}</a
				>
				— {example.liveDemoMode === 'local-only'
					? 'hosted notice; clone to run the full WS-proxy demo'
					: 'try the hosted app'}
			</li>
		{/if}
		<li><a href={externalLinks.docsQuickStart}>Docs: Quick Start</a></li>
		<li><a href={externalLinks.docsEmbed}>Docs: Embed an Experience</a></li>
		<li><a href={externalLinks.docsWebComponent}>Docs: Web Component</a></li>
		<li><a href={GITHUB_REPO}>examples.liforma.ai on GitHub</a></li>
	</ul>

	<CopyPrompt prompt={agentPrompt} />
</div>

<style>
	.eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-text);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1.5rem 0 2rem;
	}
</style>
