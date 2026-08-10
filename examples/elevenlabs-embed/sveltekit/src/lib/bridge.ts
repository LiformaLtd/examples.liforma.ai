/**
 * ElevenLabs Agents → Liforma BYO voice bridge
 *
 * =============================================================================
 * READ THIS FILE — this is the integration pattern to copy into your app.
 * Demo UI lives in routes/+page.svelte and is not required for production.
 * =============================================================================
 *
 * Pattern:
 * 1. Mount a Liforma `<Experience>` (often `mode="presenter"`, `speechInputMode="off"`
 *    when ElevenLabs owns the microphone).
 * 2. Wait until the player has started (audio unlocked inside the iframe).
 * 3. `Conversation.startSession({ connectionType: 'websocket', … })`.
 * 4. `conversation.setVolume({ volume: 0 })` — mute ElevenLabs; Liforma speaks.
 * 5. On each `onAudio` PCM chunk → `experience.speech.createUtterance` / `write` / `close`.
 * 6. Collect agent text via `onMessage` → `setTranscript` / `close({ transcript })` so STA
 *    can force-align (better lipsync than PCM-only free decode).
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs
 */

import { Conversation } from '@elevenlabs/client';
import type { ExperienceHandle } from '@liforma/client/svelte';

/** Liforma `speech.write` rejects chunks larger than 64 KiB. */
const MAX_PCM_CHUNK_BYTES = 64 * 1024;

function base64ToPcmBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
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
	/** Public agents: pass agentId. Private agents: prefer signedUrl instead. */
	readonly agentId?: string;
	/** From your backend (`/api/elevenlabs-signed-url` in this demo). */
	readonly signedUrl?: string;
	readonly onLog?: (line: string, kind?: 'info' | 'warn') => void;
	readonly onDisconnect?: () => void;
	readonly onError?: (message: string) => void;
};

export type ElevenLabsLiformaBridge = {
	isConnected(): boolean;
	end(): Promise<void>;
};

/**
 * Start ElevenLabs and pipe agent PCM into Liforma lip-sync / playback.
 */
export async function startElevenLabsLiformaBridge(
	options: BridgeOptions
): Promise<ElevenLabsLiformaBridge> {
	const { experience, agentId, signedUrl, onLog, onDisconnect, onError } = options;
	if (!signedUrl && !agentId) throw new Error('Pass signedUrl or agentId');

	const log = (line: string, kind: 'info' | 'warn' = 'info') => onLog?.(line, kind);

	type Turn = {
		utterance: ReturnType<ExperienceHandle['speech']['createUtterance']>;
		writes: Promise<void>;
		transcript: string;
	};

	let conversation: Awaited<ReturnType<typeof Conversation.startSession>> | null = null;
	let turn: Turn | null = null;
	let sampleRate: number | null = null;
	let sampleRateReady = false;
	let pendingAudioB64: string[] = [];
	/** Agent text that arrived before sample-rate lock / first turn. */
	let pendingTranscript = '';
	let sampleRateFallbackTimer = 0;
	let ended = false;

	function clearSampleRateFallback(): void {
		if (!sampleRateFallbackTimer) return;
		window.clearTimeout(sampleRateFallbackTimer);
		sampleRateFallbackTimer = 0;
	}

	function flushPendingAudio(): void {
		if (!pendingAudioB64.length) return;
		const queued = pendingAudioB64;
		pendingAudioB64 = [];
		for (const b64 of queued) writeAgentAudio(b64);
	}

	function consumePendingTranscript(): string {
		const text = pendingTranscript.trim();
		pendingTranscript = '';
		return text;
	}

	/**
	 * Lock sample rate from `agent_output_audio_format` before createUtterance.
	 * A wrong rate makes STA/energy clocks drift (mouth can look stuck open).
	 */
	function lockSampleRate(rate: number): void {
		if (sampleRateReady) return;
		if (!Number.isFinite(rate) || rate <= 0) return;
		sampleRate = rate;
		sampleRateReady = true;
		clearSampleRateFallback();
		log(`Agent output format: pcm_${sampleRate}`);
		// Keep pendingTranscript until first PCM opens the turn (avoid empty utterances).
		flushPendingAudio();
	}

	function armSampleRateFallback(): void {
		clearSampleRateFallback();
		sampleRateFallbackTimer = window.setTimeout(() => {
			sampleRateFallbackTimer = 0;
			if (!sampleRateReady) {
				log('No agent_output_audio_format yet — falling back to pcm_16000', 'warn');
				lockSampleRate(16_000);
			}
		}, 800);
	}

	function writeAgentAudio(base64Audio: string): void {
		if (ended || !sampleRateReady || sampleRate == null) return;
		if (!turn) {
			const seed = consumePendingTranscript();
			const utterance = experience.speech.createUtterance({
				format: { encoding: 'pcm_s16le', sampleRate, channels: 1 },
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

	function handleAgentAudio(base64Audio: string): void {
		if (!sampleRateReady) {
			pendingAudioB64.push(base64Audio);
			return;
		}
		writeAgentAudio(base64Audio);
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

	function setAgentTranscript(text: string): void {
		const trimmed = text.trim();
		if (!trimmed) return;
		if (!turn) {
			// Buffer until first PCM opens the turn (seed createUtterance there).
			pendingTranscript = trimmed;
			return;
		}
		turn.transcript = trimmed;
		void turn.utterance.setTranscript(trimmed).catch(() => undefined);
	}

	armSampleRateFallback();

	conversation = await Conversation.startSession({
		// websocket is required for onAudio PCM frames.
		connectionType: 'websocket',
		...(signedUrl ? { signedUrl } : { agentId: agentId! }),

		onConversationMetadata: (meta) => {
			const fmt = meta?.agent_output_audio_format;
			const m = /^pcm_(\d+)$/.exec(fmt ?? '');
			if (m) lockSampleRate(Number(m[1]));
		},

		onAudio: (base64Audio) => {
			handleAgentAudio(base64Audio);
		},

		onMessage: ({ message, role }) => {
			if (role !== 'agent') return;
			setAgentTranscript(message);
		},

		onModeChange: ({ mode }) => {
			if (mode !== 'listening') return;
			void closeActiveTurn();
		},

		onInterruption: () => {
			pendingAudioB64 = [];
			pendingTranscript = '';
			const current = turn;
			turn = null;
			void (current
				? current.utterance.cancel()
				: experience.speech.interrupt({ scope: 'active' }));
		},

		onError: (message) => {
			const text = String(message);
			onError?.(text);
			log(`ElevenLabs error: ${text}`, 'warn');
		},

		onDisconnect: () => {
			clearSampleRateFallback();
			pendingAudioB64 = [];
			pendingTranscript = '';
			turn = null;
			sampleRate = null;
			sampleRateReady = false;
			conversation = null;
			log('ElevenLabs disconnected');
			onDisconnect?.();
		}
	});

	// Critical: silence ElevenLabs' own speaker — Liforma owns playback.
	await conversation.setVolume({ volume: 0 });

	log('Conversation started. Speak into your mic — the avatar should lip-sync.');

	return {
		isConnected: () => Boolean(conversation) && !ended,
		async end() {
			if (ended) return;
			ended = true;
			clearSampleRateFallback();
			pendingAudioB64 = [];
			pendingTranscript = '';
			await closeActiveTurn();
			const active = conversation;
			conversation = null;
			sampleRate = null;
			sampleRateReady = false;
			if (active) {
				try {
					await active.endSession();
				} catch (err) {
					console.error(err);
				}
			}
		}
	};
}
