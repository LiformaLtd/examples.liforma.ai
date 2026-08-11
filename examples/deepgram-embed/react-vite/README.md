# Deepgram Voice Agent embed — React (Vite)

| Piece | Role |
| --- | --- |
| **`@liforma/client/deepgram`** | **Read this first.** `connectDeepgramAgent` — Deepgram → Liforma BYO helper. |
| `src/DemoApp.tsx` | Demo Connect / Start UI only. |
| `vite.config.ts` | Attaches shared WS proxy via `configureServer` / `configurePreviewServer`. |

```ts
import { connectDeepgramAgent } from '@liforma/client/deepgram';
```

## Run

```bash
cd examples/deepgram-embed/react-vite && npm install && npm run dev
```

Open **http://localhost:4008**

## Docs

- [Deepgram → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram)
