# Gemini Live embed — React (Vite)

| Piece | Role |
| --- | --- |
| **`@liforma/client/google`** | **Read this first.** `connectGeminiLive` — Gemini → Liforma BYO helper. |
| `src/DemoApp.tsx` | Demo Connect / Start UI only. |
| `vite.config.ts` | Attaches shared WS proxy via `configureServer` / `configurePreviewServer`. |

```ts
import { connectGeminiLive } from '@liforma/client/google';
```

## Run

```bash
cd examples/gemini-live-embed/react-vite && npm install && npm run dev
```

Open **http://localhost:4010**

## Docs

- [Gemini → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/gemini)
