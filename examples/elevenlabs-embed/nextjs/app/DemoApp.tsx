'use client';

/**
 * Demo page shell — Connect/End UI, agent prompt copy fields, arm-then-start.
 *
 * Integration (copy into your product):
 *   import { connectElevenLabsAgent } from '@liforma/client/elevenlabs';
 */
import type { StartButtonOptions } from '@liforma/client';
import {
	connectElevenLabsAgent,
	type ElevenLabsAgentBridge
} from '@liforma/client/elevenlabs';
import { Experience, type ExperienceHandle } from '@liforma/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { loadAgentId, saveAgentId } from '@/lib/agentIdStore';
import {
	EXPERIENCE_ID,
	SUGGESTED_FIRST_MESSAGE,
	SUGGESTED_SYSTEM_PROMPT
} from '@/lib/config';
import { DemoSignedUrlError, fetchDemoSignedUrl } from '@/lib/demoSignedUrl';

import './demo.css';

const ELEVENLABS_API_KEY_MIN_LENGTH = 20;
const ELEVENLABS_API_KEYS_URL = 'https://elevenlabs.io/app/settings/api-keys';

type StatusTone = 'default' | 'active' | 'warn';
type LogKind = 'info' | 'warn';
type LogEntry = {
	text: string;
	kind: LogKind;
	link?: { href: string; label: string };
};

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

