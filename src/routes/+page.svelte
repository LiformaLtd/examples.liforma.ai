<script lang="ts">
	import { examples, liveDemoLabel } from '$lib/examples';
	import { GITHUB_REPO } from '$lib/constants';
	import { frameworks } from '$lib/frameworks';
</script>

<svelte:head>
	<title>Liforma Examples — Build from working Liforma examples</title>
	<meta
		name="description"
		content="Production-quality starter apps for adding intelligent animated avatars, speech, and real-time AI experiences to your product."
	/>
</svelte:head>

<section class="hero page-shell">
	<p class="eyebrow">examples.liforma.ai</p>
	<h1>Build from working Liforma examples</h1>
	<p class="lead">
		Production-quality starter apps for adding intelligent animated avatars, speech, and real-time
		AI experiences to your product.
	</p>
	<div class="hero-actions">
		<a class="btn primary" href="/examples">Browse examples</a>
		<a class="btn secondary" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
			View on GitHub
		</a>
	</div>
	<p class="run-hint">
		Try a <strong>Live demo</strong> on <code>*.examples.liforma.ai</code>, or clone and run
		<code>./start</code> for the gallery on <code>localhost:4000</code> plus demos on
		<code>4001</code>–<code>4010</code>. Deepgram / Gemini need a local WebSocket proxy
		(hosted pages explain how).
	</p>
</section>

<section class="page-shell" aria-label="Featured examples">
	<h2>Examples</h2>
	<div class="card-grid">
		{#each examples as example (example.slug)}
			<article class="card">
				<a class="card-body" href="/examples/{example.slug}">
					<span class="badge">{example.category}</span>
					<h3>{example.title}</h3>
					<p>{example.description}</p>
					<span class="card-link">View example →</span>
				</a>
				{#if example.liveAppUrl}
					<a
						class="btn secondary card-live"
						href={example.liveAppUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						{liveDemoLabel(example)}
					</a>
				{/if}
			</article>
		{/each}
	</div>
</section>

<section class="page-shell" aria-label="Frameworks">
	<h2>Frameworks</h2>
	<p class="section-lead">
		Each example can be ported across ecosystems. Phase 1 ships <strong>SvelteKit</strong> and
		<strong>vanilla HTML</strong> — the web component works everywhere else.
	</p>
	<div class="card-grid">
		{#each frameworks as framework (framework.slug)}
			<a class="card" href="/frameworks/{framework.slug}">
				<span class="badge" class:available={framework.available} class:planned={!framework.available}>
					{framework.available ? 'Available' : `Phase ${framework.implementationPhase}`}
				</span>
				<h3>{framework.title}</h3>
				<p>{framework.description}</p>
				<span class="card-link">View framework →</span>
			</a>
		{/each}
	</div>
</section>

<style>
	.hero {
		padding-top: 3rem;
		padding-bottom: 2rem;
	}

	.eyebrow {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent-text);
	}

	.lead {
		font-size: 1.125rem;
		color: var(--text-muted);
		max-width: 42rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.run-hint {
		margin-top: 1.25rem;
		font-size: 0.9375rem;
		color: var(--text-muted);
		max-width: 42rem;
	}

	.section-lead {
		color: var(--text-muted);
		max-width: 42rem;
	}
</style>
