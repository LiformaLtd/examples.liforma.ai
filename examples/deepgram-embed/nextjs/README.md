# Deepgram Voice Agent embed — Next.js

| Piece | Role |
| --- | --- |
| **`@liforma/client/deepgram`** | **Read this first.** `connectDeepgramAgent` — Deepgram → Liforma BYO helper. |
| `app/DemoApp.tsx` | Demo Connect / Start UI only. |
| `server.mjs` | Custom HTTP server: Next request handler + Deepgram WS proxy on port 4008. |

App Router route handlers **cannot** perform WebSocket upgrades. This example uses a custom `server.mjs` (`npm run dev` → `node server.mjs`) that wraps `next({ dev: true })` and `attachDeepgramAgentProxy`.

```ts
import { connectDeepgramAgent } from '@liforma/client/deepgram';
```

## Run

```bash
cd examples/deepgram-embed/nextjs && npm install && npm run dev
```

Open **http://localhost:4008**

## Docs

- [Deepgram → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/deepgram)
