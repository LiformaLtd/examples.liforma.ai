# OpenAI Realtime embed (vanilla)

Coffee-barista embed with **OpenAI Realtime** as speech-to-speech. Agent PCM + transcript are piped into `experience.speech.createUtterance` so the Liforma avatar talks with force-align lipsync when transcript is present.

## Files (for developers)

| File | What it is |
|---|---|
| **`bridge.js`** | **Read this first.** OpenAI Realtime → Liforma BYO integration (`startOpenAiRealtimeLiformaBridge`). |
| `app.js` | Demo page shell only (Connect/End UI, arm-then-start flow, modal). |
| `config.js` | Suggested Realtime instructions (barista). |
| `demoClientSecret.js` / `server.mjs` | Demo ephemeral client-secret mint — replace with your backend in production. |

Same integration idea as `../sveltekit/src/lib/bridge.ts`.

This example uses **WebSocket + ephemeral client secret** so turns match the ElevenLabs `createUtterance` pattern. For OpenAI’s preferred browser **WebRTC** path, see the [OpenAI BYO docs](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai).

## Run

From the examples repo root:

```bash
./start vanilla
```

Or only this example:

```bash
PORT=4007 node examples/openai-realtime-embed/vanilla/server.mjs
```

Open **http://localhost:4007**

Optional:

```bash
OPENAI_API_KEY=sk-… PORT=4007 node examples/openai-realtime-embed/vanilla/server.mjs
```

## Docs

- [OpenAI → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai)
