<script lang="ts">
	import { onMount } from 'svelte';
	import { DEMO_LINES, SPEAK_EXPERIENCE_ID } from '$lib/config';
	import { getExperienceClass, loadLiformaSdk, type LiformaExperience } from '$lib/load-liforma-sdk';

	type SpeakBehavior = 'enqueue' | 'interrupt';
	type LogKind = 'info' | 'speak' | 'end' | 'interrupt';
	type LogEntry = { id: number; text: string; kind: LogKind };
	type StatusTone = 'default' | 'active' | 'warn';

	let avatarHost: HTMLDivElement | undefined = $state();
	let experience: LiformaExperience | null = $state(null);
	let sessionReady = $state(false);
	let behavior = $state<SpeakBehavior>('enqueue');
	let speakText = $state('');
	let statusText = $state('Loading…');
	let statusTone = $state<StatusTone>('default');
	let logs = $state<LogEntry[]>([
		{ id: 0, text: 'Speak playground: type text, press Enter, compare enqueue vs interrupt.', kind: 'info' }
	]);
	let nextLogId = 1;

	const inputEnabled = $derived(sessionReady);

	function pushLog(text: string, kind: LogKind = 'info'): void {
		logs = [...logs, { id: nextLogId++, text, kind }];
	}

	function setStatus(text: string, tone: StatusTone = 'default'): void {
		statusText = text;
		statusTone = tone;
	}

	function queueSpeak(text: string): void {
		if (!experience || !text.trim()) return;

		pushLog(`speak({ behavior: '${behavior}' }): “${text.trim()}”`, 'speak');

		void experience
			.speak({ text: text.trim(), behavior })
			.then((result) => {
				pushLog(`completed (${result.durationMs}ms): “${result.text}”`, 'end');
			})
			.catch((err) => {
				if (err instanceof DOMException && err.name === 'AbortError') {
					pushLog(`interrupted: “${text.trim()}”`, 'interrupt');
					return;
				}
				const message = err instanceof Error ? err.message : String(err);
				pushLog(`error: ${message}`, 'interrupt');
			});
	}

	function handleSpeakSubmit(): void {
		const trimmed = speakText.trim();
		if (!trimmed || !sessionReady) return;
		queueSpeak(trimmed);
		speakText = '';
	}

	function fireBurst(): void {
		if (!sessionReady) return;
		pushLog('--- firing three lines without waiting ---');
		for (const line of DEMO_LINES) {
			queueSpeak(line);
		}
	}

	onMount(() => {
		void (async () => {
			try {
				setStatus('Loading avatar…', 'active');
				await loadLiformaSdk();
				const Experience = getExperienceClass();

				const session = await Experience.startSession({
					experienceId: SPEAK_EXPERIENCE_ID,
					mode: 'presenter',
					speechInputMode: 'off',
					startButton: {
						label: 'Start avatar',
						ariaLabel: 'Start avatar session and unlock audio',
						placement: 'bottom-center',
						variant: 'primary',
						appearance: {
							backgroundColor: '#5c4ae0',
							textColor: '#ffffff',
							borderRadiusPx: 999,
							size: 'large',
							shadow: 'soft'
						}
					}
				});

				experience = session;

				let readyHandled = false;
				const handleReady = () => {
					if (readyHandled) return;
					readyHandled = true;
					setStatus('Tap Start avatar in the player', 'default');
					pushLog('Avatar ready. Use the player start button to unlock audio.');
				};

				session.on('ready', handleReady as (payload: unknown) => void);
				session.on('started', () => {
					sessionReady = true;
					setStatus('Ready — type a line and press Enter', 'active');
					pushLog('Session started. Try enqueue vs interrupt with quick successive lines.');
				});
				session.on('characterSpeechEnded', ((event: { reason?: string; text: string }) => {
					if (event.reason === 'interrupted') {
						pushLog(`characterSpeechEnded: interrupted — “${event.text}”`, 'interrupt');
					}
				}) as (payload: unknown) => void);

				if (!avatarHost) throw new Error('Avatar host element missing.');

				await session.attach({
					container: avatarHost,
					onPlayerStatusChange: (state: string) => {
						if (state === 'error') {
							setStatus('Avatar error', 'warn');
							sessionReady = false;
						}
					}
				});

				if (!readyHandled) {
					handleReady();
				}
			} catch (err) {
				console.error(err);
				setStatus('Failed to load', 'warn');
				sessionReady = false;
				const message = err instanceof Error ? err.message : String(err);
				if (message === 'Failed to fetch' || message.includes('Failed to fetch')) {
					pushLog(
						'Could not reach the Liforma API (often CORS or network). Check api.liforma.ai is reachable and your origin is allowlisted.'
					);
				} else {
					pushLog(message);
				}
			}
		})();
	});
