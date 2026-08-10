<script lang="ts">
	/**
	 * Demo page shell — Connect/End UI, instructions copy, arm-then-start.
	 *
	 * Integration (copy into your product):
	 *   import { connectOpenAiRealtime } from '@liforma/client/openai';
	 */
	import { EXPERIENCE_ID, SUGGESTED_INSTRUCTIONS } from '$lib/config';
	import { DemoClientSecretError, fetchDemoClientSecret } from '$lib/demoClientSecret';
	import type { StartButtonOptions } from '@liforma/client';
	import {
		connectOpenAiRealtime,
		type OpenAiRealtimeBridge
	} from '@liforma/client/openai';
	import { Experience, type ExperienceHandle } from '@liforma/client/svelte';

	const OPENAI_API_KEYS_URL = 'https://platform.openai.com/api-keys';
	const OPENAI_API_KEY_MIN_LENGTH = 20;

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
	let cachedEphemeralKey = $state<string | null>(null);
	let bridge = $state<OpenAiRealtimeBridge | null>(null);

	let apiKey = $state('');
	let showApiKey = $state(false);
	let apiKeyHint = $state('');
	let statusText = $state('Loading…');
	let statusTone = $state<StatusTone>('default');
	let logs = $state<LogEntry[]>([
		{
			text: 'Developer tip: use connectOpenAiRealtime from @liforma/client/openai. Flow: Connect → Start experience.',
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

	function normalizeApiKey(raw: string): string {
		return raw
			.replace(/^Bearer\s+/i, '')
			.replace(/^["']|["']$/g, '')
			.replace(/[\u200B-\u200D\uFEFF]/g, '')
			.trim();
	}

	function clearArm(): void {
		armed = false;
		cachedEphemeralKey = null;
	}

	function updateApiKeyHint(): void {
		const key = normalizeApiKey(apiKey);
		if (!key) {
			apiKeyHint = '';
			return;
		}
		if (key.length < OPENAI_API_KEY_MIN_LENGTH) {
			apiKeyHint = `Key looks too short (${key.length} chars). Paste the full secret from the OpenAI dashboard.`;
			return;
		}
		if (!key.startsWith('sk-')) {
			apiKeyHint = 'OpenAI API keys usually start with sk-. Make sure you pasted the secret key.';
			return;
		}
		apiKeyHint = '';
	}

	function refreshStatus(): void {
		if (bridgeLive) {
			setStatus('Talking via OpenAI Realtime → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to OpenAI…', 'active');
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
			setStatus('Opening OpenAI Realtime…', 'active');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect OpenAI, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire OpenAI Realtime', 'active');
	}

	function handleConnectError(err: unknown): void {
		setStatus('OpenAI connect failed', 'warn');
		const message = err instanceof Error ? err.message : String(err);
		pushLog(message, 'warn', {
			href: OPENAI_API_KEYS_URL,
			label: 'Open API keys'
		});
		if (err instanceof DemoClientSecretError && err.status === 401) {
			pushLog('OpenAI rejected the API key (401). Create a new key and try again.', 'warn');
		}
	}

	async function openBridge(): Promise<void> {
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		connecting = true;
		refreshStatus();

		try {
			let ephemeralKey = cachedEphemeralKey;
			if (!ephemeralKey) {
				pushLog('Minting ephemeral Realtime client secret via local API…');
				ephemeralKey = await fetchDemoClientSecret(normalizeApiKey(apiKey));
				cachedEphemeralKey = ephemeralKey;
			}

			bridge = await connectOpenAiRealtime(experience, {
				ephemeralKey,
				instructions: SUGGESTED_INSTRUCTIONS,
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

	async function armOpenAi(): Promise<void> {
		if (bridgeLive || connecting || armed) return;

		const key = normalizeApiKey(apiKey);
		if (key && key.length < OPENAI_API_KEY_MIN_LENGTH) {
			updateApiKeyHint();
			pushLog(`API key looks too short (${key.length} chars).`, 'warn');
			return;
		}

		connecting = true;
		refreshStatus();

		try {
			cachedEphemeralKey = null;
			pushLog('Minting ephemeral Realtime client secret via local API…');
			cachedEphemeralKey = await fetchDemoClientSecret(key);
			pushLog('Ephemeral secret ready. OpenAI will open after you start the player.');

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

	async function endOpenAi(): Promise<void> {
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
			pushLog('Disconnected (cleared armed OpenAI connection).');
		}
		refreshStatus();
	}

	function showConnectFirstModal(): void {
		if (!connectDialogEl || connectDialogEl.open) return;
		connectDialogEl.showModal();
	}

	function handleReady(): void {
		refreshStatus();
		pushLog('Experience ready. Connect OpenAI, then tap Start experience on the avatar.');
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
			pushLog('Start before Connect — connect to OpenAI below to begin the conversation.');
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

	async function copyText(text: string, label: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			pushLog(`Copied ${label}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			pushLog(`Copy failed: ${message}`, 'warn');
		}
	}

	function onApiKeyInput(value: string): void {
		if (armed && !bridgeLive) {
			clearArm();
			pushLog('Credentials changed — click Connect again.', 'warn');
		}
		apiKey = value;
		updateApiKeyHint();
		refreshStatus();
	}
</script>

<div class="layout">
	<section class="workspace" aria-label="OpenAI Realtime embed">
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
			<h2>1. Suggested Realtime instructions</h2>
			<p>
				These instructions are applied when minting the ephemeral session (and again via
				<code>session.update</code> via <code>connectOpenAiRealtime</code>) so Anna matches the coffee-barista
				scenario.
			</p>

			<label class="field">
				<span class="field-label-row">
					<span>Instructions</span>
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => void copyText(SUGGESTED_INSTRUCTIONS, 'instructions')}
					>
						Copy
					</button>
				</span>
				<textarea class="text-input" readonly rows="12" value={SUGGESTED_INSTRUCTIONS}></textarea>
			</label>
		</div>

		<div class="control-card">
			<h2>2. Connect OpenAI, then start the player</h2>
			<p>
				Paste your <strong>OpenAI API key</strong>, click <strong>Connect</strong>, then tap
				<strong>Start experience</strong> on the avatar. This app’s API route mints an ephemeral
				Realtime client secret (demo-only — use a real backend in production).
			</p>

			<form
				class="credentials-form"
				onsubmit={(event) => {
					event.preventDefault();
					void armOpenAi();
				}}
			>
				<label class="field">
					<span class="field-label-row">
						<span>API key</span>
						<button
							type="button"
							class="btn btn-ghost"
							aria-pressed={showApiKey}
							onclick={() => (showApiKey = !showApiKey)}
						>
							{showApiKey ? 'Hide' : 'Show'}
						</button>
					</span>
					<input
						class="text-input"
						type={showApiKey ? 'text' : 'password'}
						placeholder="sk-… (or leave blank if OPENAI_API_KEY is set)"
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						disabled={fieldsDisabled}
						value={apiKey}
						oninput={(e) => onApiKeyInput(e.currentTarget.value)}
					/>
					<span class="field-note">Never stored in this browser. Prefer env OPENAI_API_KEY locally.</span>
				</label>

				{#if apiKeyHint}
					<p class="field-hint">
						{apiKeyHint}
						<a href={OPENAI_API_KEYS_URL} target="_blank" rel="noopener noreferrer">Open API keys</a>
					</p>
				{/if}

				<div class="actions">
					<button type="submit" class="btn btn-primary" disabled={connectDisabled}>
						{connectLabel}
					</button>
					<button type="button" class="btn" disabled={endDisabled} onclick={() => void endOpenAi()}>
						End
					</button>
				</div>
			</form>

			<p class="hint">
				This demo uses Realtime <strong>WebSocket</strong> so PCM + transcript map onto
				<code>createUtterance</code> (same pattern as ElevenLabs). For WebRTC, see the
				<a
					href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai"
					target="_blank"
					rel="noopener noreferrer">OpenAI BYO docs</a
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
		<h2 id="connect-first-title">Connect OpenAI</h2>
		<p>The experience will start after you connect to OpenAI Realtime below.</p>
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

	.field-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.field-note {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.field-hint {
		margin: -0.35rem 0 0.85rem;
		padding: 0.55rem 0.7rem;
		border-radius: var(--radius-sm);
		background: var(--warning-bg);
		border: 1px solid var(--warning-border);
		color: #92400e;
		font-size: 0.8125rem;
	}

	.text-input {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--text);
	}

	textarea.text-input {
		resize: vertical;
		line-height: 1.45;
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

	.btn-ghost {
		border-color: transparent;
		background: transparent;
		padding-inline: 0.5rem;
		color: var(--accent);
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
