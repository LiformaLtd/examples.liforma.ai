# Guided practice (Speak API)

Marvely-style scripted practice: host calls `speak()`, learner responds with manual mic control.

## Run

From repo root:

```bash
./start
```

Or only this example:

```bash
npx serve . -l tcp://localhost:4003
```

Open **http://localhost:4003**

Uses production Liforma (`cdn.liforma.ai`, `api.liforma.ai`, `player.liforma.ai`). Demo experiences allow `http://localhost:4003`. For your own `exp_…`, add that origin in the developer portal.
