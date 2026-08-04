# Spanish Tutor (vanilla)

Static HTML/CSS/JS lesson picker with the Liforma web component.

## Run

From repo root:

```bash
./start
```

Or only this example:

```bash
npx serve . -l tcp://localhost:4002
```

http://localhost:4002

## Live lesson catalog

`./start` serves vanilla with static fallback lessons. `./start sveltekit` runs the SvelteKit app on the same port (**4002**) with the API-backed catalog — only one framework runs at a time.
