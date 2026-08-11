

/**
 * Demo page shell — Connect/End UI, instructions copy, arm-then-start.
 * Integration: copy `src/lib/helloByo.ts` into your product.
 */
import type { StartButtonOptions } from '@liforma/client';
import type { OpenAiRealtimeBridge } from '@liforma/client/openai';
import { Experience, type ExperienceHandle } from '@liforma/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EXPERIENCE_ID, SUGGESTED_INSTRUCTIONS } from './lib/config';
import { DemoClientSecretError, fetchDemoClientSecret } from './lib/demoClientSecret';
import { startByoSpeech } from './lib/helloByo';

import './styles/demo.css';

const OPENAI_API_KEYS_URL = 'https://platform.openai.com/api-keys';
const OPENAI_API_KEY_MIN_LENGTH = 20;

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
	const [cachedEphemeralKey, setCachedEphemeralKey] = useState<string | null>(null);
	const [bridge, setBridge] = useState<OpenAiRealtimeBridge | null>(null);
	const [apiKey, setApiKey] = useState('');
	const [showApiKey, setShowApiKey] = useState(false);
	const [apiKeyHint, setApiKeyHint] = useState('');
	const [statusText, setStatusText] = useState('Loading…');
	const [statusTone, setStatusTone] = useState<StatusTone>('default');
	const [logs, setLogs] = useState<LogEntry[]>([
		{
			text: 'Developer tip: copy helloByo.ts (startByoSpeech). Flow: Connect → Start experience.',
			kind: 'info'
		}
	]);

	const bridgeLive = Boolean(bridge?.isConnected());
	const connectLabel = connecting
		? 'Connecting…'
		: armed && !bridgeLive
			? 'Waiting for Start'
			: 'Connect';
	const connectDisabled = connecting || bridgeLive || armed;
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
		setCachedEphemeralKey(null);
	}, []);

	const updateApiKeyHint = useCallback((key: string) => {
		if (!key) {
			setApiKeyHint('');
			return;
		}
		if (key.length < OPENAI_API_KEY_MIN_LENGTH) {
			setApiKeyHint(
				`Key looks too short (${key.length} chars). Paste the full secret from the OpenAI dashboard.`
			);
			return;
		}
		if (!key.startsWith('sk-')) {
			setApiKeyHint('OpenAI API keys usually start with sk-. Make sure you pasted the secret key.');
			return;
		}
		setApiKeyHint('');
	}, []);

	const refreshStatus = useCallback(() => {
		if (bridgeLive) {
			setStatus('Talking via OpenAI Realtime → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to OpenAI…', 'active');
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
			setStatus('Opening OpenAI Realtime…', 'active');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect OpenAI, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire OpenAI Realtime', 'active');
	}, [armed, bridgeLive, connecting, sessionReady, setStatus]);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	const handleConnectError = useCallback(
		(err: unknown) => {
			setStatus('OpenAI connect failed', 'warn');
			const message = err instanceof Error ? err.message : String(err);
			pushLog(message, 'warn', {
				href: OPENAI_API_KEYS_URL,
				label: 'Open API keys'
			});
			if (err instanceof DemoClientSecretError && err.status === 401) {
				pushLog('OpenAI rejected the API key (401). Create a new key and try again.', 'warn');
			}
		},
		[pushLog, setStatus]
	);

	const openBridge = useCallback(async () => {
		const experience = experienceRef.current;
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		setConnecting(true);

		try {
			let ephemeralKey = cachedEphemeralKey;
			if (!ephemeralKey) {
				pushLog('Minting ephemeral Realtime client secret via local API…');
				ephemeralKey = await fetchDemoClientSecret(normalizeApiKey(apiKey));
				setCachedEphemeralKey(ephemeralKey);
			}

			const nextBridge = await startByoSpeech(experience, {
				ephemeralKey,
				instructions: SUGGESTED_INSTRUCTIONS,
				onLog: (line, kind) => pushLog(line, kind),
				onDisconnect: () => {
					setBridge(null);
					clearArm();
				},
				onError: (message) => pushLog(message, 'warn')
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
		apiKey,
		armed,
		bridgeLive,
		cachedEphemeralKey,
		clearArm,
		connecting,
		handleConnectError,
		pushLog,
		sessionReady
	]);

	const armOpenAi = useCallback(async () => {
		if (bridgeLive || connecting || armed) return;

		const key = normalizeApiKey(apiKey);
		if (key && key.length < OPENAI_API_KEY_MIN_LENGTH) {
			updateApiKeyHint(key);
			pushLog(`API key looks too short (${key.length} chars).`, 'warn');
			return;
		}

		setConnecting(true);

		try {
			setCachedEphemeralKey(null);
			pushLog('Minting ephemeral Realtime client secret via local API…');
			const ephemeralKey = await fetchDemoClientSecret(key);
			setCachedEphemeralKey(ephemeralKey);
			pushLog('Ephemeral secret ready. OpenAI will open after you start the player.');

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

	const endOpenAi = useCallback(async () => {
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
			pushLog('Disconnected (cleared armed OpenAI connection).');
		}
	}, [armed, bridge, clearArm, pushLog]);

	const showConnectFirstModal = useCallback(() => {
		const dialog = connectDialogRef.current;
		if (!dialog || dialog.open) return;
		dialog.showModal();
	}, []);

	const handleReady = useCallback(() => {
		pushLog('Experience ready. Connect OpenAI, then tap Start experience on the avatar.');
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
			pushLog('Start before Connect — connect to OpenAI below to begin the conversation.');
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

	return (
		<>
			<div className="demo-layout">
				<section className="demo-workspace" aria-label="OpenAI Realtime embed">
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
								onPlayerStatusChange={(state) => {
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
						<h2>1. Suggested Realtime instructions</h2>
						<p>
							These instructions are applied when minting the ephemeral session (and again via{' '}
							<code>session.update</code> via <code>startByoSpeech</code>) so Anna matches the
							coffee-barista scenario.
						</p>

						<label className="demo-field">
							<span className="demo-field-label-row">
								<span>Instructions</span>
								<button
									type="button"
									className="demo-btn demo-btn-ghost"
									onClick={() => void copyText(SUGGESTED_INSTRUCTIONS, 'instructions')}
								>
									Copy
								</button>
							</span>
							<textarea
								className="demo-text-input"
								readOnly
								rows={12}
								value={SUGGESTED_INSTRUCTIONS}
							/>
						</label>
					</div>

					<div className="demo-control-card">
						<h2>2. Connect OpenAI, then start the player</h2>
						<p>
							Paste your <strong>OpenAI API key</strong>, click <strong>Connect</strong>, then tap{' '}
							<strong>Start experience</strong> on the avatar. This app&apos;s API route mints an
							ephemeral Realtime client secret (demo-only — use a real backend in production).
						</p>

						<form
							onSubmit={(event) => {
								event.preventDefault();
								void armOpenAi();
							}}
						>
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
									placeholder="sk-… (or leave blank if OPENAI_API_KEY is set)"
									autoComplete="off"
									autoCapitalize="off"
									spellCheck={false}
									disabled={fieldsDisabled}
									value={apiKey}
									onChange={(e) => onApiKeyInput(e.target.value)}
								/>
								<span className="demo-field-note">
									Never stored in this browser. Prefer env OPENAI_API_KEY locally.
								</span>
							</label>

							{apiKeyHint ? (
								<p className="demo-field-hint">
									{apiKeyHint}{' '}
									<a href={OPENAI_API_KEYS_URL} target="_blank" rel="noopener noreferrer">
										Open API keys
									</a>
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
									onClick={() => void endOpenAi()}
								>
									End
								</button>
							</div>
						</form>

						<p className="demo-hint">
							This demo uses Realtime <strong>WebSocket</strong> so PCM + transcript map onto{' '}
							<code>createUtterance</code> (same pattern as ElevenLabs). For WebRTC, see the{' '}
							<a
								href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai"
								target="_blank"
								rel="noopener noreferrer"
							>
								OpenAI BYO docs
							</a>
							.
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
					<h2 id="connect-first-title">Connect OpenAI</h2>
					<p>The experience will start after you connect to OpenAI Realtime below.</p>
					<button type="submit" className="demo-btn demo-btn-primary" value="ok">
						OK
					</button>
				</form>
			</dialog>
		</>
	);
}
