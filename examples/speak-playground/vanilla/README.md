# Speak playground

Type text and hear the experience speak it via `Experience.speak()`. Toggle **Enqueue** vs **Interrupt** to see how `behavior` affects playback when you send several lines quickly.

## Run

From repo root:

```bash
./start
```

Or only this example:

```bash
PORT=4005 node scripts/serve-example.mjs examples/speak-playground/vanilla
```

Open **http://localhost:4005**

Uses production Liforma by default. Demo experiences allow `http://localhost:4005`. For your own `exp_…`, add that origin in the developer portal.
