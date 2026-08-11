/**
 * Demo page shell — Connect/End UI, arm-then-start.
 * Integration: copy `src/lib/helloByo.ts` into your product.
 */
import type { StartButtonOptions } from '@liforma/client';
import type { DeepgramAgentBridge } from '@liforma/client/deepgram';
import { Experience, type ExperienceHandle } from '@liforma/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EXPERIENCE_ID, SUGGESTED_AGENT } from './lib/config';
import {
	DemoProxyReadyError,
	buildDeepgramProxyUrl,
	fetchDemoProxyReady
} from './lib/demoProxyReady';
import { startByoSpeech } from './lib/helloByo';

import './styles/demo.css';

const DEEPGRAM_CONSOLE_URL = 'https://console.deepgram.com/';
const DEEPGRAM_API_KEY_MIN_LENGTH = 20;

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
		.replace(/^Token\s+/i, '')
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
	const [cachedProxyUrl, setCachedProxyUrl] = useState<string | null>(null);
	const [bridge, setBridge] = useState<DeepgramAgentBridge | null>(null);
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
		setCachedProxyUrl(null);
	}, []);

	const updateApiKeyHint = useCallback((key: string) => {
		if (!key) {
			setApiKeyHint('');
			return;
		}
		if (key.length < DEEPGRAM_API_KEY_MIN_LENGTH) {
			setApiKeyHint(
				`Key looks too short (${key.length} chars). Paste the full secret from the Deepgram console.`
			);
			return;
		}
		setApiKeyHint('');
	}, []);

	const refreshStatus = useCallback(() => {
		if (bridgeLive) {
			setStatus('Talking via Deepgram Voice Agent → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to Deepgram…', 'active');
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
			setStatus('Opening Deepgram Voice Agent…', 'active');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect Deepgram, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire Deepgram Voice Agent', 'active');
	}, [armed, bridgeLive, connecting, sessionReady, setStatus]);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	const handleConnectError = useCallback(
		(err: unknown) => {
			setStatus('Deepgram connect failed', 'warn');
			const message = err instanceof Error ? err.message : String(err);
			pushLog(message, 'warn', {
				href: DEEPGRAM_CONSOLE_URL,
				label: 'Open Deepgram console'
			});
			if (err instanceof DemoProxyReadyError && err.status === 400) {
				pushLog(
					'Provide a Deepgram API key in the form, or set DEEPGRAM_API_KEY on the server.',
					'warn'
				);
			}
		},
		[pushLog, setStatus]
	);

	const openBridge = useCallback(async () => {
		const experience = experienceRef.current;
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		setConnecting(true);

		try {
			let proxyUrl = cachedProxyUrl;
			if (!proxyUrl) {
				const key = normalizeApiKey(apiKey);
				const ready = await fetchDemoProxyReady(key);
				proxyUrl = buildDeepgramProxyUrl({
					apiKey: key,
					useEnvKey: ready.useEnvKey,
					proxyPath: ready.proxyPath
				});
				setCachedProxyUrl(proxyUrl);
			}

			const nextBridge = await startByoSpeech(experience, {
				proxyUrl,
				agent: { ...SUGGESTED_AGENT },
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
		cachedProxyUrl,
		clearArm,
		connecting,
		handleConnectError,
		pushLog,
		sessionReady
	]);

	const armDeepgram = useCallback(async () => {
		if (bridgeLive || connecting || armed) return;

		const key = normalizeApiKey(apiKey);
		if (key && key.length < DEEPGRAM_API_KEY_MIN_LENGTH) {
			updateApiKeyHint(key);
			pushLog(`API key looks too short (${key.length} chars).`, 'warn');
			return;
		}

		setConnecting(true);

		try {
			setCachedProxyUrl(null);
			pushLog('Validating Deepgram API key via local proxy…');
			const ready = await fetchDemoProxyReady(key);
			const proxyUrl = buildDeepgramProxyUrl({
				apiKey: key,
				useEnvKey: ready.useEnvKey,
				proxyPath: ready.proxyPath
			});
			setCachedProxyUrl(proxyUrl);
			pushLog(
				ready.useEnvKey
					? 'Using DEEPGRAM_API_KEY from server env. Deepgram will open after you start the player.'
					: 'Proxy ready. Deepgram will open after you start the player.'
			);

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

	const endDeepgram = useCallback(async () => {
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
			pushLog('Disconnected (cleared armed Deepgram connection).');
		}
	}, [armed, bridge, clearArm, pushLog]);

	const showConnectFirstModal = useCallback(() => {
		const dialog = connectDialogRef.current;
		if (!dialog || dialog.open) return;
		dialog.showModal();
	}, []);

	const handleReady = useCallback(() => {
		pushLog('Experience ready. Connect Deepgram, then tap Start experience on the avatar.');
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
			pushLog('Start before Connect — connect to Deepgram below to begin the conversation.');
		}
	}, [armed, bridgeLive, openBridge, pushLog, showConnectFirstModal]);

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
				<section className="demo-workspace" aria-label="Deepgram Voice Agent embed">
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
						<h2>1. Connect Deepgram, then start the player</h2>
						<p>
							Paste your <strong>Deepgram API key</strong>, click <strong>Connect</strong>, then tap{' '}
							<strong>Start experience</strong> on the avatar. This app&apos;s WebSocket proxy
							forwards to Deepgram with your key (demo-only — use a real backend in production).
						</p>

						<form
							onSubmit={(event) => {
								event.preventDefault();
								void armDeepgram();
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
									placeholder="Deepgram API key (or leave blank if DEEPGRAM_API_KEY is set)"
									autoComplete="off"
									autoCapitalize="off"
									spellCheck={false}
									disabled={fieldsDisabled}
									value={apiKey}
									onChange={(e) => onApiKeyInput(e.target.value)}
								/>
								<span className="demo-field-note">
									Never stored in this browser. Prefer env DEEPGRAM_API_KEY locally.
								</span>
							</label>

							{apiKeyHint ? (
								<p className="demo-field-hint">
									{apiKeyHint}{' '}
									<a href={DEEPGRAM_CONSOLE_URL} target="_blank" rel="noopener noreferrer">
										Open Deepgram console
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
									onClick={() => void endDeepgram()}
								>
									End
								</button>
							</div>
						</form>

						<p className="demo-hint">
							Browsers cannot set <code>Authorization</code> on WebSocket — this demo uses a
							same-origin WS proxy (Vite plugin). Agent defaults live in{' '}
							<code>src/lib/config.ts</code> (<code>SUGGESTED_AGENT</code>). See the{' '}
							<a
								href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram"
								target="_blank"
								rel="noopener noreferrer"
							>
								Deepgram BYO docs
							</a>
							.
						</p>

						<p className="demo-meta">
							<span className="demo-status-pill" data-tone={statusTone}>
								{statusText}
							</span>{' '}
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
					<h2 id="connect-first-title">Connect Deepgram</h2>
					<p>The experience will start after you connect to Deepgram Voice Agent below.</p>
					<button type="submit" className="demo-btn demo-btn-primary" value="ok">
						OK
					</button>
				</form>
			</dialog>
		</>
	);
}
