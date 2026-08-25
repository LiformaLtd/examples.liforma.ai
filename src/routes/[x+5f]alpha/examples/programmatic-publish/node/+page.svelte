<script lang="ts">
	import { externalLinks, githubTreePath } from '$lib/constants';

	const sourcePath = '_alpha/examples/programmatic-publish/node';
	const runSnippet = `export LIFORMA_API_KEY=lfm_live_…
export LIFORMA_PROJECT_ID=proj_…

cd ${sourcePath}
npm install
npm start -- --lobby ./lobby.png --clothes ./clothes.png --hair ./hair.png`;
</script>

<svelte:head>
	<title>Programmatic publish (Node) — Alpha — Liforma Examples</title>
	<meta
		name="description"
		content="Unlisted local-only Node CLI for @liforma/publisher. Not a hosted live demo."
	/>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="page-shell prose">
	<p class="eyebrow">Alpha · local CLI only</p>
	<h1>Programmatic publish (Node)</h1>
	<p>
		This is not a browser demo. It documents an unlisted Node CLI that uses
		<code>@liforma/publisher</code> to upload images and create a location, place, character, and
		published experience. Port <code>4011</code> is reserved for the CLI (no HTTP server).
	</p>

	<p>
		Authoring docs:
		<a
			href={`${externalLinks.docs}/_alpha/publisher-sdk`}
			target="_blank"
			rel="noopener noreferrer"
		>
			Publisher SDK (alpha)
		</a>
	</p>

	<h2>Run locally</h2>
	<ol>
		<li>Build <code>@liforma/publisher</code> from <code>api.liforma.ai/packages/publisher</code>.</li>
		<li>Use a <strong>live</strong> project API key on an authoring-enabled org.</li>
		<li>Provide PNG paths for lobby, clothes, and hair plates.</li>
	</ol>
	<pre><code>{runSnippet}</code></pre>

	<div class="actions">
		<a class="btn primary" href={githubTreePath(sourcePath)} target="_blank" rel="noopener noreferrer">
			GitHub source
		</a>
		<a class="btn secondary" href="/_alpha">Alpha index</a>
	</div>

	<p class="note">
		Creates billable assets. Not listed in the public gallery or started by <code>./start</code>.
	</p>
</div>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}

	.note {
		color: var(--muted, #64748b);
		font-size: 0.95rem;
	}

	pre {
		overflow-x: auto;
		padding: 1rem 1.1rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg-elevated, var(--bg)) 92%, var(--fg) 8%);
	}

	pre code {
		font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace);
		font-size: 0.85rem;
		white-space: pre;
	}
</style>
