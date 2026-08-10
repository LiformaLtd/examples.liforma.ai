<script lang="ts">
	import { externalLinks, GITHUB_REPO } from '$lib/constants';
	import { toggleTheme } from '$lib/theme';
	import IconSun from '~icons/tabler/sun';
</script>

<header class="header">
	<div class="header-inner">
		<a class="brand" href="/">
			<span class="brand-name">liforma</span>
			<span class="brand-suffix">examples</span>
		</a>
		<nav class="header-nav" aria-label="Main">
			<a href="/examples">Examples</a>
			<a href="/frameworks">Frameworks</a>
			<a href={externalLinks.docs} target="_blank" rel="noopener noreferrer">Docs</a>
			<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
		</nav>
		<button type="button" class="icon-btn" aria-label="Toggle theme" onclick={toggleTheme}>
			<IconSun width="18" height="18" aria-hidden="true" />
		</button>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 50;
		height: var(--header-height);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--bg) 85%, transparent);
		backdrop-filter: blur(12px);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 100%;
		padding: 0 1.25rem;
		max-width: var(--page-max);
		margin: 0 auto;
	}

	.brand {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		text-decoration: none;
		color: var(--text);
	}

	.brand:hover {
		text-decoration: none;
	}

	.brand-name {
		font-weight: 700;
		font-size: 1.05rem;
		letter-spacing: -0.03em;
	}

	.brand-suffix {
		font-size: 0.8125rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-left: auto;
	}

	.header-nav a {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-weight: 500;
		text-decoration: none;
	}

	.header-nav a:hover {
		color: var(--text);
		text-decoration: none;
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--text-muted);
		cursor: pointer;
	}

	.icon-btn:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}

	@media (max-width: 700px) {
		.header-nav {
			display: none;
		}
	}
</style>
