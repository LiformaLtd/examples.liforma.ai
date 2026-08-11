/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram
 */
import { connectDeepgramAgent } from '@liforma/client/deepgram';

export type StartByoSpeechOptions = {
	readonly proxyUrl: string;
	readonly agent?: Record<string, unknown>;
	readonly onLog?: (line: string, kind?: 'info' | 'warn') => void;
	readonly onDisconnect?: () => void;
	readonly onError?: (message: string) => void;
};

export async function startByoSpeech(
	experience: Parameters<typeof connectDeepgramAgent>[0],
	options: StartByoSpeechOptions
) {
	return connectDeepgramAgent(experience, {
		proxyUrl: options.proxyUrl,
		agent: options.agent,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
