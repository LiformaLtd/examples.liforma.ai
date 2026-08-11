# Gemini Live embed — Vanilla

Coffee-barista embed with Gemini Live as speech-to-speech.

**Prefer npm in bundled apps:** `connectGeminiLive` from `@liforma/client/google`.  
This folder keeps a CDN-compatible `bridge.js` that mirrors the same helper.

| Piece | Role |
| --- | --- |
| **`@liforma/client/google`** | Canonical npm helper (`connectGeminiLive`). |
| `bridge.js` | CDN/vanilla port of that helper. |
| `app.js` | Demo Connect / Start UI only. |
| `server.mjs` + `../shared/gemini-live-proxy.mjs` | Same-origin WS proxy (demo-only). |

## Run

From `examples.liforma.ai`:

```bash
cd examples/gemini-live-embed && npm install
cd vanilla && PORT=4010 node server.mjs
```

Open **http://localhost:4010**

Optional: `GEMINI_API_KEY=… PORT=4010 node server.mjs`

## Docs

- [Gemini → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/gemini)
- [Gemini console](https://aistudio.google.com/apikey)
