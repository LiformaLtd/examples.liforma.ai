# ElevenLabs embed

Basic coffee-barista experience embed with **ElevenLabs Agents** as the speech-to-speech system. Agent PCM is piped into `experience.speech.createUtterance` so the Liforma avatar talks.

## Run

From the examples repo root:

```bash
./start
```

Or only this example:

```bash
PORT=4006 node examples/elevenlabs-embed/vanilla/server.mjs
```

Open **http://localhost:4006**

## Setup

1. Create an [ElevenLabs Agent](https://elevenlabs.io/app/agents).
2. On the example page, **Copy** the suggested **First message** and **System prompt** (coffee barista / Anna) into the agent so the scenario matches the avatar.
3. Create an API key in the ElevenLabs dashboard (**Developers → API Keys**). Copy the full `sk_…` at create-time. If the key is **restricted**, set **ElevenAgents → Write** (signed-URL mint needs write; Read alone is not enough).
4. Unlock the Liforma player, paste Agent ID + API key, then **Start conversation**.

Optional: put the key on the server instead of the form:

```bash
ELEVENLABS_API_KEY=sk_… PORT=4006 node examples/elevenlabs-embed/vanilla/server.mjs
```

Then leave the API key field blank (still enter Agent ID). For **public** agents you can also omit the key entirely and connect with Agent ID alone.

The local `server.mjs` proxies signed-URL minting (`POST /api/elevenlabs-signed-url`) so the browser does not hit ElevenLabs CORS. Treat that as a **local demo** pattern — production apps should mint signed URLs on your own backend and never expose the API key to clients.

Uses production Liforma by default. Demo experiences allow `http://localhost:4006` via the Examples project `4000–4010` origin range.

## Docs

- [ElevenLabs → Liforma](https://docs.liforma.ai/avatar-experiences/bring-your-own-voice/elevenlabs)
