<script lang="ts">
	import '$lib/styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
	<title>Spanish Tutor — Liforma Example</title>
	<meta
		name="description"
		content="Practise Spanish with an animated AI tutor. Lesson-based Liforma embed example."
	/>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="header-inner">
			<div>
				<p class="eyebrow">Liforma example</p>
				<h1>Spanish Tutor</h1>
			</div>
			<a
				class="docs-link"
				href="https://examples.liforma.ai/examples/spanish-tutor"
				target="_blank"
				rel="noopener noreferrer"
			>
				Example docs
			</a>
		</div>
	</header>
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}

	.header-inner {
		max-width: 1120px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent);
	}

	h1 {
		margin: 0;
		font-size: 1.5rem;
		letter-spacing: -0.02em;
	}

	.docs-link {
		font-size: 0.875rem;
		font-weight: 500;
		text-decoration: none;
	}

	.docs-link:hover {
		text-decoration: underline;
	}

	.app-main {
		flex: 1;
		max-width: 1120px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem;
	}
</style>
