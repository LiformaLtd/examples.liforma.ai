# OpenAI Realtime embed (SvelteKit)

SvelteKit coffee-barista embed with **OpenAI Realtime** as speech-to-speech. Agent PCM + transcript are piped into `experience.speech.createUtterance` so the Liforma avatar talks with force-align lipsync when transcript is present.

## Files (for developers)

| File | What it is |
|---|---|
| **`src/lib/bridge.ts`** | **Read this first.** OpenAI Realtime → Liforma BYO integration (`startOpenAiRealtimeLiformaBridge`). Copy this pattern into your app. |
| `src/routes/+page.svelte` | Demo page shell only (Connect/End UI, arm-then-start flow, modal). |
| `src/lib/config.ts` | Suggested Realtime instructions (barista). |
| `src/lib/demoClientSecret.ts` | Client helper for the demo API route. |
| `src/routes/api/openai-realtime-session/+server.ts` | Demo ephemeral client-secret mint — replace with your backend in production. |

Same integration idea as `../vanilla/bridge.js`.

This example uses **WebSocket + ephemeral client secret** so turns match the ElevenLabs `createUtterance` pattern. For OpenAI’s preferred browser **WebRTC** path, see the [OpenAI BYO docs](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai).

## Run

From the examples repo root:

```bash
./start sveltekit
```

Or only this example:

```bash
cd examples/openai-realtime-embed/sveltekit && npm install && npm run dev
```

Open **http://localhost:4007**

## Setup

1. Create an [OpenAI API key](https://platform.openai.com/api-keys) with Realtime access.
2. Optionally review the suggested **Instructions** on the page (applied at mint + `session.update`).
3. Paste the API key (or set `OPENAI_API_KEY`), click **Connect**, then tap **Start experience** on the avatar.
4. Allow microphone access when prompted (OpenAI owns the mic; Liforma `speechInputMode` is off).

Optional server-side key:

```bash
OPENAI_API_KEY=sk-… npm run dev
```

Then leave the API key field blank.

## Docs

- [OpenAI → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai)
