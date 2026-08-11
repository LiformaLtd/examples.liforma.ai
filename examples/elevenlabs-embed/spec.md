# ElevenLabs embed — spec

## Goal

Same shape as **basic embed**: one coffee-barista experience on the page. ElevenLabs Agents is the speech-to-speech system; Liforma only renders the avatar from ElevenLabs PCM audio (`experience.speech.createUtterance`).

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. Developer enters their ElevenLabs **Agent ID** and **API key** (demo-only; production should mint a signed URL on a server).
3. User taps **Connect** — validates credentials (mints signed URL when a key is present) and arms the session. The ElevenLabs socket does **not** open yet.
4. User taps the player **Start experience** control — unlocks avatar audio; because Connect already armed, ElevenLabs opens and agent PCM is forwarded into Liforma (ElevenLabs speaker muted).
5. Alternate order: Start first (audio unlocks) without Connect — `onStart` shows a modal directing the user to Connect below; socket opens when they Connect afterward.
6. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

| Surface | Role |
|---|---|
| **`helloByo.ts` / `helloByo.js`** | **Copy into product** — thin `startByoSpeech` (only caller of connect) |
| **`@liforma/client/elevenlabs`** | Canonical SDK helper — `connectElevenLabsAgent` |
| Framework `DemoApp` / `+page.svelte` / `app.js` | Demo scaffolding only (Connect arming, modal, form) |
| `vanilla/bridge.js` | CDN/vanilla port of the same helper (wrapped by vanilla `helloByo.js`) |
| Demo API routes / `server.mjs` | Signed-URL mint only (replace in production) |

## Liforma integration

```ts
import { startByoSpeech } from './helloByo';

// After Experience started (audio unlocked):
const bridge = await startByoSpeech(experience, {
  signedUrl // or agentId for public agents
});
// bridge.end() when done
```

Critical: the helper calls `conversation.setVolume({ volume: 0 })` so only the avatar speaks.

## ElevenLabs

- `@elevenlabs/client` (npm) or CDN IIFE (`ElevenLabsClient.Conversation`) in vanilla
- `connectionType: 'websocket'` so `onAudio` emits base64 PCM
- Local example servers proxy `POST /api/elevenlabs-signed-url` (API key stays on localhost → ElevenLabs; avoids browser CORS)

## Required UI

- Experience host (same visual weight as basic embed)
- Suggested ElevenLabs **first message** + **system prompt** for the coffee-barista scenario (copy buttons)
- Agent ID + API key fields (Agent ID persisted in IndexedDB; API key never stored; restricted keys need ElevenAgents → Write)
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Short warning that API keys in the browser are for local demos only

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same port; one framework at a time via `./start`.

## Local port

`4006`
