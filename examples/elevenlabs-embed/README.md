# ElevenLabs embed examples

Coffee-barista embed with ElevenLabs Agents as speech-to-speech.

**Copy into your product:** `helloByo.ts` / `helloByo.js` (`startByoSpeech`) — the only file that calls `connectElevenLabsAgent`. DemoApp / `+page.svelte` / `app.js` are scaffolding only.

**Integration (npm):** `connectElevenLabsAgent` from `@liforma/client/elevenlabs` (wrapped by `helloByo`).

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4006 |
| Vanilla HTML | `vanilla/` | http://localhost:4006 |
| Next.js | `nextjs/` | http://localhost:4006 |
| React (Vite) | `react-vite/` | http://localhost:4006 |

Framework ports use the SDK helper via `helloByo`. Vanilla keeps a CDN-compatible `bridge.js` that mirrors the same behavior (no bundler).

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
