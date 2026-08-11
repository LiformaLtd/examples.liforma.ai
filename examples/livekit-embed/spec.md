# LiveKit embed — spec

## Goal

Same shape as **OpenAI Realtime embed** / **Deepgram embed**: one coffee-barista experience on the page. LiveKit is the voice source; Liforma renders the avatar from a remote `MediaStreamTrack` via `experience.speech.createUtterance({ track })` (+ optional `lk.transcription` → `setTranscript`).

## Why HTTP token mint (not a WS proxy)

LiveKit browsers join with a **participant JWT**. This example:

1. Browser `POST /api/livekit-token` (optional `roomName` / `identity`).
2. Server mints with `livekit-server-sdk` `AccessToken` using `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.
3. Returns `{ url, token }`.
4. After Start (audio unlock), host calls `startByoSpeech(experience, { url, token })` (from `helloByo`).

Shared mint: `shared/mint-livekit-token.mjs`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. User sets room / identity (optional) and taps **Connect** — mints token and arms. The LiveKit room does **not** join yet.
3. User taps **Start experience** — unlocks avatar audio; because Connect already armed, `startByoSpeech` joins and bridges agent tracks.
4. Alternate order: Start first without Connect — modal directs the user to Connect below.
5. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

| Surface | Role |
|---|---|
| **`helloByo.ts` / `helloByo.js`** | **Copy into product** — thin `startByoSpeech` (only caller of connect) |
| **`@liforma/client/livekit`** | Canonical SDK helper — `connectLiveKitAgent` |
| Framework `DemoApp` / `+page.svelte` / `app.js` | Demo scaffolding only (Connect arming, modal, form) |
| `vanilla/bridge.js` | CDN/vanilla port (import map → `livekit-client`; wrapped by vanilla `helloByo.js`) |
| `shared/mint-livekit-token.mjs` | Token mint + Vite middleware |
| Demo API routes / `server.mjs` | `POST /api/livekit-token` |

## Liforma integration

```ts
import { startByoSpeech } from './helloByo';

// After Experience started (audio unlocked):
const bridge = await startByoSpeech(experience, {
  url,   // from POST /api/livekit-token
  token, // from POST /api/livekit-token
  onLog,
  onDisconnect,
  onError
});
// bridge.end() when done
```

## LiveKit

- Env: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Mint: `POST /api/livekit-token` → `{ url, token, roomName, identity }`
- Default bridge filter: remote identities starting with `agent`
- Audio → `createUtterance({ track, sampleRate: 48_000, queue: 'replace-active' })`
- Transcript → `lk.transcription` text stream → `utterance.setTranscript` (default on; disable with `enableTranscript: false`)
- Do **not** also attach that track to an `<audio>` element

## Required UI

- Experience host (same visual weight as OpenAI / Deepgram / basic embed)
- Room name + participant identity fields
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Status copy mentions LiveKit
- Link to https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same port; one framework at a time via `./start`.

## Local port

`4009`
