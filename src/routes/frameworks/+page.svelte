<script lang="ts">
	import { frameworks } from '$lib/frameworks';
</script>

<svelte:head>
	<title>Frameworks — Liforma Examples</title>
	<meta name="description" content="Liforma example apps by framework — SvelteKit, vanilla, Next.js, React, Vue, and more." />
</svelte:head>

<div class="page-shell prose">
	<h1>Frameworks</h1>
	<p>
		Liforma examples use the <code>&lt;liforma-experience&gt;</code> web component as a universal
		bridge. Framework ports differ in host UI glue — not core experience integration.
	</p>

	<div class="card-grid">
		{#each frameworks as framework (framework.slug)}
			<a class="card" href="/frameworks/{framework.slug}">
				<span class="badge" class:available={framework.available} class:planned={!framework.available}>
					{framework.available ? 'Available' : `Phase ${framework.implementationPhase}`}
				</span>
				<h2>{framework.title}</h2>
				<p>{framework.description}</p>
				<span class="card-link">View →</span>
			</a>
		{/each}
	</div>
</div>
