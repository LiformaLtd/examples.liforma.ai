/**
 * Vanilla / CDN port of `@liforma/client/google` → `connectGeminiLive`.
 *
 * Prefer the npm helper in bundled apps:
 *   import { connectGeminiLive } from '@liforma/client/google';
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/google
 */

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

function pcmBytesToBase64(pcm) {
	let binary = '';
	for (let i = 0; i < pcm.length; i++) binary += String.fromCharCode(pcm[i]);
	return btoa(binary);
}

function base64ToUint8Array(b64) {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
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
	for (let offset = 0; offset < bytes.byteLength; offset += MAX_PCM_CHUNK_BYTES) {
		let end = Math.min(offset + MAX_PCM_CHUNK_BYTES, bytes.byteLength);
		if (((end - offset) & 1) !== 0) end -= 1;
		if (end <= offset) break;
		await utterance.write(bytes.subarray(offset, end));
	}
}

/**
 * @param {{
 *   experience: import('@liforma/client').Experience;
 *   proxyUrl: string;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startGeminiLiveLiformaBridge(options) {
	const { experience, proxyUrl, onLog, onDisconnect, onError } = options;
	const url = String(proxyUrl ?? '').trim();
	if (!url) throw new Error('Pass proxyUrl from your Gemini Live proxy');

	const log = (line, kind = 'info') => onLog?.(line, kind);

	let ws = null;
	let ended = false;
	let micStream = null;
	let audioCtx = null;
	let processor = null;
	let source = null;

	/** @type {{ utterance: any; writes: Promise<void>; transcript: string } | null} */
	let turn = null;

	function beginTurn() {
		const utterance = experience.speech.createUtterance({
			format: { encoding: 'pcm_s16le', sampleRate: OUTPUT_SAMPLE_RATE, channels: 1 },
			queue: 'replace-active'
		});
		turn = { utterance, writes: Promise.resolve(), transcript: '' };
		return turn;
	}

	async function closeActiveTurn() {
		const current = turn;
		turn = null;
		if (!current) return;
		await current.writes;
		await current.utterance.close({
			transcript: current.transcript || undefined,
			history: 'none'
		});
	}

	function bargeIn() {
		const current = turn;
		turn = null;
		void (current
			? current.utterance.cancel()
			: experience.speech.interrupt({ scope: 'active' }));
	}

	function send(event) {
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		ws.send(JSON.stringify(event));
	}

	function handleServerEvent(raw) {
		let msg;
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}
		if (msg.error?.message) {
			onError?.(msg.error.message);
			log(msg.error.message, 'warn');
			return;
		}
		const content = msg.serverContent;
		if (!content) return;

		if (content.interrupted) {
			bargeIn();
			return;
		}

		if (content.outputTranscription?.text) {
			const current = turn ?? beginTurn();
			current.transcript += content.outputTranscription.text;
			void current.utterance.setTranscript(current.transcript);
		}

		for (const part of content.modelTurn?.parts ?? []) {
			const b64 = part.inlineData?.data;
			if (typeof b64 !== 'string' || !b64) continue;
			const current = turn ?? beginTurn();
			const chunk = base64ToUint8Array(b64);
			const u = current.utterance;
			current.writes = current.writes
				.then(() => writePcmInChunks(u, chunk))
				.catch((err) => onError?.(err instanceof Error ? err.message : String(err)));
		}

		if (content.generationComplete || content.turnComplete) {
			void closeActiveTurn();
		}
	}

	ws = new WebSocket(url);
	await new Promise((resolve, reject) => {
		const onOpen = () => {
			cleanup();
			resolve();
		};
		const onErr = () => {
			cleanup();
			reject(new Error('Gemini Live WebSocket failed to open'));
		};
		const cleanup = () => {
			ws.removeEventListener('open', onOpen);
			ws.removeEventListener('error', onErr);
		};
		ws.addEventListener('open', onOpen);
		ws.addEventListener('error', onErr);
	});

	ws.addEventListener('message', (ev) => {
		if (typeof ev.data === 'string') handleServerEvent(ev.data);
	});

	ws.addEventListener('close', () => {
		stopMic();
		ws = null;
		if (ended) return;
		const current = turn;
		turn = null;
		void current?.utterance.cancel?.();
		log('Gemini Live disconnected');
		onDisconnect?.();
	});

	function stopMic() {
		try {
			processor?.disconnect();
			source?.disconnect();
			void audioCtx?.close();
		} catch {
			/* ignore */
		}
		processor = null;
		source = null;
		audioCtx = null;
		micStream?.getTracks().forEach((t) => t.stop());
		micStream = null;
	}

	try {
		micStream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true }
		});
		audioCtx = new AudioContext();
		source = audioCtx.createMediaStreamSource(micStream);
		processor = audioCtx.createScriptProcessor(4096, 1, 1);
		processor.onaudioprocess = (ev) => {
			if (ended || !ws || ws.readyState !== WebSocket.OPEN) return;
			const input = ev.inputBuffer.getChannelData(0);
			const resampled = resampleFloat32(input, audioCtx.sampleRate, INPUT_SAMPLE_RATE);
			const pcm = floatToPcm16Le(resampled);
			send({
				realtimeInput: {
					mediaChunks: [
						{
							mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
							data: pcmBytesToBase64(pcm)
						}
					]
				}
			});
		};
		source.connect(processor);
		processor.connect(audioCtx.destination);
	} catch (err) {
		ws.close();
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`Microphone access failed: ${message}`);
	}

	log('Gemini Live connected. Speak into your mic — the avatar should lip-sync.');

	return {
		isConnected: () => ws != null && ws.readyState === WebSocket.OPEN && !ended,
		async end() {
			if (ended) return;
			ended = true;
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
