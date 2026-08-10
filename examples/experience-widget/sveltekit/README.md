# Experience widget (SvelteKit)

SvelteKit marketing-page demo of **`ExperienceWidget`** as a bottom-right site launcher. Collapsed state is thumb-only (plates from the public preview API); click expands an in-page experience overlay.

## Integration

```svelte
<script lang="ts">
  import { ExperienceWidget } from '@liforma/client/svelte';
</script>

<ExperienceWidget
  experienceId="exp_01EXAMPLES_COFFEE_BARISTA"
  alt="Talk to our coffee barista"
  position="bottom-right"
  offset={16}
  prefetch="idle"
/>
```

Same idea as `../vanilla/index.html` (`<liforma-experience-widget>`).

## Run

From the examples repo root:

```bash
./start sveltekit
```

Or only this example:

```bash
cd examples/experience-widget/sveltekit && npm install && npm run dev
```

Open **http://localhost:4002**

## Docs

- [Experience widget](https://docs.liforma.ai/avatar-experiences/experience-widget) (if published)
- Gallery: http://localhost:4000/examples/experience-widget/sveltekit
