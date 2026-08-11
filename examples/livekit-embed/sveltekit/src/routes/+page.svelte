<script lang="ts">
	/**
	 * Demo page shell — Connect/End UI, arm-then-start.
	 *
	 * Integration (copy into your product):
	 *   import { startByoSpeech } from '$lib/helloByo';
	 */
	import { DEFAULT_IDENTITY, DEFAULT_ROOM_NAME, EXPERIENCE_ID } from '$lib/config';
	import { DemoLiveKitTokenError, fetchDemoLiveKitToken, type DemoLiveKitToken } from '$lib/demoLiveKitToken';
	import { startByoSpeech } from '$lib/helloByo';
	import type { StartButtonOptions } from '@liforma/client';
	import type { LiveKitAgentBridge } from '@liforma/client/livekit';
	import { Experience, type ExperienceHandle } from '@liforma/client/svelte';

	const LIVEKIT_CLOUD_URL = 'https://cloud.livekit.io/';

	type StatusTone = 'default' | 'active' | 'warn';
	type LogKind = 'info' | 'warn';
	type LogEntry = {
		text: string;
		kind: LogKind;
		link?: { href: string; label: string };
	};

	let experience = $state<ExperienceHandle>();
	let sessionReady = $state(false);
	let armed = $state(false);
	let connecting = $state(false);
	let cachedCreds = $state<DemoLiveKitToken | null>(null);
	let bridge = $state<LiveKitAgentBridge | null>(null);

	let roomName = $state(DEFAULT_ROOM_NAME);
	let identity = $state(DEFAULT_IDENTITY);
	let statusText = $state('Loading…');
	let statusTone = $state<StatusTone>('default');
	let logs = $state<LogEntry[]>([
		{
			text: 'Developer tip: copy helloByo.ts (startByoSpeech) into your product. Flow: Connect → Start experience. An agent in the room (identity starting with "agent") must publish audio.',
			kind: 'info'
		}
	]);
	let connectDialogEl = $state<HTMLDialogElement | undefined>();

	const startButton: StartButtonOptions = {
		label: 'Start experience',
		ariaLabel: 'Start experience session and unlock audio',
		placement: 'bottom-center',
		variant: 'primary',
		appearance: {
			backgroundColor: '#0d7a5f',
			textColor: '#ffffff',
			borderRadiusPx: 999,
			size: 'large',
			shadow: 'soft'
		}
	};

	const bridgeLive = $derived(Boolean(bridge?.isConnected()));
	const connectLabel = $derived(
		connecting ? 'Connecting…' : armed && !bridgeLive ? 'Waiting for Start' : 'Connect'
	);
	const connectDisabled = $derived(connecting || bridgeLive || armed);
	const endDisabled = $derived(!(bridgeLive || armed || connecting));
	const fieldsDisabled = $derived(bridgeLive || armed || connecting);

	function setStatus(text: string, tone: StatusTone = 'default'): void {
		statusText = text;
		statusTone = tone;
	}

	function pushLog(
		text: string,
		kind: LogKind = 'info',
		link?: { href: string; label: string }
	): void {
		logs = [...logs, { text, kind, link }];
	}

	function clearArm(): void {
		armed = false;
		cachedCreds = null;
	}

	function refreshStatus(): void {
		if (bridgeLive) {
			setStatus('Talking via LiveKit → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to LiveKit…', 'active');
			return;
		}
		if (!experience) {
			setStatus('Loading experience…', 'active');
			return;
		}
		if (armed && !sessionReady) {
			setStatus('Connected — tap Start experience on the avatar', 'active');
			return;
		}
		if (armed && sessionReady) {
			setStatus('Joining LiveKit room…', 'active');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect LiveKit, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire LiveKit voice', 'active');
	}

	function handleConnectError(err: unknown): void {
		setStatus('LiveKit connect failed', 'warn');
		const message = err instanceof Error ? err.message : String(err);
		pushLog(message, 'warn', {
			href: LIVEKIT_CLOUD_URL,
			label: 'Open LiveKit Cloud'
		});
		if (err instanceof DemoLiveKitTokenError && err.status === 400) {
			pushLog(
				'Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET on the server.',
				'warn'
			);
		}
	}

	async function openBridge(): Promise<void> {
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		connecting = true;
		refreshStatus();

		try {
			let creds = cachedCreds;
			if (!creds) {
				pushLog('Minting LiveKit participant token via local API…');
				creds = await fetchDemoLiveKitToken({ roomName, identity });
				cachedCreds = creds;
			}

			bridge = await startByoSpeech(experience, {
				url: creds.url,
				token: creds.token,
				onLog: (line, kind) => pushLog(line, kind),
				onDisconnect: () => {
					bridge = null;
					clearArm();
					refreshStatus();
				},
				onError: (message) => pushLog(message, 'warn')
			});
		} catch (err) {
			bridge = null;
			clearArm();
			handleConnectError(err);
		} finally {
			connecting = false;
			refreshStatus();
		}
	}

	async function armLiveKit(): Promise<void> {
		if (bridgeLive || connecting || armed) return;

		connecting = true;
		refreshStatus();

		try {
			cachedCreds = null;
			pushLog('Minting LiveKit participant token via local API…');
			cachedCreds = await fetchDemoLiveKitToken({ roomName, identity });
			pushLog(
				`Token ready for room "${cachedCreds.roomName}" as "${cachedCreds.identity}". LiveKit will join after you start the player.`
			);

			armed = true;
			connecting = false;
			refreshStatus();

			if (sessionReady) {
				await openBridge();
			} else {
				pushLog('Armed. Tap Start experience on the avatar to unlock audio and begin.');
			}
		} catch (err) {
			connecting = false;
			clearArm();
			handleConnectError(err);
			refreshStatus();
		}
	}

	async function endLiveKit(): Promise<void> {
		const active = bridge;
		bridge = null;
		connecting = false;
		const wasArmed = armed;
		clearArm();
		refreshStatus();

		if (active) {
			try {
				await active.end();
			} catch (err) {
				console.error(err);
			}
			pushLog('Conversation ended');
		} else if (wasArmed) {
			pushLog('Disconnected (cleared armed LiveKit connection).');
		}
		refreshStatus();
	}

	function showConnectFirstModal(): void {
		if (!connectDialogEl || connectDialogEl.open) return;
		connectDialogEl.showModal();
	}

	function handleReady(): void {
		refreshStatus();
		pushLog('Experience ready. Connect LiveKit, then tap Start experience on the avatar.');
	}

	function handleStarted(): void {
		sessionReady = true;
		pushLog('Player unlocked.');
		refreshStatus();
		if (armed && !bridgeLive) {
			void openBridge();
			return;
		}
		if (!armed) {
			showConnectFirstModal();
			pushLog('Start before Connect — connect to LiveKit below to begin the conversation.');
		}
	}

	function handleStateUpdate(state: string): void {
		if (state === 'error') {
			setStatus('Experience error', 'warn');
		}
	}

	function handleError(error: Error): void {
		setStatus('Experience error', 'warn');
		pushLog(error.message, 'warn');
	}

	function onFieldChange(): void {
		if (armed && !bridgeLive) {
			clearArm();
			pushLog('Room settings changed — click Connect again.', 'warn');
		}
		refreshStatus();
	}
</script>

<div class="layout">
	<section class="workspace" aria-label="LiveKit embed">
		<div class="experience-panel">
			<div class="experience">
				<Experience
					bind:this={experience}
					experienceId={EXPERIENCE_ID}
					mode="presenter"
					speechInputMode="off"
					{startButton}
					onReady={handleReady}
					onStarted={handleStarted}
					onStateUpdate={handleStateUpdate}
					onError={handleError}
				/>
			</div>
		</div>

		<div class="control-card">
			<h2>1. Connect LiveKit, then start the player</h2>
			<p>
				Click <strong>Connect</strong> to mint a participant token (server env
				<code>LIVEKIT_URL</code> / <code>LIVEKIT_API_KEY</code> /
				<code>LIVEKIT_API_SECRET</code>), then tap <strong>Start experience</strong> on the
				avatar. An agent in the room (identity starting with <code>agent</code>) must publish
				audio for the avatar to lip-sync.
			</p>

			<form
				class="credentials-form"
				onsubmit={(event) => {
					event.preventDefault();
					void armLiveKit();
				}}
			>
				<label class="field">
					<span>Room name</span>
					<input
						class="text-input"
						type="text"
						placeholder={DEFAULT_ROOM_NAME}
						autocomplete="off"
						disabled={fieldsDisabled}
						bind:value={roomName}
						oninput={() => onFieldChange()}
					/>
				</label>

				<label class="field">
					<span>Participant identity</span>
					<input
						class="text-input"
						type="text"
						placeholder={DEFAULT_IDENTITY}
						autocomplete="off"
						disabled={fieldsDisabled}
						bind:value={identity}
						oninput={() => onFieldChange()}
					/>
					<span class="field-note"
						>Secrets stay on the server. Do not also attach the remote track to an
						<code>&lt;audio&gt;</code> element.</span
					>
				</label>

				<div class="actions">
					<button type="submit" class="btn btn-primary" disabled={connectDisabled}>
						{connectLabel}
					</button>
					<button type="button" class="btn" disabled={endDisabled} onclick={() => void endLiveKit()}>
						End
					</button>
				</div>
			</form>

			<p class="hint">
				This is bring-your-own LiveKit voice — not Liforma’s future
				<code>transport: livekit</code> adapter. See the
				<a
					href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit"
					target="_blank"
					rel="noopener noreferrer">LiveKit BYO docs</a
				>.
			</p>

			<p class="meta">
				<span class="status-pill" data-tone={statusTone}>{statusText}</span>
				· Experience: <code>{EXPERIENCE_ID}</code>
			</p>
		</div>
	</section>

	<aside class="sidebar" aria-label="Session log">
		<h2>Session log</h2>
		<ul class="log-list">
			{#each logs as entry, i (i)}
				<li data-kind={entry.kind === 'warn' ? 'warn' : undefined}>
					{entry.text}
					{#if entry.link}
						<button
							type="button"
							class="log-link"
							onclick={() => window.open(entry.link!.href, '_blank', 'noopener,noreferrer')}
						>
							{entry.link.label}
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	</aside>
</div>

<dialog bind:this={connectDialogEl} class="connect-dialog" aria-labelledby="connect-first-title">
	<form method="dialog" class="connect-dialog-body">
		<h2 id="connect-first-title">Connect LiveKit</h2>
		<p>The experience will start after you connect to LiveKit below.</p>
		<button type="submit" class="btn btn-primary" value="ok">OK</button>
	</form>
</dialog>

<style>
	.layout {
		flex: 1;
		max-width: 1080px;
		width: 100%;
		margin: 0 auto;
		padding: 1.5rem;
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
		overflow: hidden;
		background: #030508;
		min-height: 420px;
	}

	.experience {
		min-height: 420px;
		display: flex;
		flex-direction: column;
	}

	.experience :global(.liforma-experience-shell) {
		flex: 1;
		min-height: 420px;
		width: 100%;
	}

	.control-card {
		padding: 1.15rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
	}

	.control-card h2 {
		margin: 0 0 0.5rem;
		font-size: 1.0625rem;
	}

	.control-card > p {
		margin: 0 0 1rem;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.85rem;
		font-size: 0.875rem;
	}

	.field-note {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.text-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.btn {
		appearance: none;
		border: 1px solid var(--border-strong);
		background: var(--bg-elevated);
		color: var(--text);
		border-radius: 999px;
		padding: 0.45rem 0.95rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}

	.hint {
		margin: 1rem 0 0;
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.meta {
		margin: 0.85rem 0 0;
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.status-pill {
		display: inline-block;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--bg-subtle);
		font-weight: 500;
	}

	.status-pill[data-tone='active'] {
		background: var(--accent-subtle);
		color: var(--accent-hover);
	}

	.status-pill[data-tone='warn'] {
		background: var(--warning-bg);
		color: #92400e;
	}

	.sidebar {
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg-elevated);
		min-height: 280px;
		max-height: min(70dvh, 640px);
		display: flex;
		flex-direction: column;
	}

	.sidebar h2 {
		margin: 0 0 0.75rem;
		font-size: 1.0625rem;
	}

	.log-list {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow: auto;
		flex: 1;
		font-size: 0.8125rem;
		line-height: 1.45;
	}

	.log-list li {
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--border);
		color: var(--text-muted);
		word-break: break-word;
	}

	.log-list li[data-kind='warn'] {
		color: #92400e;
	}

	.log-link {
		appearance: none;
		border: 0;
		background: none;
		padding: 0;
		margin: 0 0 0 0.25rem;
		color: var(--accent);
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	.connect-dialog {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0;
		max-width: min(22rem, calc(100vw - 2rem));
		box-shadow: 0 16px 40px rgba(20, 32, 26, 0.18);
		color: var(--text);
		background: var(--bg-elevated);
	}

	.connect-dialog::backdrop {
		background: rgba(20, 32, 26, 0.45);
	}

	.connect-dialog-body {
		margin: 0;
		padding: 1.25rem 1.35rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.connect-dialog-body h2 {
		margin: 0;
		font-size: 1.125rem;
		letter-spacing: -0.02em;
	}

	.connect-dialog-body p {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.connect-dialog-body .btn {
		align-self: flex-end;
		margin-top: 0.25rem;
	}

	@media (max-width: 860px) {
		.layout {
			grid-template-columns: 1fr;
		}

		.sidebar {
			max-height: 280px;
		}
	}
</style>
