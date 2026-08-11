<script lang="ts">
	/**
	 * Demo page shell — Connect/End UI, agent prompt copy fields, arm-then-start.
	 *
	 * Integration (copy into your product):
	 *   import { startByoSpeech } from '$lib/helloByo';
	 */
	import { loadAgentId, saveAgentId } from '$lib/agentIdStore';
	import {
		EXPERIENCE_ID,
		SUGGESTED_FIRST_MESSAGE,
		SUGGESTED_SYSTEM_PROMPT
	} from '$lib/config';
	import { DemoSignedUrlError, fetchDemoSignedUrl } from '$lib/demoSignedUrl';
	import { startByoSpeech } from '$lib/helloByo';
	import type { StartButtonOptions } from '@liforma/client';
	import type { ElevenLabsAgentBridge } from '@liforma/client/elevenlabs';
	import { Experience, type ExperienceHandle } from '@liforma/client/svelte';
	import { onMount } from 'svelte';

	const ELEVENLABS_API_KEY_MIN_LENGTH = 20;
	const ELEVENLABS_API_KEYS_URL = 'https://elevenlabs.io/app/settings/api-keys';

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
	let cachedSignedUrl = $state<string | null>(null);
	let bridge = $state<ElevenLabsAgentBridge | null>(null);

	let agentId = $state('');
	let apiKey = $state('');
	let showApiKey = $state(false);
	let apiKeyHint = $state('');
	let apiKeyHintLinkLabel = $state('');
	let statusText = $state('Loading…');
	let statusTone = $state<StatusTone>('default');
	let logs = $state<LogEntry[]>([
		{
			text: 'Developer tip: copy helloByo.ts (startByoSpeech) into your product. Flow: Connect → Start experience.',
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
	const hasCredentials = $derived(Boolean(agentId.trim()));
	const connectLabel = $derived(
		connecting ? 'Connecting…' : armed && !bridgeLive ? 'Waiting for Start' : 'Connect'
	);
	const connectDisabled = $derived(
		connecting || bridgeLive || armed || !hasCredentials
	);
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
		cachedSignedUrl = null;
	}

	function clearApiKeyHint(): void {
		apiKeyHint = '';
		apiKeyHintLinkLabel = '';
	}

	function showKeyHintWithLink(message: string, linkLabel: string): void {
		apiKeyHint = message;
		apiKeyHintLinkLabel = linkLabel;
		pushLog(message, 'warn', { href: ELEVENLABS_API_KEYS_URL, label: linkLabel });
	}

	function updateApiKeyHint(): void {
		const key = normalizeApiKey(apiKey);
		if (!key) {
			clearApiKeyHint();
			return;
		}
		if (key.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
			apiKeyHint = `Key looks too short (${key.length} chars). Re-copy the full secret from Create Key (dashboard only shows •••• + last 4 later).`;
			apiKeyHintLinkLabel = '';
			return;
		}
		if (!key.startsWith('sk_')) {
			apiKeyHint =
				'ElevenLabs API keys usually start with sk_. Make sure you pasted the API key, not the Agent ID.';
			apiKeyHintLinkLabel = '';
			return;
		}
		clearApiKeyHint();
	}

	function refreshStatus(): void {
		if (bridgeLive) {
			setStatus('Talking via ElevenLabs → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to ElevenLabs…', 'active');
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
			setStatus('Opening ElevenLabs…', 'active');
			return;
		}
		if (!hasCredentials) {
			setStatus('Enter Agent ID (and API key if private), then Connect', 'default');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect ElevenLabs, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire ElevenLabs', 'active');
	}

	function handleConnectError(err: unknown): void {
		const code =
			err instanceof DemoSignedUrlError
				? err.code
				: err instanceof Error
					? err.message
					: '';
		const keyMeta = err instanceof DemoSignedUrlError ? err.keyMeta : null;

		setStatus('ElevenLabs connect failed', 'warn');

		if (code === 'elevenlabs_agents_permission') {
			showKeyHintWithLink(
				'ElevenLabs denied this key for Agents (permission error). Signed-URL minting needs "Eleven Agents" → Write (Read alone is not enough). Save changes, then try again.',
				'Click here to edit the key, toggle "Eleven Agents" to "Write" and click "Save changes".'
			);
			return;
		}
		if (code === 'elevenlabs_invalid_api_key') {
			const suffix = keyMeta?.suffix ? `••••${keyMeta.suffix}` : '••••????';
			const length = typeof keyMeta?.length === 'number' ? String(keyMeta.length) : '?';
			showKeyHintWithLink(
				`ElevenLabs rejected the API key value itself (invalid_api_key). The proxy received a ${length}-character key ending ${suffix} — that last-4 must match the dashboard. Re-create the key, copy the full sk_… once, paste it here, and ensure Eleven Agents is enabled.`,
				'Click here to create/edit an API key.'
			);
			return;
		}
		const message = err instanceof Error ? err.message : String(err);
		pushLog(message, 'warn');
	}

	async function openBridge(): Promise<void> {
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		const id = agentId.trim();
		const key = normalizeApiKey(apiKey);
		if (!id) {
			clearArm();
			pushLog('Enter your ElevenLabs Agent ID.', 'warn');
			refreshStatus();
			return;
		}

		connecting = true;
		refreshStatus();

		try {
			let signedUrl = cachedSignedUrl;
			if (!signedUrl && key) {
				pushLog('Requesting signed URL via local API…');
				signedUrl = await fetchDemoSignedUrl(id, key);
				cachedSignedUrl = signedUrl;
			}

			bridge = await startByoSpeech(experience, {
				agentId: signedUrl ? undefined : id,
				signedUrl: signedUrl ?? undefined,
				onLog: (line, kind) => pushLog(line, kind),
				onDisconnect: () => {
					bridge = null;
					clearArm();
					refreshStatus();
				}
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

	async function armElevenLabs(): Promise<void> {
		if (bridgeLive || connecting || armed) return;

		const id = agentId.trim();
		const key = normalizeApiKey(apiKey);
		if (!id) {
			pushLog('Enter your ElevenLabs Agent ID.', 'warn');
			return;
		}
		void saveAgentId(id);
		if (key && key.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
			updateApiKeyHint();
			pushLog(`API key looks too short (${key.length} chars).`, 'warn');
			return;
		}

		connecting = true;
		refreshStatus();

		try {
			cachedSignedUrl = null;
			if (key) {
				pushLog('Requesting signed URL via local API…');
				cachedSignedUrl = await fetchDemoSignedUrl(id, key);
				pushLog('Signed URL ready. ElevenLabs will open after you start the player.');
			} else {
				pushLog('No API key — will connect as public agent with agentId only.');
			}

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

	async function endElevenLabs(): Promise<void> {
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
			pushLog('Disconnected (cleared armed ElevenLabs connection).');
		}
		refreshStatus();
	}

	function showConnectFirstModal(): void {
		if (!connectDialogEl || connectDialogEl.open) return;
		connectDialogEl.showModal();
	}

	function handleReady(): void {
		refreshStatus();
		pushLog('Experience ready. Connect ElevenLabs, then tap Start experience on the avatar.');
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
			pushLog(
				'Start before Connect — connect to ElevenLabs below to begin the conversation.'
			);
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

	function onAgentIdInput(value: string): void {
		if (armed && !bridgeLive) {
			clearArm();
			pushLog('Credentials changed — click Connect again.', 'warn');
		}
		agentId = value;
		void saveAgentId(value);
		refreshStatus();
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

	onMount(() => {
		void loadAgentId().then((saved) => {
			if (!saved) return;
			agentId = saved;
			pushLog('Restored Agent ID from this browser (API key is never stored).');
			refreshStatus();
		});
	});
</script>

<div class="layout">
	<section class="workspace" aria-label="ElevenLabs embed">
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
					onPlayerStatusChange={handleStateUpdate}
					onError={handleError}
				/>
			</div>
		</div>

		<div class="control-card">
			<h2>1. Create a matching ElevenLabs agent</h2>
			<p>
				In
				<a href="https://elevenlabs.io/app/agents" target="_blank" rel="noopener noreferrer"
					>ElevenLabs Agents</a
				>, create an agent and paste these values so Anna matches the coffee-barista scenario.
			</p>

			<label class="field">
				<span class="field-label-row">
					<span>First message</span>
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => void copyText(SUGGESTED_FIRST_MESSAGE, 'first message')}
					>
						Copy
					</button>
				</span>
				<textarea
					class="text-input text-area-short"
					readonly
					rows="2"
					value={SUGGESTED_FIRST_MESSAGE}
				></textarea>
			</label>

			<label class="field">
				<span class="field-label-row">
					<span>System prompt</span>
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => void copyText(SUGGESTED_SYSTEM_PROMPT, 'system prompt')}
					>
						Copy
					</button>
				</span>
				<textarea
					class="text-input"
					readonly
					rows="12"
					value={SUGGESTED_SYSTEM_PROMPT}
				></textarea>
			</label>
		</div>

		<div class="control-card">
			<h2>2. Connect ElevenLabs, then start the player</h2>
			<p>
				Paste your <strong>Agent ID</strong> and <strong>API key</strong>, click
				<strong>Connect</strong>, then tap <strong>Start experience</strong> on the avatar. This
				app’s API route mints a signed URL (demo-only — use a real backend in production).
			</p>

			<form
				class="credentials-form"
				onsubmit={(event) => {
					event.preventDefault();
					void armElevenLabs();
				}}
			>
				<label class="field">
					<span>Agent ID</span>
					<input
						class="text-input"
						placeholder="agent_…"
						autocomplete="off"
						spellcheck="false"
						disabled={fieldsDisabled}
						value={agentId}
						oninput={(e) => onAgentIdInput(e.currentTarget.value)}
					/>
					<span class="field-note">Saved in this browser only. API key is never stored.</span>
				</label>

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
						placeholder="sk_… full secret from Create Key"
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						disabled={fieldsDisabled}
						value={apiKey}
						oninput={(e) => onApiKeyInput(e.currentTarget.value)}
					/>
				</label>

				{#if apiKeyHint}
					<p class="field-hint">
						{apiKeyHint}
						{#if apiKeyHintLinkLabel}
							<a href={ELEVENLABS_API_KEYS_URL} target="_blank" rel="noopener noreferrer"
								>{apiKeyHintLinkLabel}</a
							>
						{/if}
					</p>
				{/if}

				<div class="actions">
					<button type="submit" class="btn btn-primary" disabled={connectDisabled}>
						{connectLabel}
					</button>
					<button
						type="button"
						class="btn"
						disabled={endDisabled}
						onclick={() => void endElevenLabs()}
					>
						End
					</button>
				</div>
			</form>

			<p class="hint">
				Leave API key blank only for <strong>public</strong> agents. Private agents need a signed
				URL. If you get <strong>401</strong>,
				<a href={ELEVENLABS_API_KEYS_URL} target="_blank" rel="noopener noreferrer"
					>open the key → Edit</a
				>
				and set <strong>ElevenAgents → Write</strong>.
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
							onclick={() =>
								window.open(entry.link!.href, '_blank', 'noopener,noreferrer')}
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
		<h2 id="connect-first-title">Connect ElevenLabs</h2>
		<p>The experience will start after you connect to ElevenLabs below.</p>
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

	.text-area-short {
		min-height: 3.25rem;
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
