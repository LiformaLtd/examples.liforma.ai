# Experience widget (Next.js)

Marketing page with a bottom-right **`ExperienceWidget`** launcher. Collapsed state is thumb-only (plates from the public preview API); click expands an in-page experience overlay.

## Integration

```tsx
'use client';

import { ExperienceWidget } from '@liforma/client/react';

export default function Demo() {
  return (
    <ExperienceWidget
      experienceId="exp_01EXAMPLES_COFFEE_BARISTA"
      alt="Talk to our coffee barista"
      position="bottom-right"
      offset={16}
      prefetch="idle"
    />
  );
}
```

Import from `@liforma/client/react` (not `/next`). Same idea as the SvelteKit and vanilla `<liforma-experience-widget>` examples.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:4002
