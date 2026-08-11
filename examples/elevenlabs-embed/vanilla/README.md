# ElevenLabs embed (vanilla)

Basic coffee-barista experience embed with **ElevenLabs Agents** as the speech-to-speech system.

**Copy into your product:** `helloByo.js` (`startByoSpeech`).  
Bundled apps should use the TypeScript `helloByo.ts` that calls `connectElevenLabsAgent` from `@liforma/client/elevenlabs`. This vanilla file wraps the CDN `bridge.js`.

## Files (for developers)

| File | What it is |
|---|---|
| **`helloByo.js`** | **Copy this into your product.** Thin `startByoSpeech` → `bridge.js`. |
| **`@liforma/client/elevenlabs`** | Canonical npm helper (`connectElevenLabsAgent`) — used by TS `helloByo.ts` siblings. |
| **`bridge.js`** | CDN/vanilla port of the same helper (no bundler). |
| `app.js` | Demo scaffolding only (Connect/End UI, arm-then-start flow, modal). |
| `config.js` | Suggested agent first message + system prompt (dashboard paste content). |
| `demoSignedUrl.js` | Local signed-URL helper — replace with your backend in production. |
| `server.mjs` | Demo proxy for signed URLs (avoids browser CORS; do not ship API keys to clients). |

## Run

```bash
PORT=4006 node examples/elevenlabs-embed/vanilla/server.mjs
```

Open **http://localhost:4006**

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
