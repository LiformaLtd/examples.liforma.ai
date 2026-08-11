# Gemini Live embed — spec

## Goal

Same shape as **Deepgram Voice Agent embed**: one coffee-barista experience on the page. Gemini Live is the speech-to-speech system; Liforma only renders the avatar from Gemini PCM (`experience.speech.createUtterance`) with optional transcript force-align.

## Why a WebSocket proxy (not HTTP mint)

Browsers must not ship Google API keys. This example:

1. Browser opens `new WebSocket(proxyUrl)` to a same-origin path.
2. Local server upgrades and connects to Gemini Live BidiGenerateContent with `?key=` server-side.
3. Proxy injects the required first `setup` message (model, AUDIO, system instruction, `outputAudioTranscription`).
4. Bidirectional JSON passthrough afterward (client may buffer until `setupComplete`).

Shared implementation: `shared/gemini-live-proxy.mjs` → `attachGeminiLiveProxy(httpServer)`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/google  
Upstream docs: https://ai.google.dev/gemini-api/docs/live-api

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. Developer pastes a Gemini **API key** (or relies on `GEMINI_API_KEY` / `GOOGLE_API_KEY` env).
3. User taps **Connect** — validates key via `POST /api/gemini-proxy-ready` and caches `proxyUrl`. The Gemini socket does **not** open yet.
4. User taps the player **Start experience** control — unlocks avatar audio; because Connect already armed, the browser opens the proxy WebSocket, mic streams to Gemini, and agent PCM is forwarded into Liforma.
5. Alternate order: Start first without Connect — modal directs the user to Connect below.
6. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

| Surface | Role |
|---|---|
| **`helloByo.ts` / `helloByo.js`** | Copy-paste integration — `startByoSpeech` → `connectGeminiLive` |
| Framework `DemoApp` / `+page.svelte` / `app.js` | Demo scaffolding only (Connect arming, modal, form) |
| `vanilla/bridge.js` | CDN/vanilla port of the SDK helper (used by vanilla `helloByo.js`) |
| `shared/gemini-live-proxy.mjs` | WS proxy + setup inject + proxy-ready HTTP handler |
| Demo servers / Vite plugins / Next `server.mjs` | Attach the shared proxy |

## Liforma integration

```ts
import { startByoSpeech } from './helloByo'; // copy from */lib/helloByo.ts

// After Experience started (audio unlocked):
const bridge = await startByoSpeech(experience, {
  proxyUrl, // same-origin ws(s)://…/api/gemini-live[?apiKey=…]
  onLog,
  onDisconnect,
  onError
});
// bridge.end() when done
```

## Gemini Live

- Upstream: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=…`
- Local proxy path: `/api/gemini-live` (query `?apiKey=` or server env `GEMINI_API_KEY` / `GOOGLE_API_KEY`)
- Ready check: `POST /api/gemini-proxy-ready`
- Proxy injects `setup` (model from `GEMINI_LIVE_MODEL`, barista system instruction, AUDIO + `outputAudioTranscription`)
- Mic: PCM @ 16 kHz → `realtimeInput.mediaChunks`
- Agent output: `serverContent.modelTurn.parts[].inlineData` → `createUtterance` / `write`
- Transcript: `outputTranscription` → `setTranscript`
- Turn close: `generationComplete` / `turnComplete`

## Required UI

- Experience host (same visual weight as OpenAI / Deepgram / basic embed)
- API key field (never stored; demo may also use `GEMINI_API_KEY` / `GOOGLE_API_KEY` env)
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Status copy mentions Gemini Live
- Short warning that API keys in the browser are for local demos only
- Link to https://aistudio.google.com/apikey

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same port; one framework at a time via `./start`.

### Next.js note

App Router handlers cannot perform WebSocket upgrades. This example uses a custom `server.mjs` that creates an HTTP server, attaches Next’s request handler **and** `attachGeminiLiveProxy`, then listens on port 4010 (`npm run dev` → `node server.mjs`).

## Local port

`4010`
