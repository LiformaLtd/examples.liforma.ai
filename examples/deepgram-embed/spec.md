# Deepgram Voice Agent embed — spec

## Goal

Same shape as **OpenAI Realtime embed** / **ElevenLabs embed**: one coffee-barista experience on the page. Deepgram Voice Agent is the speech-to-speech system; Liforma only renders the avatar from Deepgram PCM audio (`experience.speech.createUtterance`) with optional transcript force-align.

## Why a WebSocket proxy (not HTTP mint)

Browsers cannot set `Authorization` headers on `WebSocket`. This example:

1. Browser opens `new WebSocket(proxyUrl)` to a same-origin path (no auth headers).
2. Local server upgrades and connects to `wss://agent.deepgram.com/v1/agent/converse` with `Authorization: Token <DEEPGRAM_API_KEY>`.
3. Bidirectional binary + text frame passthrough.

Shared implementation: `shared/deepgram-agent-proxy.mjs` → `attachDeepgramAgentProxy(httpServer)`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. Developer pastes a Deepgram **API key** (or relies on `DEEPGRAM_API_KEY` env).
3. User taps **Connect** — validates key via `POST /api/deepgram-proxy-ready` and caches `proxyUrl`. The Deepgram socket does **not** open yet.
4. User taps the player **Start experience** control — unlocks avatar audio; because Connect already armed, the browser opens the proxy WebSocket, mic streams to Deepgram, and agent PCM is forwarded into Liforma.
5. Alternate order: Start first without Connect — modal directs the user to Connect below.
6. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

| Surface | Role |
|---|---|
| **`helloByo.ts` / `helloByo.js`** | Copy-paste integration — `startByoSpeech` → `connectDeepgramAgent` |
| Framework `DemoApp` / `+page.svelte` / `app.js` | Demo scaffolding only (Connect arming, modal, form) |
| `vanilla/bridge.js` | CDN/vanilla port of the SDK helper (used by vanilla `helloByo.js`) |
| `shared/deepgram-agent-proxy.mjs` | WS proxy + proxy-ready HTTP handler |
| Demo servers / Vite plugins / Next `server.mjs` | Attach the shared proxy |

## Liforma integration

```ts
import { startByoSpeech } from './helloByo'; // copy from */lib/helloByo.ts

// After Experience started (audio unlocked):
const bridge = await startByoSpeech(experience, {
  proxyUrl, // same-origin ws(s)://…/api/deepgram-agent[?apiKey=…]
  agent: { /* optional Settings.agent defaults */ },
  onLog,
  onDisconnect,
  onError
});
// bridge.end() when done
```

## Deepgram

- Upstream: `wss://agent.deepgram.com/v1/agent/converse`
- Local proxy path: `/api/deepgram-agent` (query `?apiKey=` or server env `DEEPGRAM_API_KEY`)
- Ready check: `POST /api/deepgram-proxy-ready`
- Agent output: binary PCM frames → `createUtterance` / `write`
- Transcript: `ConversationText` → `setTranscript` / `close({ transcript })`
- Barge-in: `UserStartedSpeaking` → `utterance.cancel()` / `speech.interrupt`

## Required UI

- Experience host (same visual weight as OpenAI / ElevenLabs / basic embed)
- API key field (never stored; demo may also use `DEEPGRAM_API_KEY` env)
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Status copy mentions Deepgram Voice Agent
- Short warning that API keys in the browser are for local demos only
- Link to https://console.deepgram.com/

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same port; one framework at a time via `./start`.

### Next.js note

App Router handlers cannot perform WebSocket upgrades. This example uses a custom `server.mjs` that creates an HTTP server, attaches Next’s request handler **and** `attachDeepgramAgentProxy`, then listens on port 4008 (`npm run dev` → `node server.mjs`).

## Local port

`4008`
