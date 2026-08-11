/**
 * Vite middleware: POST /api/livekit-token
 */
import { createLiveKitTokenMiddleware } from '../../shared/mint-livekit-token.mjs';

export { createLiveKitTokenMiddleware as createLiveKitApiMiddleware };
