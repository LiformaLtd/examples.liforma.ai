# OpenAI Realtime embed — spec

## Goal

Same shape as **ElevenLabs embed**: one coffee-barista experience on the page. OpenAI Realtime is the speech-to-speech system; Liforma only renders the avatar from OpenAI PCM audio (`experience.speech.createUtterance`) with optional transcript force-align.

## Why WebSocket (not WebRTC) in this example

OpenAI recommends **WebRTC** for browser media. This example uses **WebSocket + ephemeral client secret** so agent PCM and transcript map onto the same per-turn `createUtterance` / `write` / `setTranscript` / `close` pattern as the ElevenLabs example (clear turn boundaries for force-align STA).

For the WebRTC + `createUtterance({ track })` / `speech.play({ track })` path, see:

https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. Developer pastes an OpenAI **API key** (demo-only; production mints an ephemeral client secret on a server).
3. User taps **Connect** — mints an ephemeral Realtime client secret and arms the session. The OpenAI socket does **not** open yet.
4. User taps the player **Start experience** control — unlocks avatar audio; because Connect already armed, OpenAI WebSocket opens, mic streams to Realtime, and agent PCM is forwarded into Liforma (no duplicate OpenAI speaker).
5. Alternate order: Start first without Connect — modal directs the user to Connect below.
6. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

| Surface | Role |
|---|---|
| **`@liforma/client/openai`** | Canonical integration — `connectOpenAiRealtime` |
| Framework `DemoApp` / `+page.svelte` | Demo UI (Connect arming, modal, form) |
| `vanilla/bridge.js` | CDN/vanilla port of the same helper |
| Demo API routes / `server.mjs` | Ephemeral client-secret mint only (replace in production) |

## Liforma integration

```ts
import { connectOpenAiRealtime } from '@liforma/client/openai';

// After Experience started (audio unlocked):
const bridge = await connectOpenAiRealtime(experience, {
  ephemeralKey, // from POST /api/openai-realtime-session
  instructions: '…' // optional; demos pass barista copy
});
// bridge.end() when done
```

## OpenAI

- Browser WebSocket to `wss://api.openai.com/v1/realtime` authenticated with an **ephemeral** client secret
- Local example server proxies `POST /api/openai-realtime-session` (standard `OPENAI_API_KEY` stays on localhost → OpenAI)
- Model: `gpt-realtime-2.1` (override via env `OPENAI_REALTIME_MODEL`)
- Agent output: `response.output_audio.delta` → `createUtterance` / `write`
- Transcript: `response.output_audio_transcript.*` → `setTranscript` / `close({ transcript })`
- Barge-in: `input_audio_buffer.speech_started` → `utterance.cancel()` / `speech.interrupt`

## Required UI

- Experience host (same visual weight as ElevenLabs / basic embed)
- Suggested Realtime **instructions** for the coffee-barista scenario (copy button)
- API key field (never stored; demo may also use `OPENAI_API_KEY` env)
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Short warning that API keys in the browser are for local demos only

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla**, **SvelteKit**, **Next.js**, and **React (Vite)** — same port; one framework at a time via `./start`.

## Local port

`4007`
