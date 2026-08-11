# Gemini Live embed — SvelteKit

| Piece | Role |
| --- | --- |
| **`@liforma/client/google`** | **Read this first.** `connectGeminiLive` — Gemini → Liforma BYO helper. |
| `src/routes/+page.svelte` | Demo Connect / Start UI only. |
| `src/lib/config.ts` | Suggested `Settings.agent` defaults. |
| `vite.config.ts` | Attaches shared WS proxy (SvelteKit HTTP handlers cannot do WS upgrade). |

```ts
import { connectGeminiLive } from '@liforma/client/google';
```

## Run

```bash
cd examples/gemini-live-embed/sveltekit && npm install && npm run dev
```

Open **http://localhost:4010**

Optional: `GEMINI_API_KEY=… npm run dev`

## Docs

- [Gemini → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/gemini)
- [Gemini console](https://aistudio.google.com/apikey)
