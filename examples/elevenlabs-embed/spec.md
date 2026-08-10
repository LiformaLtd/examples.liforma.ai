# ElevenLabs embed — spec

## Goal

Same shape as **basic embed**: one coffee-barista experience on the page. ElevenLabs Agents is the speech-to-speech system; Liforma only renders the avatar from ElevenLabs PCM audio (`experience.speech.createUtterance`).

## User flow

1. Page loads and mounts the Liforma experience (presenter mode, mic off).
2. User taps the player start control to unlock avatar audio.
3. Developer enters their ElevenLabs **Agent ID** and **API key** (demo-only; production should mint a signed URL on a server).
4. User taps **Start conversation** — ElevenLabs takes the mic; agent audio is muted on ElevenLabs and forwarded into Liforma.
5. User taps **End conversation** to hang up.

## Liforma integration

```js
const experience = await Experience.startSession({
  experienceId: 'exp_01EXAMPLES_COFFEE_BARISTA',
  mode: 'presenter',
  speechInputMode: 'off'
});
await experience.attach({ container });

// On each ElevenLabs onAudio chunk:
const utterance = experience.speech.createUtterance({
  format: { encoding: 'pcm_s16le', sampleRate, channels: 1 },
  queue: 'replace-active'
});
await utterance.write(pcmChunk);
await utterance.close({ history: 'none' });
```

Critical: `conversation.setVolume({ volume: 0 })` so only the avatar speaks.

## ElevenLabs

- `@elevenlabs/client` via CDN IIFE (`ElevenLabsClient.Conversation`)
- `connectionType: 'websocket'` so `onAudio` emits base64 PCM
- Local example server proxies `POST /api/elevenlabs-signed-url` (API key stays on localhost → ElevenLabs; avoids browser CORS)

## Required UI

- Experience host (same visual weight as basic embed)
- Suggested ElevenLabs **first message** + **system prompt** for the coffee-barista scenario (copy buttons)
- Agent ID + API key fields (Agent ID persisted in IndexedDB; API key never stored; restricted keys need ElevenAgents → Write)
- Start / End conversation controls
- Short warning that API keys in the browser are for local demos only

## Experience

Default: `exp_01EXAMPLES_COFFEE_BARISTA`

## Frameworks

**Vanilla** (`vanilla/`) for v1.

## Local port

`4006`
