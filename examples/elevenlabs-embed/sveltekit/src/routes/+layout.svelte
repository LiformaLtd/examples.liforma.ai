<script lang="ts">
	import '$lib/styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
	<title>ElevenLabs embed — Liforma example</title>
	<meta
		name="description"
		content="Basic Liforma experience embed with ElevenLabs Agents as the speech-to-speech system."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<div class="header-inner">
			<div>
				<p class="eyebrow">Liforma example</p>
				<h1>ElevenLabs embed</h1>
				<p class="lede">
					SvelteKit version of the coffee-barista embed with ElevenLabs Agents as speech-to-speech.
					Integration: <code>@liforma/client/elevenlabs</code>.
				</p>
			</div>
			<a
				class="docs-link"
				href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs"
				target="_blank"
				rel="noopener noreferrer"
			>
				BYO voice docs
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
		max-width: 1080px;
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

	.lede {
		margin: 0.35rem 0 0;
		max-width: 42rem;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.lede code {
		font-size: 0.85em;
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
		display: flex;
		flex-direction: column;
		min-height: 0;
		width: 100%;
		padding: 0;
	}
</style>
