<script lang="ts">
	import { githubTreePath } from '$lib/constants';
</script>

<svelte:head>
	<title>Alpha — Liforma Examples</title>
	<meta
		name="description"
		content="Unlisted preview examples. Not in the gallery, sitemap, or ./start."
	/>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="page-shell prose">
	<p class="eyebrow">Unlisted</p>
	<h1>Alpha</h1>
	<p>
		These samples are shipping but are not part of the public examples gallery. Anyone with the URL
		can open them. They are not linked from the home page, <code>/examples</code>, or
		<code>./start</code>.
	</p>

	<h2>Pages</h2>
	<ul>
		<li>
			<a href="/_alpha/examples/programmatic-publish/node">Programmatic publish (Node)</a>
			— local-only CLI for <code>@liforma/publisher</code> (no hosted publish demo).
		</li>
	</ul>

	<p>
		Source:
		<a href={githubTreePath('_alpha')} target="_blank" rel="noopener noreferrer">
			<code>_alpha/</code> on GitHub
		</a>
	</p>
</div>
