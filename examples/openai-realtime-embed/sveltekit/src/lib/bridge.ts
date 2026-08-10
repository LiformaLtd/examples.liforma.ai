/**
 * OpenAI Realtime → Liforma BYO voice bridge
 *
 * =============================================================================
 * READ THIS FILE — this is the integration pattern to copy into your app.
 * Demo UI lives in routes/+page.svelte and is not required for production.
 * =============================================================================
 *
 * Pattern:
 * 1. Mount a Liforma `<Experience>` (`mode="presenter"`, `speechInputMode="off"`
 *    when OpenAI owns the microphone).
 * 2. Wait until the player has started (audio unlocked inside the iframe).
 * 3. Mint an ephemeral Realtime client secret on your server (never ship OPENAI_API_KEY).
 * 4. Open `wss://api.openai.com/v1/realtime` with that ephemeral key.
 * 5. Stream mic PCM → `input_audio_buffer.append`; mute any local OpenAI playback.
 * 6. On each `response.output_audio.delta` → `createUtterance` / `write` / `close`.
 * 7. Collect `response.output_audio_transcript.*` → `setTranscript` / `close({ transcript })`
 *    so STA can force-align (better lipsync than PCM-only free decode).
 *
 * Why WebSocket here: per-turn PCM + transcript match the ElevenLabs createUtterance
 * pattern. OpenAI’s preferred browser media path is WebRTC — see docs.
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai
 */

import type { ExperienceHandle } from '@liforma/client/svelte';
import { DEFAULT_REALTIME_MODEL, DEFAULT_REALTIME_VOICE, SUGGESTED_INSTRUCTIONS } from './config';

/** Liforma `speech.write` rejects chunks larger than 64 KiB. */
const MAX_PCM_CHUNK_BYTES = 64 * 1024;
const TARGET_SAMPLE_RATE = 24_000;

function base64ToPcmBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function pcmBytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(bin);
}

function floatToPcm16Le(input: Float32Array): Uint8Array {
	const out = new Uint8Array(input.length * 2);
	const view = new DataView(out.buffer);
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i]!));
		view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
	}
	return out;
}

/** Naive linear resample Float32 → target rate (demo-quality). */
function resampleFloat32(input: Float32Array, fromRate: number, toRate: number): Float32Array {
	if (fromRate === toRate || input.length === 0) return input;
	const ratio = fromRate / toRate;
	const outLen = Math.max(1, Math.round(input.length / ratio));
	const out = new Float32Array(outLen);
	for (let i = 0; i < outLen; i++) {
		const src = i * ratio;
		const i0 = Math.floor(src);
		const i1 = Math.min(i0 + 1, input.length - 1);
		const t = src - i0;
		out[i] = input[i0]! * (1 - t) + input[i1]! * t;
	}
	return out;
}

async function writePcmInChunks(
	utterance: { write: (chunk: ArrayBuffer | ArrayBufferView) => Promise<unknown> },
	bytes: Uint8Array
): Promise<void> {
	if (bytes.byteLength <= MAX_PCM_CHUNK_BYTES) {
		if ((bytes.byteLength & 1) !== 0) {
			await utterance.write(bytes.subarray(0, bytes.byteLength - 1));
			return;
		}
		await utterance.write(bytes);
		return;
	}
	let offset = 0;
	while (offset < bytes.byteLength) {
		let end = Math.min(offset + MAX_PCM_CHUNK_BYTES, bytes.byteLength);
		if (end < bytes.byteLength && (end - offset) % 2 === 1) end -= 1;
		if (end <= offset) break;
		await utterance.write(bytes.subarray(offset, end));
		offset = end;
	}
}

export type BridgeOptions = {
	/** Started Liforma experience handle (player audio already unlocked). */
	readonly experience: Pick<ExperienceHandle, 'speech'>;
	/** Ephemeral client secret from your backend (`/api/openai-realtime-session`). */
	readonly ephemeralKey: string;
	readonly model?: string;
	readonly voice?: string;
	readonly instructions?: string;
	readonly onLog?: (line: string, kind?: 'info' | 'warn') => void;
	readonly onDisconnect?: () => void;
	readonly onError?: (message: string) => void;
};

export type OpenAiRealtimeLiformaBridge = {
	isConnected(): boolean;
	end(): Promise<void>;
};

