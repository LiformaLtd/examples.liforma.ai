<script lang="ts">
	/**
	 * Marketing page shell + corner ExperienceWidget.
	 *
	 * Integration pattern (copy into your product):
	 *   import { ExperienceWidget } from '@liforma/client/svelte';
	 */
	import { ExperienceWidget } from '@liforma/client/svelte';

	const EXPERIENCE_ID = 'exp_01EXAMPLES_COFFEE_BARISTA';
</script>

<main class="page">
	<p class="eyebrow">Liforma example</p>
	<h1>Experience widget</h1>
	<p class="lede">
		This page is ordinary marketing copy. The avatar in the corner is an
		<code>&lt;ExperienceWidget /&gt;</code> with <code>position="bottom-right"</code> — no host CSS
		required. The SDK loads thumb plates from the public preview API, warms the player after idle,
		then opens the conversation on one click. On desktop, use the reduce control to dock a
		draggable portrait window; on mobile the player opens near full-screen with close only.
	</p>
	<p>
		Use <code>position="static"</code> (default) when you want to place the FAB yourself with an
		enclosing div. Optional <code>offset</code> sets the corner inset (default 16).
	</p>
</main>

<ExperienceWidget
	experienceId={EXPERIENCE_ID}
	alt="Talk to our coffee barista"
	position="bottom-right"
	offset={16}
	prefetch="idle"
/>

<style>
	.page {
		max-width: 40rem;
		margin: 0 auto;
		padding: 4.5rem 1.5rem 8rem;
	}

	.eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
	}

	h1 {
		margin: 0 0 1rem;
		font-size: clamp(2rem, 4vw, 2.75rem);
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.lede {
		font-size: 1.0625rem;
		line-height: 1.55;
		color: var(--muted);
	}

	p {
		margin: 0 0 1rem;
		line-height: 1.55;
	}
</style>
