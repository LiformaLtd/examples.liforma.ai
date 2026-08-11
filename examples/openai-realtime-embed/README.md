# OpenAI Realtime embed examples

Coffee-barista embed with OpenAI Realtime as speech-to-speech.

**Copy `*/lib/helloByo.ts` (or `vanilla/helloByo.js`) into your app — that is the integration.**
`DemoApp` / `+page` / `app.js` are scaffolding only (Connect UI, API key form, arming).

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4007 |
| Vanilla HTML | `vanilla/` | http://localhost:4007 |
| Next.js | `nextjs/` | http://localhost:4007 |
| React (Vite) | `react-vite/` | http://localhost:4007 |

Framework ports use `@liforma/client/openai` via `helloByo.ts`. Vanilla `helloByo.js` calls the CDN-compatible `bridge.js`.

**Hosted demo:** https://openai-realtime-embed.examples.liforma.ai/

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
