# OpenAI Realtime embed examples

Coffee-barista embed with OpenAI Realtime as speech-to-speech.

**Integration (npm):** `connectOpenAiRealtime` from `@liforma/client/openai`.

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4007 |
| Vanilla HTML | `vanilla/` | http://localhost:4007 |
| Next.js | `nextjs/` | http://localhost:4007 |
| React (Vite) | `react-vite/` | http://localhost:4007 |

Framework ports use the SDK helper. Vanilla keeps a CDN-compatible `bridge.js` that mirrors the same behavior (no bundler).

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
