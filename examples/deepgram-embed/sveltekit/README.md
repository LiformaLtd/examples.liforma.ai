# Deepgram Voice Agent embed — SvelteKit

| Piece | Role |
| --- | --- |
| **`@liforma/client/deepgram`** | **Read this first.** `connectDeepgramAgent` — Deepgram → Liforma BYO helper. |
| `src/routes/+page.svelte` | Demo Connect / Start UI only. |
| `src/lib/config.ts` | Suggested `Settings.agent` defaults. |
| `vite.config.ts` | Attaches shared WS proxy (SvelteKit HTTP handlers cannot do WS upgrade). |

```ts
import { connectDeepgramAgent } from '@liforma/client/deepgram';
```

## Run

```bash
cd examples/deepgram-embed/sveltekit && npm install && npm run dev
```

Open **http://localhost:4008**

Optional: `DEEPGRAM_API_KEY=… npm run dev`

## Docs

- [Deepgram → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram)
- [Deepgram console](https://console.deepgram.com/)
