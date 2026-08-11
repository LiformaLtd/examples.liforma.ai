# LiveKit embed — Next.js

**Copy into your product:** `lib/helloByo.ts` (`startByoSpeech`). `app/DemoApp.tsx` is scaffolding only.

```bash
cd examples/livekit-embed/nextjs && npm install
export LIVEKIT_URL=wss://…
export LIVEKIT_API_KEY=…
export LIVEKIT_API_SECRET=…
npm run dev
```

Open http://localhost:4009

| Path | Role |
| --- | --- |
| **`lib/helloByo.ts`** | **Copy this.** Thin `startByoSpeech` → `connectLiveKitAgent` |
| `app/DemoApp.tsx` | Demo scaffolding only (Connect / Start UI) |
| `app/api/livekit-token/route.ts` | Demo token mint — replace in production |

```ts
import { startByoSpeech } from './helloByo';

const bridge = await startByoSpeech(experience, { url, token });
```

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit
