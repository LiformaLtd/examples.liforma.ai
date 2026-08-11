# Deepgram Voice Agent embed examples

Coffee-barista embed with Deepgram Voice Agent as speech-to-speech.

**Copy `*/lib/helloByo.ts` (or `vanilla/helloByo.js`) into your app — that is the integration.**
`DemoApp` / `+page` / `app.js` are scaffolding only (Connect UI, API key form, arming).

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4008 |
| Vanilla HTML | `vanilla/` | http://localhost:4008 |
| Next.js | `nextjs/` | http://localhost:4008 |
| React (Vite) | `react-vite/` | http://localhost:4008 |

Framework ports use `@liforma/client/deepgram` via `helloByo.ts`. Vanilla `helloByo.js` calls the CDN-compatible `bridge.js`.

**Critical:** Deepgram needs a **WebSocket proxy** (browsers cannot set `Authorization` on WebSocket). Shared module: `shared/deepgram-agent-proxy.mjs`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram

**Hosted demo:** https://deepgram-embed.examples.liforma.ai/ shows a clone/run notice (the WS proxy cannot run on Vercel serverless). For Connect → Start, run locally on port `4008`.

Install shared proxy deps once:

```bash
cd examples/deepgram-embed && npm install
```

Then per-framework `npm install` as usual. From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