</script>

<div class="layout">
	<section class="workspace" aria-label="Speak playground">
		<div class="avatar-panel">
			<div class="avatar-host" bind:this={avatarHost} aria-label="Liforma avatar embed"></div>
		</div>

		<div class="control-card">
			<h2>Speech behavior</h2>
			<p>
				<strong>Enqueue</strong> waits for the current line to finish.
				<strong>Interrupt</strong> stops active speech and clears the queue before the new line.
			</p>

			<div class="behavior-toggle" role="radiogroup" aria-label="Speak behavior">
				<label class="behavior-option" class:is-selected={behavior === 'enqueue'}>
					<input type="radio" name="behavior" value="enqueue" bind:group={behavior} />
					Enqueue
				</label>
				<label class="behavior-option" class:is-selected={behavior === 'interrupt'}>
					<input type="radio" name="behavior" value="interrupt" bind:group={behavior} />
					Interrupt
				</label>
			</div>

			<form
				class="speak-form"
				onsubmit={(event) => {
					event.preventDefault();
					handleSpeakSubmit();
				}}
			>
				<input
					type="text"
					class="speak-input"
					placeholder="Type something for the avatar to say…"
					autocomplete="off"
					disabled={!inputEnabled}
					bind:value={speakText}
				/>
				<button type="submit" class="btn btn-primary" disabled={!inputEnabled}>Speak</button>
			</form>

			<div class="demo-actions">
				<button type="button" class="btn" disabled={!inputEnabled} onclick={() => fireBurst()}>
					Fire 3 lines quickly
				</button>
			</div>

			<p class="meta">
				<span class="status-pill" data-tone={statusTone}>{statusText}</span>
				· Experience: <code>{SPEAK_EXPERIENCE_ID}</code>
			</p>
		</div>
	</section>

	<aside class="sidebar" aria-label="Session log">
		<h2>Session log</h2>
		<ul class="log-list">
			{#each logs as entry (entry.id)}
				<li data-kind={entry.kind === 'info' ? undefined : entry.kind}>{entry.text}</li>
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

	.avatar-panel {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #030508;
		min-height: 380px;
		overflow: hidden;
	}

	.avatar-host {
		width: 100%;
		min-height: 380px;
	}

	.control-card {
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
	}

	.control-card h2 {
		margin: 0 0 0.35rem;
		font-size: 1.0625rem;
	}

	.control-card p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.behavior-toggle {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.85rem;
	}

	.behavior-option {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		background: var(--bg-subtle);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.behavior-option input {
		accent-color: var(--accent);
	}

	.behavior-option.is-selected {
		border-color: rgba(92, 74, 224, 0.45);
		background: var(--accent-subtle);
		color: var(--accent);
	}

	.speak-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1rem;
		align-items: center;
	}

	.speak-input {
		flex: 1 1 16rem;
		min-width: 0;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font: inherit;
	}

	.speak-input:disabled {
		opacity: 0.55;
	}

	.btn {
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		padding: 0.55rem 0.9rem;
		background: var(--bg-elevated);
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.btn:hover:not(:disabled) {
		border-color: var(--accent);
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--accent-subtle);
		border-color: rgba(92, 74, 224, 0.45);
		color: var(--accent);
	}

	.demo-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
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

	.status-pill[data-tone='warn'] {
		background: var(--warn-bg);
		border-color: #fde68a;
		color: var(--warn);
	}

	.meta {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-top: 0.75rem;
	}

	.sidebar h2 {
		margin: 0 0 0.75rem;
		font-size: 1.0625rem;
	}

	.log-list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 480px;
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

	.log-list li[data-kind='speak'] {
		border-color: rgba(92, 74, 224, 0.25);
	}

	.log-list li[data-kind='end'] {
		border-color: rgba(13, 122, 95, 0.25);
		background: var(--good-bg);
	}

	.log-list li[data-kind='interrupt'] {
		border-color: #fecaca;
		background: #fef2f2;
		color: #b91c1c;
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
