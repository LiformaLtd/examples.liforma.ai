<script lang="ts">
	import { externalLinks, GITHUB_REPO } from '$lib/constants';
</script>

<footer class="footer">
	<div class="footer-inner">
		<p>Production-quality Liforma example apps for developers and AI builders.</p>
		<nav aria-label="Footer">
			<a href={externalLinks.docsQuickStart}>Quick Start</a>
			<a href={externalLinks.meetExperience}>Experience on Meet</a>
			<a href={GITHUB_REPO}>GitHub</a>
			<a href={externalLinks.www}>liforma.ai</a>
		</nav>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--border);
		background: var(--bg-elevated);
		margin-top: auto;
	}

	.footer-inner {
		max-width: var(--page-max);
		margin: 0 auto;
		padding: 1.5rem;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
	}

	.footer p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.footer nav {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.footer a {
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
