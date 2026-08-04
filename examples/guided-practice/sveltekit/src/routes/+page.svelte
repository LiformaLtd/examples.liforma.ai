<script lang="ts">
	import { buildPracticeFeedback, type PracticeFeedback } from '$lib/feedback';
	import { PRACTICE_EXPERIENCE_ID, practiceTurns } from '$lib/turns';
	import type { ExperienceEvents, StartButtonOptions } from '@liforma/client';
	import { Experience, type ExperienceHandle } from '@liforma/client/svelte';

	type Phase =
		| 'loading'
		| 'await_begin'
		| 'speaking'
		| 'await_start'
		| 'recording'
		| 'feedback'
		| 'complete'
		| 'error';

	type StatusTone = 'default' | 'active' | 'good' | 'warn';

	let experience = $state<ExperienceHandle>();
	let turnIndex = $state(0);
	let lessonStarted = $state(false);
	let busy = $state(false);
	let phase = $state<Phase>('loading');
	let statusText = $state('Loading…');
	let statusTone = $state<StatusTone>('default');
	let logs = $state<string[]>([
		'Scripted practice: canned tutor lines, button-gated recording, host-side feedback.'
	]);
	let transcriptText = $state('');
	let showTranscript = $state(false);
	let feedback = $state<PracticeFeedback | null>(null);
	let recordingActive = $state(false);
	let modeLabel = $state('presenter / manual / manual');

	const currentTurn = $derived(practiceTurns[turnIndex]);
	const turnTitle = $derived(
		turnIndex >= practiceTurns.length
			? 'Practice complete'
			: `Turn ${turnIndex + 1} of ${practiceTurns.length}`
	);
	const turnHint = $derived(
		turnIndex >= practiceTurns.length
			? 'You finished all scripted turns.'
			: (currentTurn?.hint ?? '')
	);

	const turnButtonLabel = $derived.by(() => {
		if (phase === 'speaking') return 'Speaking…';
		if (phase === 'await_start') return 'Start';
		if (phase === 'recording') return 'Stop';
		if (phase === 'feedback') return 'Next';
		return 'Start';
	});

	const turnButtonClass = $derived.by(() => {
		if (phase === 'await_start') return 'state-start';
		if (phase === 'recording') return 'state-stop';
		if (phase === 'feedback') return 'state-next';
		return 'state-disabled';
	});

	const turnButtonDisabled = $derived(
		busy ||
			!experience ||
			!lessonStarted ||
			phase === 'loading' ||
			phase === 'error' ||
			phase === 'complete' ||
			phase === 'await_begin' ||
			phase === 'speaking'
	);

	const startButton: StartButtonOptions = {
		label: 'Begin lesson',
		ariaLabel: 'Begin guided practice lesson',
		placement: 'bottom-center',
		variant: 'primary',
		appearance: {
			backgroundColor: '#2563eb',
			textColor: '#ffffff',
			borderRadiusPx: 999,
			size: 'large',
			shadow: 'strong'
		}
	};

	function pushLog(line: string): void {
		logs = [...logs, line];
	}

	function setStatus(text: string, tone: StatusTone = 'default'): void {
		statusText = text;
		statusTone = tone;
	}

	function setPhase(next: Phase): void {
		phase = next;
		recordingActive = next === 'recording';
	}

	async function withBusy(fn: () => Promise<void>): Promise<void> {
		if (busy) return;
		busy = true;
		try {
			await fn();
		} finally {
			busy = false;
		}
	}

	async function speakCurrentTutorLine(): Promise<void> {
		const turn = currentTurn;
		if (!experience || !turn) return;
		feedback = null;
		showTranscript = false;
		transcriptText = '';
		setPhase('speaking');
		setStatus('Tutor speaking…', 'active');
		pushLog(`Tutor: ${turn.tutorLine}`);
		await experience.speak({ text: turn.tutorLine });
		setPhase('await_start');
		setStatus('Tap Start when you are ready to speak', 'default');
		pushLog('Your turn — tap Start, speak, then Stop.');
	}

	async function handleTurnButton(): Promise<void> {
		if (phase === 'await_start') {
			await withBusy(async () => {
				if (!experience) return;
				showTranscript = false;
				transcriptText = '';
				await experience.startListening();
				setPhase('recording');
				setStatus('Recording… tap Stop when finished', 'active');
				pushLog('Listening…');
			});
			return;
		}

		if (phase === 'recording') {
			await withBusy(async () => {
				const turn = currentTurn;
				if (!experience || !turn) return;
				const utterance = await experience.stopListening();
				transcriptText = utterance.text.trim() || '(no speech detected)';
				showTranscript = true;
				feedback = buildPracticeFeedback(turn.hint, utterance.text);
				setPhase('feedback');
				setStatus('Review your transcript and feedback, then Next', 'default');
				pushLog(`You: ${utterance.text.trim() || '(empty)'}`);
				pushLog(`Feedback: ${feedback.summary}`);
			});
			return;
		}

		if (phase === 'feedback') {
			await withBusy(async () => {
				turnIndex += 1;
				if (turnIndex >= practiceTurns.length) {
					setPhase('complete');
					setStatus('Practice complete', 'good');
					pushLog('All turns complete.');
					return;
				}
				pushLog(`--- Turn ${turnIndex + 1} ---`);
				await speakCurrentTutorLine();
			});
		}
	}

	function handleReady({ manifest }: ExperienceEvents['ready']): void {
		modeLabel = `${manifest.experience.mode} / ${manifest.experience.responseMode} / ${manifest.experience.speechInputMode}`;
		setPhase('await_begin');
		setStatus('Tap Begin lesson in the player', 'default');
		pushLog('Experience ready. Use the player start button to begin the lesson.');
	}

	function handleTranscript(update: ExperienceEvents['userTranscript']): void {
		if (recordingActive && update.text.trim()) {
			transcriptText = update.text.trim();
			showTranscript = true;
		}
	}

	function handleStarted(): void {
		if (lessonStarted) return;
		lessonStarted = true;
		void withBusy(async () => {
			setStatus('Starting first tutor line…', 'active');
			pushLog('Player unlocked audio and started the session.');
			await speakCurrentTutorLine();
		});
	}

	function handleStateUpdate(state: string): void {
		if (state === 'error') {
			setPhase('error');
			setStatus('Experience error', 'warn');
		}
	}

	function handleError(error: Error): void {
		setPhase('error');
		setStatus('Failed to load', 'warn');
		if (error.message.includes('Failed to fetch')) {
			pushLog(
				'Could not reach the Liforma API. Add http://localhost:4003 to your project allowed origins.'
			);
		} else {
			pushLog(error.message);
		}
	}
