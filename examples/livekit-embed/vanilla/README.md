# LiveKit embed — Vanilla

**Copy into your product:** `helloByo.js` (`startByoSpeech`). `app.js` is scaffolding only.  
Bundled apps should use the TypeScript `helloByo.ts` that calls `connectLiveKitAgent`. This vanilla file wraps the CDN `bridge.js`.

```bash
cd examples/livekit-embed && npm install
cd vanilla && npm install
export LIVEKIT_URL=wss://…
export LIVEKIT_API_KEY=…
export LIVEKIT_API_SECRET=…
PORT=4009 node server.mjs
```

Or from the examples repo root: `./start` (vanilla mode).

Open http://localhost:4009

Uses `helloByo.js` → `bridge.js` (CDN port of `connectLiveKitAgent`) with an import map for `livekit-client`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
