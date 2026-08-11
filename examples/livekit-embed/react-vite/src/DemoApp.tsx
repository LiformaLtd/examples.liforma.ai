/**
 * Demo page shell — Connect/End UI, arm-then-start.
 *
 * Integration (copy into your product):
 *   import { startByoSpeech } from './lib/helloByo';
 */
import type { StartButtonOptions } from '@liforma/client';
import type { LiveKitAgentBridge } from '@liforma/client/livekit';
import { Experience, type ExperienceHandle } from '@liforma/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_IDENTITY, DEFAULT_ROOM_NAME, EXPERIENCE_ID } from './lib/config';
import {
	DemoLiveKitTokenError,
	fetchDemoLiveKitToken,
	type DemoLiveKitToken
} from './lib/demoLiveKitToken';
import { startByoSpeech } from './lib/helloByo';

import './styles/demo.css';

const LIVEKIT_CLOUD_URL = 'https://cloud.livekit.io/';

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

export default function DemoApp() {
	const experienceRef = useRef<ExperienceHandle | null>(null);
	const connectDialogRef = useRef<HTMLDialogElement>(null);

	const [sessionReady, setSessionReady] = useState(false);
	const [armed, setArmed] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [cachedCreds, setCachedCreds] = useState<DemoLiveKitToken | null>(null);
	const [bridge, setBridge] = useState<LiveKitAgentBridge | null>(null);
	const [roomName, setRoomName] = useState(DEFAULT_ROOM_NAME);
	const [identity, setIdentity] = useState(DEFAULT_IDENTITY);
	const [statusText, setStatusText] = useState('Loading…');
	const [statusTone, setStatusTone] = useState<StatusTone>('default');
	const [logs, setLogs] = useState<LogEntry[]>([
		{
			text: 'Developer tip: copy helloByo.ts (startByoSpeech) into your product. Flow: Connect → Start experience. An agent in the room (identity starting with "agent") must publish audio.',
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
		setCachedCreds(null);
	}, []);

	const refreshStatus = useCallback(() => {
		if (bridgeLive) {
			setStatus('Talking via LiveKit → avatar', 'active');
			return;
		}
		if (connecting) {
			setStatus('Connecting to LiveKit…', 'active');
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
			setStatus('Joining LiveKit room…', 'active');
			return;
		}
		if (!sessionReady) {
			setStatus('Connect LiveKit, then tap Start on the avatar', 'default');
			return;
		}
		setStatus('Ready — Connect to wire LiveKit voice', 'active');
	}, [armed, bridgeLive, connecting, sessionReady, setStatus]);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	const handleConnectError = useCallback(
		(err: unknown) => {
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
		},
		[pushLog, setStatus]
	);

	const openBridge = useCallback(async () => {
		const experience = experienceRef.current;
		if (bridgeLive || connecting || !armed || !experience || !sessionReady) return;

		setConnecting(true);

		try {
			let creds = cachedCreds;
			if (!creds) {
				pushLog('Minting LiveKit participant token via local API…');
				creds = await fetchDemoLiveKitToken({ roomName, identity });
				setCachedCreds(creds);
			}

			const nextBridge = await startByoSpeech(experience, {
				url: creds.url,
				token: creds.token,
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
		armed,
		bridgeLive,
		cachedCreds,
		clearArm,
		connecting,
		handleConnectError,
		identity,
		pushLog,
		roomName,
		sessionReady
	]);

	const armLiveKit = useCallback(async () => {
		if (bridgeLive || connecting || armed) return;

		setConnecting(true);

		try {
			setCachedCreds(null);
			pushLog('Minting LiveKit participant token via local API…');
			const creds = await fetchDemoLiveKitToken({ roomName, identity });
			setCachedCreds(creds);
			pushLog(
				`Token ready for room "${creds.roomName}" as "${creds.identity}". LiveKit will join after you start the player.`
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
		armed,
		bridgeLive,
		clearArm,
		connecting,
		handleConnectError,
		identity,
		openBridge,
		pushLog,
		roomName,
		sessionReady
	]);

	const endLiveKit = useCallback(async () => {
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
			pushLog('Disconnected (cleared armed LiveKit connection).');
		}
	}, [armed, bridge, clearArm, pushLog]);

	const showConnectFirstModal = useCallback(() => {
		const dialog = connectDialogRef.current;
		if (!dialog || dialog.open) return;
		dialog.showModal();
	}, []);

	const handleReady = useCallback(() => {
		pushLog('Experience ready. Connect LiveKit, then tap Start experience on the avatar.');
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
			pushLog('Start before Connect — connect to LiveKit below to begin the conversation.');
		}
	}, [armed, bridgeLive, openBridge, pushLog, showConnectFirstModal]);

	const onFieldChange = useCallback(
		(nextRoom: string, nextIdentity: string) => {
			if (armed && !bridgeLive) {
				clearArm();
				pushLog('Room settings changed — click Connect again.', 'warn');
			}
			setRoomName(nextRoom);
			setIdentity(nextIdentity);
		},
		[armed, bridgeLive, clearArm, pushLog]
	);

	return (
		<>
			<div className="demo-layout">
				<section className="demo-workspace" aria-label="LiveKit embed">
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
						<h2>1. Connect LiveKit, then start the player</h2>
						<p>
							Click <strong>Connect</strong> to mint a participant token (server env{' '}
							<code>LIVEKIT_URL</code> / <code>LIVEKIT_API_KEY</code> /{' '}
							<code>LIVEKIT_API_SECRET</code>), then tap <strong>Start experience</strong> on
							the avatar. An agent in the room (identity starting with <code>agent</code>) must
							publish audio for the avatar to lip-sync.
						</p>

						<form
							onSubmit={(event) => {
								event.preventDefault();
								void armLiveKit();
							}}
						>
							<label className="demo-field">
								<span>Room name</span>
								<input
									className="demo-text-input"
									type="text"
									placeholder={DEFAULT_ROOM_NAME}
									autoComplete="off"
									disabled={fieldsDisabled}
									value={roomName}
									onChange={(e) => onFieldChange(e.target.value, identity)}
								/>
							</label>

							<label className="demo-field">
								<span>Participant identity</span>
								<input
									className="demo-text-input"
									type="text"
									placeholder={DEFAULT_IDENTITY}
									autoComplete="off"
									disabled={fieldsDisabled}
									value={identity}
									onChange={(e) => onFieldChange(roomName, e.target.value)}
								/>
								<span className="demo-field-note">
									Secrets stay on the server. Do not also attach the remote track to an{' '}
									<code>&lt;audio&gt;</code> element.
								</span>
							</label>

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
									onClick={() => void endLiveKit()}
								>
									End
								</button>
							</div>
						</form>

						<p className="demo-hint">
							This is bring-your-own LiveKit voice — not Liforma&apos;s future{' '}
							<code>transport: livekit</code> adapter. See the{' '}
							<a
								href="https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit"
								target="_blank"
								rel="noopener noreferrer"
							>
								LiveKit BYO docs
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
					<h2 id="connect-first-title">Connect LiveKit</h2>
					<p>The experience will start after you connect to LiveKit below.</p>
					<button type="submit" className="demo-btn demo-btn-primary" value="ok">
						OK
					</button>
				</form>
			</dialog>
		</>
	);
}
