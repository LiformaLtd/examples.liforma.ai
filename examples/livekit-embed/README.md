# LiveKit embed examples

Coffee-barista embed with LiveKit remote agent audio as bring-your-own voice.

**Copy into your product:** `helloByo.ts` / `helloByo.js` (`startByoSpeech`) — the only file that calls `connectLiveKitAgent`. DemoApp / `+page.svelte` / `app.js` are scaffolding only.

**Integration (npm):** `connectLiveKitAgent` from `@liforma/client/livekit` (wrapped by `helloByo`)  
**Peer:** `livekit-client`

| Framework | Folder | Local URL |
| --- | --- | --- |
| SvelteKit | `sveltekit/` | http://localhost:4009 |
| Vanilla HTML | `vanilla/` | http://localhost:4009 |
| Next.js | `nextjs/` | http://localhost:4009 |
| React (Vite) | `react-vite/` | http://localhost:4009 |

Docs: https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/livekit

Install shared token-mint deps once:

```bash
cd examples/livekit-embed && npm install
```

Then per-framework `npm install`. Set server env before starting:

```bash
export LIVEKIT_URL=wss://your-project.livekit.cloud
export LIVEKIT_API_KEY=…
export LIVEKIT_API_SECRET=…
```

**Hosted demo:** https://livekit-embed.examples.liforma.ai/

From the repo root: `./start`, `./start sveltekit`, `./start nextjs`, or `./start react-vite`.

**Note:** An agent (or remote participant whose identity starts with `agent`) must publish audio in the room for the avatar to lip-sync.
