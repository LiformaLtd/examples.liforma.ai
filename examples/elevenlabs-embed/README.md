# ElevenLabs embed examples

Coffee-barista embed with ElevenLabs Agents as speech-to-speech.

**Integration (npm):** `connectElevenLabsAgent` from `@liforma/client/elevenlabs`.

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4006 |
| Vanilla HTML | `vanilla/` | http://localhost:4006 |
| Next.js | `nextjs/` | http://localhost:4006 |
| React (Vite) | `react-vite/` | http://localhost:4006 |

Framework ports use the SDK helper. Vanilla keeps a CDN-compatible `bridge.js` that mirrors the same behavior (no bundler).

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.
