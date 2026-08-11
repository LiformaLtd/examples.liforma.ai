/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * npm apps: use `@liforma/client/elevenlabs` → `connectElevenLabsAgent` (see sibling helloByo.ts).
 * This vanilla file calls the CDN port in bridge.js.
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs
 */
import { startElevenLabsLiformaBridge } from './bridge.js';

/**
 * @param {import('@liforma/client').Experience} experience
 * @param {{
 *   agentId?: string;
 *   signedUrl?: string;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startByoSpeech(experience, options) {
	return startElevenLabsLiformaBridge({
		experience,
		agentId: options.agentId,
		signedUrl: options.signedUrl,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