function normalizeApiKey(raw: string): string {
	return raw
		.replace(/^Bearer\s+/i, '')
		.replace(/^["']|["']$/g, '')
		.replace(/[\u200B-\u200D\uFEFF]/g, '')
		.trim();
}

export default function DemoApp() {
	const experienceRef = useRef<ExperienceHandle | null>(null);
	const connectDialogRef = useRef<HTMLDialogElement>(null);

	const [sessionReady, setSessionReady] = useState(false);
	const [armed, setArmed] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [cachedSignedUrl, setCachedSignedUrl] = useState<string | null>(null);
	const [bridge, setBridge] = useState<ElevenLabsAgentBridge | null>(null);
	const [agentId, setAgentId] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [showApiKey, setShowApiKey] = useState(false);
	const [apiKeyHint, setApiKeyHint] = useState('');
	const [apiKeyHintLinkLabel, setApiKeyHintLinkLabel] = useState('');
	const [statusText, setStatusText] = useState('Loading…');
	const [statusTone, setStatusTone] = useState<StatusTone>('default');
	const [logs, setLogs] = useState<LogEntry[]>([
		{
			text: 'Developer tip: use connectElevenLabsAgent from @liforma/client/elevenlabs. Flow: Connect → Start experience.',
			kind: 'info'
		}
	]);

	const bridgeLive = Boolean(bridge?.isConnected());
	const hasCredentials = Boolean(agentId.trim());
	const connectLabel = connecting
		? 'Connecting…'
		: armed && !bridgeLive
			? 'Waiting for Start'
			: 'Connect';
	const connectDisabled = connecting || bridgeLive || armed || !hasCredentials;
	const endDisabled = !(bridgeLive || armed || connecting);
	const fieldsDisabled = bridgeLive || armed || connecting;

	const setStatus = useCallback((text: string, tone: StatusTone = 'default') => {
		setStatusText(text);
		setStatusTone(tone);
	}, []);

	const pushLog = useCallback(
		(text: string, kind: LogKind = 'info', link?: { href: string; label: string }) => {
			setLogs((prev) => [...prev, { text, kind, link }]);
		},
		[]
	);

	const clearArm = useCallback(() => {
		setArmed(false);
		setCachedSignedUrl(null);
	}, []);

	const clearApiKeyHint = useCallback(() => {
		setApiKeyHint('');
		setApiKeyHintLinkLabel('');
	}, []);

	const showKeyHintWithLink = useCallback(
		(message: string, linkLabel: string) => {
			setApiKeyHint(message);
			setApiKeyHintLinkLabel(linkLabel);
			pushLog(message, 'warn', { href: ELEVENLABS_API_KEYS_URL, label: linkLabel });
		},
		[pushLog]
	);

	const updateApiKeyHint = useCallback(
		(key: string) => {
			if (!key) {
				clearApiKeyHint();
				return;
			}
			if (key.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
				setApiKeyHint(
					`Key looks too short (${key.length} chars). Re-copy the full secret from Create Key (dashboard only shows •••• + last 4 later).`
				);
				setApiKeyHintLinkLabel('');
				return;
			}
			if (!key.startsWith('sk_')) {
				setApiKeyHint(
					'ElevenLabs API keys usually start with sk_. Make sure you pasted the API key, not the Agent ID.'
				);
				setApiKeyHintLinkLabel('');
				return;
			}
			clearApiKeyHint();
		},
		[clearApiKeyHint]
	);

	const refreshStatus = useCallback(() => {
		if (bridgeLive) {
			setStatus('Talking via ElevenLabs → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to ElevenLabs…', 'active');
			return;
		}
		if (!experienceRef.current) {
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
	}, [armed, bridgeLive, connecting, hasCredentials, sessionReady, setStatus]);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	const handleConnectError = useCallback(
		(err: unknown) => {
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
		},
		[pushLog, setStatus, showKeyHintWithLink]
	);

	const openBridge = useCallback(async () => {
		const experience = experienceRef.current;
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		const id = agentId.trim();
		const key = normalizeApiKey(apiKey);
		if (!id) {
			clearArm();
			pushLog('Enter your ElevenLabs Agent ID.', 'warn');
			return;
		}

		setConnecting(true);

		try {
			let signedUrl = cachedSignedUrl;
			if (!signedUrl && key) {
				pushLog('Requesting signed URL via local API…');
				signedUrl = await fetchDemoSignedUrl(id, key);
				setCachedSignedUrl(signedUrl);
			}

			const nextBridge = await connectElevenLabsAgent(experience, {
				agentId: signedUrl ? undefined : id,
				signedUrl: signedUrl ?? undefined,
				onLog: (line, kind) => pushLog(line, kind),
				onDisconnect: () => {
					setBridge(null);
					clearArm();
				}
			});
			setBridge(nextBridge);
		} catch (err) {
			setBridge(null);
			clearArm();
			handleConnectError(err);
		} finally {
			setConnecting(false);
		}
	}, [
		agentId,
		apiKey,
		armed,
		bridgeLive,
		cachedSignedUrl,
		clearArm,
		connecting,
		handleConnectError,
		pushLog,
		sessionReady
	]);

	const armElevenLabs = useCallback(async () => {
		if (bridgeLive || connecting || armed) return;

		const id = agentId.trim();
		const key = normalizeApiKey(apiKey);
		if (!id) {
			pushLog('Enter your ElevenLabs Agent ID.', 'warn');
			return;
		}
		void saveAgentId(id);
		if (key && key.length < ELEVENLABS_API_KEY_MIN_LENGTH) {
			updateApiKeyHint(key);
			pushLog(`API key looks too short (${key.length} chars).`, 'warn');
			return;
		}

		setConnecting(true);

		try {
			setCachedSignedUrl(null);
			if (key) {
				pushLog('Requesting signed URL via local API…');
				const signedUrl = await fetchDemoSignedUrl(id, key);
				setCachedSignedUrl(signedUrl);
				pushLog('Signed URL ready. ElevenLabs will open after you start the player.');
			} else {
				pushLog('No API key — will connect as public agent with agentId only.');
			}

			setArmed(true);
			setConnecting(false);

			if (sessionReady) {
				await openBridge();
			} else {
				pushLog('Armed. Tap Start experience on the avatar to unlock audio and begin.');
			}
		} catch (err) {
			setConnecting(false);
			clearArm();
			handleConnectError(err);
		}
	}, [
		agentId,
		apiKey,
		armed,
		bridgeLive,
		clearArm,
		connecting,
		handleConnectError,
		openBridge,
		pushLog,
		sessionReady,
		updateApiKeyHint
	]);

	const endElevenLabs = useCallback(async () => {
		const active = bridge;
		setBridge(null);
		setConnecting(false);
		const wasArmed = armed;
		clearArm();

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
	}, [armed, bridge, clearArm, pushLog]);

	const showConnectFirstModal = useCallback(() => {
		const dialog = connectDialogRef.current;
		if (!dialog || dialog.open) return;
		dialog.showModal();
	}, []);

	const handleReady = useCallback(() => {
		pushLog('Experience ready. Connect ElevenLabs, then tap Start experience on the avatar.');
	}, [pushLog]);

	const handleStarted = useCallback(() => {
		setSessionReady(true);
		pushLog('Player unlocked.');
		if (armed && !bridgeLive) {
			void openBridge();
			return;
		}
		if (!armed) {
			showConnectFirstModal();
			pushLog('Start before Connect — connect to ElevenLabs below to begin the conversation.');
		}
	}, [armed, bridgeLive, openBridge, pushLog, showConnectFirstModal]);

	const copyText = useCallback(
		async (text: string, label: string) => {
			try {
				await navigator.clipboard.writeText(text);
				pushLog(`Copied ${label}`);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				pushLog(`Copy failed: ${message}`, 'warn');
			}
		},
		[pushLog]
	);

	const onAgentIdInput = useCallback(
		(value: string) => {
			if (armed && !bridgeLive) {
				clearArm();
				pushLog('Credentials changed — click Connect again.', 'warn');
			}
			setAgentId(value);
			void saveAgentId(value);
		},
		[armed, bridgeLive, clearArm, pushLog]
	);

	const onApiKeyInput = useCallback(
		(value: string) => {
			if (armed && !bridgeLive) {
				clearArm();
				pushLog('Credentials changed — click Connect again.', 'warn');
			}
			setApiKey(value);
			updateApiKeyHint(normalizeApiKey(value));
		},
		[armed, bridgeLive, clearArm, pushLog, updateApiKeyHint]
	);

	useEffect(() => {
		void loadAgentId().then((saved) => {
			if (!saved) return;
			setAgentId(saved);
			pushLog('Restored Agent ID from this browser (API key is never stored).');
		});
	}, [pushLog]);

	return (
		<>
			<div className="demo-layout">
				<section className="demo-workspace" aria-label="ElevenLabs embed">
					<div className="demo-experience-panel">
						<div className="demo-experience">
							<Experience
								ref={experienceRef}
								experienceId={EXPERIENCE_ID}
								mode="presenter"
								speechInputMode="off"
								startButton={startButton}
								onReady={handleReady}
								onStarted={handleStarted}
								onStateUpdate={(state) => {
									if (state === 'error') setStatus('Experience error', 'warn');
								}}
								onError={(error) => {
									setStatus('Experience error', 'warn');
									pushLog(error.message, 'warn');
								}}
							/>
						</div>
					</div>

					<div className="demo-control-card">
						<h2>1. Create a matching ElevenLabs agent</h2>
						<p>
							In{' '}
							<a
								href="https://elevenlabs.io/app/agents"
								target="_blank"
								rel="noopener noreferrer"
							>
								ElevenLabs Agents
							</a>
							, create an agent and paste these values so Anna matches the coffee-barista
							scenario.
						</p>

						<label className="demo-field">
							<span className="demo-field-label-row">
								<span>First message</span>
								<button
									type="button"
									className="demo-btn demo-btn-ghost"
									onClick={() => void copyText(SUGGESTED_FIRST_MESSAGE, 'first message')}
								>
									Copy
								</button>
							</span>
							<textarea
								className="demo-text-input demo-text-area-short"
								readOnly
								rows={2}
								value={SUGGESTED_FIRST_MESSAGE}
							/>
						</label>

						<label className="demo-field">
							<span className="demo-field-label-row">
								<span>System prompt</span>
								<button
									type="button"
									className="demo-btn demo-btn-ghost"
									onClick={() => void copyText(SUGGESTED_SYSTEM_PROMPT, 'system prompt')}
								>
									Copy
								</button>
							</span>
							<textarea
								className="demo-text-input"
								readOnly
								rows={12}
								value={SUGGESTED_SYSTEM_PROMPT}
							/>
						</label>
					</div>

					<div className="demo-control-card">
						<h2>2. Connect ElevenLabs, then start the player</h2>
						<p>
							Paste your <strong>Agent ID</strong> and <strong>API key</strong>, click{' '}
							<strong>Connect</strong>, then tap <strong>Start experience</strong> on the avatar.
							This app&apos;s API route mints a signed URL (demo-only — use a real backend in
							production).
						</p>

						<form
							className="credentials-form"
							onSubmit={(event) => {
								event.preventDefault();
								void armElevenLabs();
							}}
						>
							<label className="demo-field">
								<span>Agent ID</span>
								<input
									className="demo-text-input"
									placeholder="agent_…"
									autoComplete="off"
									spellCheck={false}
									disabled={fieldsDisabled}
									value={agentId}
									onChange={(e) => onAgentIdInput(e.target.value)}
								/>
								<span className="demo-field-note">
									Saved in this browser only. API key is never stored.
								</span>
							</label>

							<label className="demo-field">
								<span className="demo-field-label-row">
									<span>API key</span>
									<button
										type="button"
										className="demo-btn demo-btn-ghost"
										aria-pressed={showApiKey}
										onClick={() => setShowApiKey((v) => !v)}
									>
										{showApiKey ? 'Hide' : 'Show'}
									</button>
								</span>
								<input
									className="demo-text-input"
									type={showApiKey ? 'text' : 'password'}
									placeholder="sk_… full secret from Create Key"
									autoComplete="off"
									autoCapitalize="off"
									spellCheck={false}
									disabled={fieldsDisabled}
									value={apiKey}
									onChange={(e) => onApiKeyInput(e.target.value)}
								/>
							</label>

							{apiKeyHint ? (
								<p className="demo-field-hint">
									{apiKeyHint}
									{apiKeyHintLinkLabel ? (
										<>
											{' '}
											<a
												href={ELEVENLABS_API_KEYS_URL}
												target="_blank"
												rel="noopener noreferrer"
											>
												{apiKeyHintLinkLabel}
											</a>
										</>
									) : null}
								</p>
							) : null}

							<div className="demo-actions">
								<button
									type="submit"
									className="demo-btn demo-btn-primary"
									disabled={connectDisabled}
								>
									{connectLabel}
								</button>
								<button
									type="button"
									className="demo-btn"
									disabled={endDisabled}
									onClick={() => void endElevenLabs()}
								>
									End
								</button>
							</div>
						</form>

						<p className="demo-hint">
							Leave API key blank only for <strong>public</strong> agents. Private agents need a
							signed URL. If you get <strong>401</strong>,{' '}
							<a href={ELEVENLABS_API_KEYS_URL} target="_blank" rel="noopener noreferrer">
								open the key → Edit
							</a>{' '}
							and set <strong>ElevenAgents → Write</strong>.
						</p>

						<p className="demo-meta">
							<span className="demo-status-pill" data-tone={statusTone}>
								{statusText}
							</span>
							{' '}
							· Experience: <code>{EXPERIENCE_ID}</code>
						</p>
					</div>
				</section>

				<aside className="demo-sidebar" aria-label="Session log">
					<h2>Session log</h2>
					<ul className="demo-log-list">
						{logs.map((entry, i) => (
							<li key={i} data-kind={entry.kind === 'warn' ? 'warn' : undefined}>
								{entry.text}
								{entry.link ? (
									<button
										type="button"
										className="demo-log-link"
										onClick={() =>
											window.open(entry.link!.href, '_blank', 'noopener,noreferrer')
										}
									>
										{entry.link.label}
									</button>
								) : null}
							</li>
						))}
					</ul>
				</aside>
			</div>

			<dialog
				ref={connectDialogRef}
				className="demo-connect-dialog"
				aria-labelledby="connect-first-title"
			>
				<form method="dialog" className="demo-connect-dialog-body">
					<h2 id="connect-first-title">Connect ElevenLabs</h2>
					<p>The experience will start after you connect to ElevenLabs below.</p>
					<button type="submit" className="demo-btn demo-btn-primary" value="ok">
						OK
					</button>
				</form>
			</dialog>
		</>
	);
}
