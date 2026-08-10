# Basic embed (Next.js)

Hello-world Next.js App Router embed: one `Experience` and one public experience id.

```bash
npm install
npm run dev
```

Open http://localhost:4001

```tsx
'use client';

import { Experience } from '@liforma/client/react';

export default function Demo() {
  return <Experience experienceId="exp_01EXAMPLES_COFFEE_BARISTA" />;
}
```

Public session mint (no `sessionEndpoint`). For an authenticated App Router mint helper, see `@liforma/client/next` / the guided-practice example.
