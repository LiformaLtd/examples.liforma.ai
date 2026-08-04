<script lang="ts">
	import { Experience } from '@liforma/client/svelte';
	import { BASIC_EMBED_EXPERIENCE_ID } from '$lib/config';
	import { playerEmbedUrl } from '$lib/liforma-stack';
</script>

<div class="stage">
	<p class="lede">
		Canonical Svelte embed from the docs: one <code>Experience</code> component and one
		<code>experienceId</code>. Conversation mode uses the player defaults — no host-side speak or
		listen UI.
	</p>
	<div class="avatar">
		<Experience experienceId={BASIC_EMBED_EXPERIENCE_ID} embedBaseUrl={playerEmbedUrl()} />
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

	.avatar {
		flex: 1;
		min-height: 480px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		background: #030508;
	}
</style>
