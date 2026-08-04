<script lang="ts">
	import { Experience } from '@liforma/client/svelte';
	import { BASIC_EMBED_EXPERIENCE_ID } from '$lib/config';
</script>

<div class="stage">
	<p class="lede">
		This example shows a simple Experience embedded in a div on a web page.
	</p>
	<div class="experience">
		<Experience experienceId={BASIC_EMBED_EXPERIENCE_ID} />
	</div>
</div>

<style>
	.stage {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		max-width: 1120px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem;
		gap: 1rem;
	}

	.lede {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9375rem;
		max-width: 42rem;
	}

	.experience {
		flex: 1;
		min-height: 480px;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: #030508;
	}

	.experience :global(.liforma-experience-shell) {
		flex: 1;
		min-height: 0;
		width: 100%;
	}
</style>
