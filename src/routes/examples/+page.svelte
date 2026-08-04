<script lang="ts">
	import { examples } from '$lib/examples';
</script>

<svelte:head>
	<title>Examples — Liforma</title>
	<meta name="description" content="Browse Liforma example apps you can fork and ship." />
</svelte:head>

<div class="page-shell prose">
	<h1>Examples</h1>
	<p>Forkable apps that show how to integrate Liforma experiences in real products.</p>

	<div class="card-grid">
		{#each examples as example (example.slug)}
			<article class="card">
				<a class="card-body" href="/examples/{example.slug}">
					<span class="badge">{example.category}</span>
					<h2>{example.title}</h2>
					<p>{example.description}</p>
					<ul class="meta-list">
						{#each example.features as feature (feature)}
							<li><span class="badge">{feature}</span></li>
						{/each}
					</ul>
					<span class="card-link">View example →</span>
				</a>
				{#if example.liveAppUrl}
					<a
						class="btn secondary card-live"
						href={example.liveAppUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Live demo
					</a>
				{/if}
			</article>
		{/each}
	</div>
</div>
