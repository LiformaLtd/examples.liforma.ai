# Gemini Live embed — Next.js

| Piece | Role |
| --- | --- |
| **`@liforma/client/google`** | **Read this first.** `connectGeminiLive` — Gemini → Liforma BYO helper. |
| `app/DemoApp.tsx` | Demo Connect / Start UI only. |
| `server.mjs` | Custom HTTP server: Next request handler + Gemini WS proxy on port 4010. |

App Router route handlers **cannot** perform WebSocket upgrades. This example uses a custom `server.mjs` (`npm run dev` → `node server.mjs`) that wraps `next({ dev: true })` and `attachGeminiLiveProxy`.

```ts
import { connectGeminiLive } from '@liforma/client/google';
```

## Run

```bash
cd examples/gemini-live-embed/nextjs && npm install && npm run dev
```

Open **http://localhost:4010**

## Docs

- [Gemini → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/gemini)
