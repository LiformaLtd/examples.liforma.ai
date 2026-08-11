/**
 * Vanilla / CDN port of `@liforma/client/deepgram` → `connectDeepgramAgent`.
 *
 * Prefer the npm helper in bundled apps:
 *   import { connectDeepgramAgent } from '@liforma/client/deepgram';
 *
 * This file mirrors that helper for the static vanilla demo (CDN SDK).
 * Demo UI lives in app.js / config.js and is not required for production.
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram
 */

import { SUGGESTED_AGENT } from './config.js';

/** Liforma `speech.write` rejects chunks larger than 64 KiB. */
const MAX_PCM_CHUNK_BYTES = 64 * 1024;
const INPUT_SAMPLE_RATE = 16_000;
const OUTPUT_SAMPLE_RATE = 24_000;

function floatToPcm16Le(input) {
	const out = new Uint8Array(input.length * 2);
	const view = new DataView(out.buffer);
	for (let i = 0; i < input.length; i++) {
		const s = Math.max(-1, Math.min(1, input[i]));
		view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
	}
	return out;
}

/** Naive linear resample Float32 → target rate (demo-quality). */
function resampleFloat32(input, fromRate, toRate) {
	if (fromRate === toRate || input.length === 0) return input;
	const ratio = fromRate / toRate;
	const outLen = Math.max(1, Math.round(input.length / ratio));
	const out = new Float32Array(outLen);
	for (let i = 0; i < outLen; i++) {
		const src = i * ratio;
		const i0 = Math.floor(src);
		const i1 = Math.min(i0 + 1, input.length - 1);
		const t = src - i0;
		out[i] = input[i0] * (1 - t) + input[i1] * t;
	}
	return out;
}

async function writePcmInChunks(utterance, bytes) {
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

/**
 * Start Deepgram Voice Agent (via same-origin proxy) and pipe agent PCM into Liforma.
 *
 * @param {{
 *   experience: import('@liforma/client').Experience;
 *   proxyUrl: string;
 *   agent?: Record<string, unknown>;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startDeepgramAgentLiformaBridge(options) {
	const {
		experience,
		proxyUrl,
		agent = SUGGESTED_AGENT,
		onLog,
		onDisconnect,
		onError
	} = options;

	const url = String(proxyUrl ?? '').trim();
	if (!url) throw new Error('Pass proxyUrl from your Deepgram Voice Agent proxy');

	const log = (line, kind = 'info') => onLog?.(line, kind);

	let ws = null;
	let turn = null;
	let pendingTranscript = '';
	let ended = false;
	let settingsApplied = false;
	let micStream = null;
	let audioCtx = null;
	let micProcessor = null;

	function consumePendingTranscript() {
		const text = pendingTranscript.trim();
		pendingTranscript = '';
		return text;
	}

	function setAgentTranscript(text, mode = 'replace') {
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

	function writeAgentAudio(bytes) {
		if (ended || !settingsApplied) return;
		if (!turn) {
			const seed = consumePendingTranscript();
			const utterance = experience.speech.createUtterance({
				format: { encoding: 'pcm_s16le', sampleRate: OUTPUT_SAMPLE_RATE, channels: 1 },
				queue: 'replace-active',
				...(seed ? { transcript: seed } : {})
			});
			turn = { utterance, writes: Promise.resolve(), transcript: seed };
		}
		const current = turn;
		current.writes = current.writes
			.then(() => writePcmInChunks(current.utterance, bytes))
			.catch((err) => console.error(err));
	}

	async function closeActiveTurn() {
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

	function bargeIn() {
		pendingTranscript = '';
		const current = turn;
		turn = null;
		void (current
			? current.utterance.cancel()
			: experience.speech.interrupt({ scope: 'active' }));
	}

	function stopMic() {
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

	async function startMic() {
		micStream = await navigator.mediaDevices.getUserMedia({
			audio: {
				channelCount: 1,
				echoCancellation: true,
				noiseSuppression: true
			}
		});
		const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
		if (!AudioContextCtor) throw new Error('Web Audio is required for mic capture');

		audioCtx = new AudioContextCtor();
		const source = audioCtx.createMediaStreamSource(micStream);
		const silent = audioCtx.createGain();
		silent.gain.value = 0;
		micProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
		const fromRate = audioCtx.sampleRate;

		micProcessor.onaudioprocess = (ev) => {
			if (ended || !settingsApplied || !ws || ws.readyState !== WebSocket.OPEN) return;
			const input = ev.inputBuffer.getChannelData(0);
			const resampled = resampleFloat32(input, fromRate, INPUT_SAMPLE_RATE);
			const pcm = floatToPcm16Le(resampled);
			const copy = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);
			ws.send(copy);
		};

		source.connect(micProcessor);
		micProcessor.connect(silent);
		silent.connect(audioCtx.destination);
		if (audioCtx.state === 'suspended') {
			await audioCtx.resume().catch(() => undefined);
		}
		log(`Mic streaming at ${fromRate} Hz → ${INPUT_SAMPLE_RATE} Hz PCM`);
	}

	function buildSettings() {
		return {
			type: 'Settings',
			audio: {
				input: { encoding: 'linear16', sample_rate: INPUT_SAMPLE_RATE },
				output: {
					encoding: 'linear16',
					sample_rate: OUTPUT_SAMPLE_RATE,
					container: 'none'
				}
			},
			agent
		};
	}

	function handleJsonMessage(raw) {
		let msg;
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}

		switch (msg.type) {
			case 'Welcome':
				ws?.send(JSON.stringify(buildSettings()));
				log('Welcome received — sent Settings');
				break;

			case 'SettingsApplied':
				settingsApplied = true;
				log('SettingsApplied — agent audio ready');
				break;

			case 'ConversationText':
				if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content) {
					setAgentTranscript(msg.content, 'replace');
				}
				break;

			case 'UserStartedSpeaking':
				bargeIn();
				break;

			case 'AgentAudioDone':
				void closeActiveTurn();
				break;

			case 'Error': {
				const message = String(msg.description ?? msg.message ?? 'Deepgram Voice Agent error');
				onError?.(message);
				log(message, 'warn');
				break;
			}

			default:
				break;
		}
	}

	ws = new WebSocket(url);
	ws.binaryType = 'arraybuffer';

	await new Promise((resolve, reject) => {
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
			reject(new Error('Deepgram Voice Agent WebSocket failed to open'));
		};
		const cleanup = () => {
			socket.removeEventListener('open', onOpen);
			socket.removeEventListener('error', onErrorEvt);
		};
		socket.addEventListener('open', onOpen);
		socket.addEventListener('error', onErrorEvt);
	});

	ws.addEventListener('message', (ev) => {
		if (ev.data instanceof ArrayBuffer) {
			writeAgentAudio(new Uint8Array(ev.data));
			return;
		}
		if (typeof ev.data === 'string') handleJsonMessage(ev.data);
	});

	ws.addEventListener('close', () => {
		stopMic();
		pendingTranscript = '';
		settingsApplied = false;
		turn = null;
		ws = null;
		if (!ended) {
			log('Deepgram Voice Agent disconnected');
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

	log('Deepgram Voice Agent connected. Speak into your mic — the avatar should lip-sync.');

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