/**
 * Start OpenAI Realtime (WebSocket) and pipe agent PCM into Liforma lip-sync / playback.
 */
export async function startOpenAiRealtimeLiformaBridge(
	options: BridgeOptions
): Promise<OpenAiRealtimeLiformaBridge> {
	const {
		experience,
		ephemeralKey,
		model = DEFAULT_REALTIME_MODEL,
		voice = DEFAULT_REALTIME_VOICE,
		instructions = SUGGESTED_INSTRUCTIONS,
		onLog,
		onDisconnect,
		onError
	} = options;

	const key = ephemeralKey.trim();
	if (!key) throw new Error('Pass ephemeralKey from your server mint route');

	const log = (line: string, kind: 'info' | 'warn' = 'info') => onLog?.(line, kind);

	type Turn = {
		utterance: ReturnType<ExperienceHandle['speech']['createUtterance']>;
		writes: Promise<void>;
		transcript: string;
	};

	let ws: WebSocket | null = null;
	let turn: Turn | null = null;
	let pendingTranscript = '';
	let ended = false;
	let greeted = false;
	let micStream: MediaStream | null = null;
	let audioCtx: AudioContext | null = null;
	let micProcessor: ScriptProcessorNode | null = null;

	function consumePendingTranscript(): string {
		const text = pendingTranscript.trim();
		pendingTranscript = '';
		return text;
	}

	function setAgentTranscript(text: string, mode: 'replace' | 'append' = 'append'): void {
		const next =
			mode === 'replace'
				? text.trim()
				: `${turn?.transcript ?? pendingTranscript}${text}`.trim();
		if (!next) return;
		if (!turn) {
			pendingTranscript = next;
			return;
		}
		turn.transcript = next;
		void turn.utterance.setTranscript(next).catch(() => undefined);
	}

	function writeAgentAudio(base64Audio: string): void {
		if (ended) return;
		if (!turn) {
			const seed = consumePendingTranscript();
			const utterance = experience.speech.createUtterance({
				format: { encoding: 'pcm_s16le', sampleRate: TARGET_SAMPLE_RATE, channels: 1 },
				queue: 'replace-active',
				...(seed ? { transcript: seed } : {})
			});
			turn = { utterance, writes: Promise.resolve(), transcript: seed };
		}
		const current = turn;
		const bytes = base64ToPcmBytes(base64Audio);
		current.writes = current.writes
			.then(() => writePcmInChunks(current.utterance, bytes))
			.catch((err) => console.error(err));
	}

	async function closeActiveTurn(): Promise<void> {
		const current = turn;
		turn = null;
		if (!current) return;
		try {
			await current.writes;
			const transcript = current.transcript.trim();
			await current.utterance.close({
				...(transcript ? { transcript } : {}),
				history: 'none'
			});
		} catch {
			/* ignore */
		}
	}

	function bargeIn(): void {
		pendingTranscript = '';
		const current = turn;
		turn = null;
		void (current
			? current.utterance.cancel()
			: experience.speech.interrupt({ scope: 'active' }));
	}

	function send(event: Record<string, unknown>): void {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		ws.send(JSON.stringify(event));
	}

	function stopMic(): void {
		if (micProcessor) {
			micProcessor.onaudioprocess = null;
			try {
				micProcessor.disconnect();
			} catch {
				/* ignore */
			}
			micProcessor = null;
		}
		if (audioCtx) {
			void audioCtx.close().catch(() => undefined);
			audioCtx = null;
		}
		if (micStream) {
			for (const track of micStream.getTracks()) track.stop();
			micStream = null;
		}
	}

	async function startMic(): Promise<void> {
		micStream = await navigator.mediaDevices.getUserMedia({
			audio: {
				channelCount: 1,
				echoCancellation: true,
				noiseSuppression: true
			}
		});
		const AudioContextCtor =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AudioContextCtor) throw new Error('Web Audio is required for mic capture');

		audioCtx = new AudioContextCtor();
		const source = audioCtx.createMediaStreamSource(micStream);
		const silent = audioCtx.createGain();
		silent.gain.value = 0;
		micProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
		const fromRate = audioCtx.sampleRate;

		micProcessor.onaudioprocess = (ev) => {
			if (ended || !ws || ws.readyState !== WebSocket.OPEN) return;
			const input = ev.inputBuffer.getChannelData(0);
			const resampled = resampleFloat32(input, fromRate, TARGET_SAMPLE_RATE);
			const pcm = floatToPcm16Le(resampled);
			send({
				type: 'input_audio_buffer.append',
				audio: pcmBytesToBase64(pcm)
			});
		};

		source.connect(micProcessor);
		micProcessor.connect(silent);
		silent.connect(audioCtx.destination);
		if (audioCtx.state === 'suspended') {
			await audioCtx.resume().catch(() => undefined);
		}
		log(`Mic streaming at ${fromRate} Hz → ${TARGET_SAMPLE_RATE} Hz PCM`);
	}

	function handleServerEvent(raw: string): void {
		let event: {
			type?: string;
			delta?: string;
			transcript?: string;
			error?: { message?: string };
		};
		try {
			event = JSON.parse(raw) as typeof event;
		} catch {
			return;
		}

		switch (event.type) {
			case 'session.created':
				send({
					type: 'session.update',
					session: {
						type: 'realtime',
						model,
						output_modalities: ['audio'],
						instructions,
						audio: {
							input: {
								format: { type: 'audio/pcm', rate: TARGET_SAMPLE_RATE },
								turn_detection: { type: 'semantic_vad' }
							},
							output: {
								format: { type: 'audio/pcm', rate: TARGET_SAMPLE_RATE },
								voice
							}
						}
					}
				});
				break;

			case 'session.updated':
				if (!greeted) {
					greeted = true;
					// First assistant turn (barista greets) without waiting for the user.
					send({ type: 'response.create' });
					log('Session ready — requesting Anna’s greeting');
				}
				break;

			case 'response.output_audio.delta':
				if (typeof event.delta === 'string' && event.delta) {
					writeAgentAudio(event.delta);
				}
				break;

			case 'response.output_audio_transcript.delta':
				if (typeof event.delta === 'string' && event.delta) {
					setAgentTranscript(event.delta, 'append');
				}
				break;

			case 'response.output_audio_transcript.done':
				if (typeof event.transcript === 'string' && event.transcript.trim()) {
					setAgentTranscript(event.transcript, 'replace');
				}
				break;

			case 'response.done':
			case 'response.output_audio.done':
				void closeActiveTurn();
				break;

			case 'input_audio_buffer.speech_started':
				bargeIn();
				break;

			case 'error': {
				const message = String(event.error?.message ?? 'OpenAI Realtime error');
				onError?.(message);
				log(message, 'warn');
				break;
			}

			default:
				break;
		}
	}

	const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`;
	ws = new WebSocket(url, ['realtime', `openai-insecure-api-key.${key}`]);

	await new Promise<void>((resolve, reject) => {
		if (!ws) {
			reject(new Error('WebSocket failed to construct'));
			return;
		}
		const socket = ws;
		const onOpen = () => {
			cleanup();
			resolve();
		};
		const onErrorEvt = () => {
			cleanup();
			reject(new Error('OpenAI Realtime WebSocket failed to open'));
		};
		const cleanup = () => {
			socket.removeEventListener('open', onOpen);
			socket.removeEventListener('error', onErrorEvt);
		};
		socket.addEventListener('open', onOpen);
		socket.addEventListener('error', onErrorEvt);
	});

	ws.addEventListener('message', (msg) => {
		if (typeof msg.data === 'string') handleServerEvent(msg.data);
	});

	ws.addEventListener('close', () => {
		stopMic();
		pendingTranscript = '';
		turn = null;
		ws = null;
		if (!ended) {
			log('OpenAI Realtime disconnected');
			onDisconnect?.();
		}
	});

	try {
		await startMic();
	} catch (err) {
		ws.close();
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Microphone access failed: ${message}`);
	}

	log('Realtime connected. Speak into your mic — the avatar should lip-sync.');

	return {
		isConnected: () => {
			const socket = ws;
			return socket != null && socket.readyState === WebSocket.OPEN && !ended;
		},
		async end() {
			if (ended) return;
			ended = true;
			pendingTranscript = '';
			await closeActiveTurn();
			stopMic();
			const active = ws;
			ws = null;
			if (active && active.readyState === WebSocket.OPEN) {
				try {
					active.close();
				} catch (err) {
					console.error(err);
				}
			}
		}
	};
}
