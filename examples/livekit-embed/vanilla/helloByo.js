/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * npm apps: use `@liforma/client/livekit` → `connectLiveKitAgent` (see sibling helloByo.ts).
 * This vanilla file calls the CDN port in bridge.js.
 * Peer dependency: livekit-client (import map in this demo).
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
 */
import { startLiveKitAgentLiformaBridge } from './bridge.js';

/**
 * @param {import('@liforma/client').Experience} experience
 * @param {{
 *   url: string;
 *   token: string;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startByoSpeech(experience, options) {
	// Optional SDK option enableTranscript (default true) is available on connectLiveKitAgent.
	return startLiveKitAgentLiformaBridge({
		experience,
		url: options.url,
		token: options.token,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
