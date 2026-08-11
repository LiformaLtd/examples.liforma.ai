# Gemini Live embed examples

Coffee-barista embed with Google Gemini Live as speech-to-speech.

**Copy `*/lib/helloByo.ts` (or `vanilla/helloByo.js`) into your app — that is the integration.**
`DemoApp` / `+page` / `app.js` are scaffolding only (Connect UI, API key form, arming).

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4010 |
| Vanilla HTML | `vanilla/` | http://localhost:4010 |
| Next.js | `nextjs/` | http://localhost:4010 |
| React (Vite) | `react-vite/` | http://localhost:4010 |

Framework ports use `@liforma/client/google` via `helloByo.ts`. Vanilla `helloByo.js` calls the CDN-compatible `bridge.js`.

**Critical:** Gemini Live needs a **WebSocket proxy** (keep API keys server-side; inject `setup` before client audio). Shared module: `shared/gemini-live-proxy.mjs`.

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/google

Install shared proxy deps once:

```bash
cd examples/gemini-live-embed && npm install
```

Then per-framework `npm install`. Optional:

```bash
export GEMINI_API_KEY=…   # or GOOGLE_API_KEY
# optional: GEMINI_LIVE_MODEL=models/gemini-2.5-flash-native-audio-preview-12-2025
```

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.

## Auth / upstream notes

- Upstream WS: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=…`
- First message after connect must be `setup` (model, AUDIO modality, system instruction, `outputAudioTranscription`). The proxy injects this — `connectGeminiLive` only streams mic + reads `serverContent`.
- Live model ids change frequently; override with `GEMINI_LIVE_MODEL` if Google renames the preview model.
- Production should prefer ephemeral tokens (`v1alpha` / `access_token`) over long-lived API keys in the proxy URL.
