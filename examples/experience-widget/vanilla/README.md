# Experience widget (vanilla)

Until the ExperienceWidget ships on production CDN, run against the **local** Liforma stack:

```bash
# from examples.liforma.ai repo root (starts api :3001, player :3002, cdn :3010)
./start --local --restart
```

Open **http://localhost:4002** (hard refresh if an old Spanish Tutor tab was open).

`?stack=local` alone is not enough — the page must load `client.js` from `http://localhost:3010` (done automatically by `LIFORMA_STACK=local` serve).

## Production CDN (after publish)

```bash
PORT=4002 node scripts/serve-example.mjs examples/experience-widget/vanilla
```

Uses production Liforma by default. Demo experiences allow `http://localhost:4002` via the Examples project `4000-4010` origin range.
