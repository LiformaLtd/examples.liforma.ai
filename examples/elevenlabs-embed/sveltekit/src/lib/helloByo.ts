/**
 * BYO hello world — copy this file into your product.
 *
 * Prerequisites:
 * 1. Mount Experience with externalSpeechAudio (often mode="presenter", speechInputMode="off")
 * 2. Wait until the player has started (audio unlocked)
 * 3. Call startByoSpeech(experience, options)
 *
 * Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs
 */
import { connectElevenLabsAgent } from '@liforma/client/elevenlabs';

export type StartByoSpeechOptions = {
	readonly agentId?: string;
	readonly signedUrl?: string;
	readonly onLog?: (line: string, kind?: 'info' | 'warn') => void;
	readonly onDisconnect?: () => void;
	readonly onError?: (message: string) => void;
};

export async function startByoSpeech(
	experience: Parameters<typeof connectElevenLabsAgent>[0],
	options: StartByoSpeechOptions
) {
	return connectElevenLabsAgent(experience, {
		agentId: options.agentId,
		signedUrl: options.signedUrl,
		onLog: options.onLog,
		onDisconnect: options.onDisconnect,
		onError: options.onError
	});
}
