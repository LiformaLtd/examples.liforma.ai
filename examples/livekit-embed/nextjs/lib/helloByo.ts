/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * Peer dependency: livekit-client
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
 */
import { connectLiveKitAgent } from '@liforma/client/livekit';

export type StartByoSpeechOptions = {
	readonly url: string;
	readonly token: string;
	readonly onLog?: (line: string, kind?: 'info' | 'warn') => void;
	readonly onDisconnect?: () => void;
	readonly onError?: (message: string) => void;
	// Optional: enableTranscript (default true) forwards LiveKit agent text for force-align lipsync.
};

export async function startByoSpeech(
	experience: Parameters<typeof connectLiveKitAgent>[0],
	options: StartByoSpeechOptions
) {
	return connectLiveKitAgent(experience, {
		url: options.url,
		token: options.token,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
