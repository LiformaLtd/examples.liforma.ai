<script lang="ts">
	import LessonList from '$lib/components/LessonList.svelte';
	import { getLesson } from '$lib/lessons';
	import { playerEmbedUrl } from '$lib/liforma-stack';
	import { Experience } from '@liforma/client/svelte';
	import type { PageData } from './$types';

	type SessionStatus = 'idle' | 'active';

	let { data }: { data: PageData } = $props();

	let selectedLessonId = $state<string | null>(null);
	let sessionStatus = $state<SessionStatus>('idle');
	let transcriptNotes = $state<string[]>([]);

	const effectiveSelectedLessonId = $derived(
		selectedLessonId ?? data.lessons[0]?.id ?? null
	);
	const selectedLesson = $derived(
		effectiveSelectedLessonId ? getLesson(data.lessons, effectiveSelectedLessonId) : undefined
	);

	const sessionActive = $derived(sessionStatus === 'active');

	const experienceId = $derived(
		selectedLesson?.experienceId ?? data.lessons[0]?.experienceId ?? ''
	);

	function selectLesson(id: string): void {
		if (sessionActive) return;
		selectedLessonId = id;
	}

	function startSession(): void {
		if (!selectedLesson || sessionActive) return;
		sessionStatus = 'active';
		transcriptNotes = [
			`Session started for “${selectedLesson.title}”.`,
			'Allow microphone access when prompted to speak with your tutor.',
			'Transcript events from the SDK can be wired here in a production app.'
		];
	}

	function endSession(): void {
		sessionStatus = 'idle';
		transcriptNotes = [...transcriptNotes, 'Session ended. Choose another lesson or start again.'];
	}

	function handleEmbedClose(): void {
		if (sessionStatus === 'active') {
			endSession();
		}
	}
</script>

<div class="layout">
	<section class="sidebar" aria-label="Lessons">
		<h2>Lessons</h2>
		{#if data.catalogWarning}
			<p class="catalog-note" role="status">{data.catalogWarning} Showing static fallback lessons.</p>
		{:else if data.source === 'catalog'}
			<p class="catalog-note" role="status">Lessons loaded from your Liforma project catalog.</p>
		{/if}
		<LessonList
			lessons={data.lessons}
			selectedId={effectiveSelectedLessonId}
			{sessionActive}
			onselect={selectLesson}
		/>
	</section>

	<section class="workspace" aria-label="Practice">
		{#if selectedLesson}
			<div class="goal-card">
				<p class="goal-label">Learning goal</p>
				<h2>{selectedLesson.title}</h2>
				<p>{selectedLesson.goal}</p>
			</div>

			<div class="status-row">
				<span class="status-pill" data-status={sessionStatus}>
					{#if sessionStatus === 'active'}
						Session active
					{:else}
						Ready to practise
					{/if}
				</span>
				{#if sessionActive}
					<button type="button" class="btn secondary" onclick={endSession}>End session</button>
				{:else}
					<button type="button" class="btn primary" onclick={startSession}>Start practice</button>
				{/if}
			</div>

			<div class="mic-note" role="note">
				<strong>Microphone:</strong> Your browser will ask for permission when the avatar session
				starts. Use headphones in shared spaces.
			</div>

			{#if sessionActive}
				<div class="embed-shell">
					<Experience
						experienceId={experienceId}
						language="es"
						embedBaseUrl={playerEmbedUrl()}
						onClose={handleEmbedClose}
					/>
				</div>
			{:else}
				<div class="avatar-placeholder">
					<p>Select a lesson and start practice to load your Spanish tutor avatar.</p>
					<p class="muted">
						Experience ID: <code>{experienceId}</code>
					</p>
				</div>
			{/if}

			<div class="transcript-panel">
				<h3>Session notes</h3>
				{#if transcriptNotes.length === 0}
					<p class="muted">Conversation notes and transcript lines appear here during a session.</p>
				{:else}
					<ul>
						{#each transcriptNotes as note, index (index)}
							<li>{note}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<p>Choose a lesson to begin.</p>
		{/if}
	</section>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(240px, 300px) 1fr;
		gap: 1.5rem;
		align-items: start;
	}

	.sidebar h2,
	.workspace h2 {
		margin: 0 0 1rem;
		font-size: 1.125rem;
	}

	.catalog-note {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.goal-card {
		padding: 1rem 1.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
		margin-bottom: 1rem;
	}

	.goal-label {
		margin: 0 0 0.35rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.goal-card h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}

	.goal-card p:last-child {
		margin: 0;
		color: var(--text-muted);
	}

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 500;
		background: var(--bg-subtle);
		color: var(--text-muted);
	}

	.status-pill[data-status='active'] {
		background: var(--accent-subtle);
		color: var(--accent);
	}

	.btn {
		border: none;
		border-radius: var(--radius-sm);
		padding: 0.55rem 1rem;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.btn.primary {
		background: var(--accent);
		color: white;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}

	.btn.secondary {
		background: var(--bg-elevated);
		border: 1px solid var(--border-strong);
		color: var(--text);
	}

	.mic-note {
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: var(--warning-bg);
		border: 1px solid var(--warning-border);
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.embed-shell {
		min-height: 420px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		margin-bottom: 1rem;
	}

	.avatar-placeholder {
		min-height: 280px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		text-align: center;
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	code {
		font-family: ui-monospace, monospace;
		font-size: 0.8125rem;
		background: var(--bg-subtle);
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
	}

	.transcript-panel {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
	}

	.transcript-panel h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
	}

	.transcript-panel ul {
		margin: 0;
		padding-left: 1.15rem;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	@media (max-width: 800px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
</style>
