# ElevenLabs embed — spec

## Goal

Same shape as **basic embed**: one coffee-barista experience on the page. ElevenLabs Agents is the speech-to-speech system; Liforma only renders the avatar from ElevenLabs PCM audio (`experience.speech.createUtterance`).

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. Developer enters their ElevenLabs **Agent ID** and **API key** (demo-only; production should mint a signed URL on a server).
3. User taps **Connect** — validates credentials (mints signed URL when a key is present) and arms the session. The ElevenLabs socket does **not** open yet.
4. User taps the player **Start experience** control — unlocks avatar audio; because Connect already armed, ElevenLabs opens and agent PCM is forwarded into Liforma (ElevenLabs speaker muted).
5. Alternate order: Start first (audio unlocks) without Connect — `onStart` shows a modal directing the user to Connect below; socket opens when they Connect afterward.
6. User taps **End** to hang up or clear an armed-but-not-live connection.

## Code layout

### `vanilla/`

| File | Role |
|---|---|
| **`bridge.js`** | Canonical integration — `startElevenLabsLiformaBridge` |
| `app.js` | Demo UI (Connect arming, modal, form) |
| `config.js` | Suggested agent first message / system prompt |
| `demoSignedUrl.js` / `server.mjs` | Local signed-URL demo only |

### `sveltekit/`

| File | Role |
|---|---|
| **`src/lib/bridge.ts`** | Canonical integration — same pattern as vanilla |
| `src/routes/+page.svelte` | Demo UI |
| `src/lib/config.ts` | Suggested agent prompts |
| `src/routes/api/elevenlabs-signed-url/+server.ts` | Signed-URL demo route |

## Liforma integration

See `vanilla/bridge.js`. Sketch:

```js
const experience = await Experience.startSession({
  experienceId: 'exp_01EXAMPLES_COFFEE_BARISTA',
  mode: 'presenter',
  speechInputMode: 'off'
});
await experience.attach({ container });

const bridge = await startElevenLabsLiformaBridge({
  experience,
  signedUrl // or agentId for public agents
});
// bridge.end() when done
```

Critical: `conversation.setVolume({ volume: 0 })` so only the avatar speaks (done inside the bridge).

## ElevenLabs

- `@elevenlabs/client` via CDN IIFE (`ElevenLabsClient.Conversation`)
- `connectionType: 'websocket'` so `onAudio` emits base64 PCM
- Local example server proxies `POST /api/elevenlabs-signed-url` (API key stays on localhost → ElevenLabs; avoids browser CORS)

## Required UI

- Experience host (same visual weight as basic embed)
- Suggested ElevenLabs **first message** + **system prompt** for the coffee-barista scenario (copy buttons)
- Agent ID + API key fields (Agent ID persisted in IndexedDB; API key never stored; restricted keys need ElevenAgents → Write)
- Connect / End controls (Connect arms; Start on the player opens the bridge)
- Short warning that API keys in the browser are for local demos only

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla** (`vanilla/`) and **SvelteKit** (`sveltekit/`) — same port; `./start vanilla` vs `./start sveltekit`.

## Local port

`4006`
