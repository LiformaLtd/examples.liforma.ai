<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import { DEMO_EXPERIENCE_ID, githubTreePath } from '$lib/constants';
	import { implementationSourcePath, liveDemoLabel } from '$lib/examples';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const framework = $derived(data.framework);
	const relatedExamples = $derived(data.relatedExamples);

	const snippet = `<script src="https://cdn.liforma.ai/sdk/v2/client.js"><\\/script>
<liforma-experience experience-id="${DEMO_EXPERIENCE_ID}"></liforma-experience>`;
</script>

<svelte:head>
	<title>{framework.title} — Liforma Examples</title>
	<meta name="description" content={framework.description} />
</svelte:head>

<div class="page-shell prose">
	<h1>{framework.title}</h1>
	<p>{framework.description}</p>

	<span class="badge" class:available={framework.available} class:planned={!framework.available}>
		{framework.available ? 'Available now' : `Planned — Phase ${framework.implementationPhase}`}
	</span>

	<h2>Integration pattern</h2>
	<p>All framework examples centre on the same web component:</p>
	<CodeBlock code={snippet} lang="html" />

	{#if framework.available && relatedExamples.length > 0}
		<h2>Examples using {framework.title}</h2>
		<ul>
			{#each relatedExamples as example (example.slug)}
				<li>
					<a href="/examples/{example.slug}/{framework.slug}">{example.title}</a>
					—
					<a href={githubTreePath(implementationSourcePath(example, framework.slug))}>source</a>
					· <code>http://localhost:{example.localPort}</code>
					{#if example.liveAppUrl && framework.slug === 'sveltekit'}
						·
						<a href={example.liveAppUrl} target="_blank" rel="noopener noreferrer"
							>{liveDemoLabel(example).toLowerCase()}</a
						>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p>
			This framework port is not runnable yet. Start from the SvelteKit or vanilla Spanish Tutor
			examples when porting.
		</p>
		<p>
			<a href="/examples/spanish-tutor/sveltekit">Spanish Tutor (SvelteKit)</a>
			·
			<a href="/examples/spanish-tutor/vanilla">Spanish Tutor (vanilla)</a>
		</p>
	{/if}
</div>

<style>
	.badge {
		margin-bottom: 1.5rem;
	}
</style>