</script>

<div class="layout">
	<section class="workspace" aria-label="Practice">
		<div class="experience-panel">
			<div class="experience-host" aria-label="Liforma experience embed">
				<Experience
					bind:this={experience}
					experienceId={PRACTICE_EXPERIENCE_ID}
					mode="presenter"
					speechInputMode="manual"
					{startButton}
					onReady={handleReady}
					onStarted={handleStarted}
					onUserTranscript={handleTranscript}
					onStateUpdate={handleStateUpdate}
					onError={handleError}
				/>
			</div>
		</div>

		<div class="turn-card">
			<h2>{turnTitle}</h2>
			<p>{turnHint}</p>
			<p class="meta">
				Experience: <code>{PRACTICE_EXPERIENCE_ID}</code> · modes:
				<code>{modeLabel}</code>
			</p>
		</div>

		<div class="controls">
			<span class="status-pill" data-tone={statusTone}>{statusText}</span>
			<button
				type="button"
				class="btn turn-btn {turnButtonClass}"
				disabled={turnButtonDisabled}
				aria-live="polite"
				onclick={() => void handleTurnButton()}
			>
				{turnButtonLabel}
			</button>
		</div>

		{#if showTranscript}
			<div class="transcript-panel" aria-live="polite">
				<h3>Your transcript</h3>
				<p>{transcriptText}</p>
			</div>
		{/if}

		{#if feedback}
			<div class="feedback-panel" data-tone={feedback.tone} aria-live="polite">
				<h3>{feedback.summary}</h3>
				<p>{feedback.detail}</p>
			</div>
		{/if}
	</section>

	<aside class="sidebar" aria-label="Session log">
		<h2>Session log</h2>
		<ul class="log-list">
			{#each logs as line, index (index)}
				<li>{line}</li>
			{/each}
		</ul>
	</aside>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
		gap: 1.5rem;
		align-items: start;
	}

	.workspace {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.experience-panel {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #030508;
		min-height: 420px;
		overflow: hidden;
	}

	.experience-host {
		width: 100%;
		min-height: 420px;
	}

	.turn-card {
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
	}

	.turn-card h2 {
		margin: 0 0 0.35rem;
		font-size: 1.125rem;
	}

	.turn-card p {
		margin: 0;
		color: var(--text-muted);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
	}

	.status-pill[data-tone='active'] {
		background: var(--accent-subtle);
		border-color: rgba(92, 74, 224, 0.35);
		color: var(--accent);
	}

	.status-pill[data-tone='good'] {
		background: var(--good-bg);
		border-color: rgba(13, 122, 95, 0.25);
		color: var(--good);
	}

	.status-pill[data-tone='warn'] {
		background: var(--warn-bg);
		border-color: #fde68a;
		color: var(--warn);
	}

	.btn {
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		padding: 0.55rem 0.9rem;
		background: var(--bg-elevated);
		cursor: pointer;
		font-weight: 600;
	}

	.btn:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.turn-btn.state-start:not(:disabled) {
		background: var(--accent-subtle);
		border-color: rgba(92, 74, 224, 0.45);
		color: var(--accent);
	}

	.turn-btn.state-stop:not(:disabled) {
		background: #fef2f2;
		border-color: #fecaca;
		color: #b91c1c;
	}

	.turn-btn.state-next:not(:disabled) {
		background: var(--good-bg);
		border-color: rgba(13, 122, 95, 0.35);
		color: var(--good);
	}

	.transcript-panel {
		padding: 1rem 1.25rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--bg-subtle);
	}

	.transcript-panel h3 {
		margin: 0 0 0.35rem;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.transcript-panel p {
		margin: 0;
		font-size: 1.0625rem;
		line-height: 1.45;
	}

	.feedback-panel {
		padding: 1rem 1.25rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--bg-elevated);
	}

	.feedback-panel[data-tone='good'] {
		border-color: rgba(13, 122, 95, 0.35);
		background: var(--good-bg);
	}

	.feedback-panel h3 {
		margin: 0 0 0.35rem;
		font-size: 1rem;
	}

	.feedback-panel p {
		margin: 0;
		color: var(--text-muted);
	}

	.sidebar h2 {
		margin: 0 0 0.75rem;
		font-size: 1.0625rem;
	}

	.log-list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 420px;
		overflow: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.log-list li {
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
	}

	.meta {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-top: 0.5rem;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.log-list {
			max-height: 240px;
		}
	}
</style>
