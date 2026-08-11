/**
 * Vanilla / CDN port of `@liforma/client/livekit` → `connectLiveKitAgent`.
 *
 * Prefer the npm helper in bundled apps:
 *   import { connectLiveKitAgent } from '@liforma/client/livekit';
 *
 * Bridges remote agent audio via `createUtterance({ track })` and optionally
 * applies LiveKit agent transcriptions (`lk.transcription`) for force-align.
 *
 * Requires `livekit-client` via import map (see index.html).
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
 */

import {
	ConnectionState,
	Room,
	RoomEvent,
	Track
} from 'livekit-client';

const DEFAULT_SAMPLE_RATE = 48_000;
const DEFAULT_TRANSCRIPTION_TOPIC = 'lk.transcription';

function defaultShouldBridge(participant) {
	return String(participant.identity ?? '').startsWith('agent');
}

/**
 * @param {{
 *   experience: import('@liforma/client').Experience;
 *   url: string;
 *   token: string;
 *   enableTranscript?: boolean;
 *   transcriptionTopic?: string;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startLiveKitAgentLiformaBridge(options) {
	const {
		experience,
		url,
		token,
		enableTranscript = true,
		transcriptionTopic = DEFAULT_TRANSCRIPTION_TOPIC,
		onLog,
		onDisconnect,
		onError
	} = options;
	const livekitUrl = String(url ?? '').trim();
	const livekitToken = String(token ?? '').trim();
	if (!livekitUrl) throw new Error('Pass LiveKit url');
	if (!livekitToken) throw new Error('Pass LiveKit token from your server mint route');

	const log = (line, kind = 'info') => onLog?.(line, kind);

	const room = new Room();
	let ended = false;
	let connected = false;
	/** Outstanding createUtterance bridges — interrupt only when > 0 (abandon-safe). */
	let outstandingPlays = 0;
	/** @type {{ setTranscript: (text: string) => Promise<unknown>; result?: Promise<unknown> } | null} */
	let activeUtterance = null;
	let activeTranscript = '';

	function interruptIfPlaying() {
		if (outstandingPlays <= 0) return;
		activeUtterance = null;
		activeTranscript = '';
		void experience.speech.interrupt({ scope: 'active' }).catch(() => undefined);
	}

	/**
	 * @param {string} text
	 * @param {'replace' | 'append'} mode
	 */
	function applyTranscript(text, mode) {
		const next = mode === 'replace' ? text.trim() : `${activeTranscript}${text}`.trim();
		if (!next) return;
		activeTranscript = next;
		if (!activeUtterance) return;
		void activeUtterance.setTranscript(next).catch(() => undefined);
	}

	async function bridgeTrack(track, participant) {
		if (ended || track.kind !== Track.Kind.Audio) return;
		if (!defaultShouldBridge(participant)) {
			log(`Skipping audio from ${participant.identity}`);
			return;
		}
		const mediaTrack = track.mediaStreamTrack;
		if (!mediaTrack) {
			onError?.('LiveKit audio track missing mediaStreamTrack');
			return;
		}
		log(`Bridging LiveKit audio from ${participant.identity}`);
		outstandingPlays += 1;
		activeTranscript = '';
		const utterance = experience.speech.createUtterance({
			track: mediaTrack,
			sampleRate: DEFAULT_SAMPLE_RATE,
			queue: 'replace-active'
		});
		activeUtterance = utterance;
		try {
			if (utterance.result) {
				await utterance.result;
			} else {
				await new Promise((resolve) => {
					if (mediaTrack.readyState === 'ended') {
						resolve();
						return;
					}
					mediaTrack.addEventListener('ended', () => resolve(), { once: true });
				});
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			onError?.(message);
			log(message, 'warn');
		} finally {
			if (activeUtterance === utterance) {
				activeUtterance = null;
				activeTranscript = '';
			}
			outstandingPlays = Math.max(0, outstandingPlays - 1);
		}
	}

	if (enableTranscript) {
		try {
			room.registerTextStreamHandler(transcriptionTopic, (reader, participantInfo) => {
				if (ended) return;
				const identity = participantInfo.identity;
				const participant = room.remoteParticipants.get(identity);
				const accepted = participant
					? defaultShouldBridge(participant)
					: String(identity ?? '').startsWith('agent');
				if (!accepted) return;

				void (async () => {
					try {
						const text = await reader.readAll();
						if (!text.trim()) return;
						const attrs = reader.info?.attributes ?? {};
						const isFinal = attrs['lk.transcription_final'] !== 'false';
						applyTranscript(text, 'replace');
						if (isFinal) {
							log(`Agent transcript: ${text.trim().slice(0, 80)}`);
						}
					} catch (err) {
						const message = err instanceof Error ? err.message : String(err);
						log(`Transcription stream error: ${message}`, 'warn');
					}
				})();
			});
			log(`Listening for transcripts on text stream "${transcriptionTopic}"`);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			log(`Could not register transcription handler: ${message}`, 'warn');
		}
	}

	room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
		void bridgeTrack(track, participant);
	});

	room.on(RoomEvent.TrackUnsubscribed, (track) => {
		if (track.kind !== Track.Kind.Audio) return;
		interruptIfPlaying();
	});

	room.on(RoomEvent.Disconnected, () => {
		connected = false;
		if (ended) return;
		interruptIfPlaying();
		log('LiveKit room disconnected');
		onDisconnect?.();
	});

	try {
		await room.connect(livekitUrl, livekitToken);
		connected = true;
		log('LiveKit room connected — waiting for agent audio tracks');
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		throw new Error(`LiveKit connect failed: ${message}`);
	}

	for (const participant of room.remoteParticipants.values()) {
		for (const publication of participant.audioTrackPublications.values()) {
			const track = publication.track;
			if (track && publication.isSubscribed) {
				void bridgeTrack(track, participant);
			}
		}
	}

	return {
		room,
		isConnected: () => connected && !ended && room.state === ConnectionState.Connected,
		async end() {
			if (ended) return;
			ended = true;
			try {
				room.unregisterTextStreamHandler(transcriptionTopic);
			} catch {
				/* ignore */
			}
			if (outstandingPlays > 0) {
				try {
					await experience.speech.interrupt({ scope: 'active' });
				} catch {
					/* ignore */
				}
			}
			activeUtterance = null;
			activeTranscript = '';
			try {
				await room.disconnect();
			} catch (err) {
				console.error(err);
			}
			connected = false;
		}
	};
}
