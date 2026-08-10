# OpenAI Realtime embed (vanilla)

Basic coffee-barista experience embed with **OpenAI Realtime** as the speech-to-speech system.

**Prefer npm in bundled apps:** `connectOpenAiRealtime` from `@liforma/client/openai`.  
This vanilla demo keeps a CDN-compatible `bridge.js` that mirrors that helper.

## Files (for developers)

| File | What it is |
|---|---|
| **`@liforma/client/openai`** | Canonical npm helper (`connectOpenAiRealtime`). |
| **`bridge.js`** | CDN/vanilla port of the same helper (no bundler). |
| `app.js` | Demo page shell only (Connect/End UI, arm-then-start flow, modal). |
| `config.js` | Suggested Realtime instructions (barista). |
| `demoClientSecret.js` / `server.mjs` | Demo ephemeral client-secret mint — replace with your backend in production. |

This example uses **WebSocket + ephemeral client secret** so turns match the ElevenLabs `createUtterance` pattern. For OpenAI’s preferred browser **WebRTC** path, see the [OpenAI BYO docs](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/openai).

## Run

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
