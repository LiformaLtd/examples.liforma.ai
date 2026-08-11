# Deepgram Voice Agent embed — Vanilla

Coffee-barista embed with Deepgram Voice Agent as speech-to-speech.

**Prefer npm in bundled apps:** `connectDeepgramAgent` from `@liforma/client/deepgram`.  
This folder keeps a CDN-compatible `bridge.js` that mirrors the same helper.

| Piece | Role |
| --- | --- |
| **`@liforma/client/deepgram`** | Canonical npm helper (`connectDeepgramAgent`). |
| `bridge.js` | CDN/vanilla port of that helper. |
| `app.js` | Demo Connect / Start UI only. |
| `server.mjs` + `../shared/deepgram-agent-proxy.mjs` | Same-origin WS proxy (demo-only). |

## Run

From `examples.liforma.ai`:

```bash
cd examples/deepgram-embed && npm install
cd vanilla && PORT=4008 node server.mjs
```

Open **http://localhost:4008**

Optional: `DEEPGRAM_API_KEY=… PORT=4008 node server.mjs`

## Docs

- [Deepgram → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram)
- [Deepgram console](https://console.deepgram.com/)
