/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * npm apps: use `@liforma/client/deepgram` → `connectDeepgramAgent` (see sibling helloByo.ts).
 * This vanilla file calls the CDN port in bridge.js.
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram
 */
import { startDeepgramAgentLiformaBridge } from './bridge.js';

/**
 * @param {import('@liforma/client').Experience} experience
 * @param {{
 *   proxyUrl: string;
 *   agent?: Record<string, unknown>;
 *   onLog?: (line: string, kind?: 'info' | 'warn') => void;
 *   onDisconnect?: () => void;
 *   onError?: (message: string) => void;
 * }} options
 */
export async function startByoSpeech(experience, options) {
	return startDeepgramAgentLiformaBridge({
		experience,
		proxyUrl: options.proxyUrl,
		agent: options.agent,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
