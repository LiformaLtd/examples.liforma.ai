# Basic embed (React + Vite)

Hello-world React (Vite) embed: one `Experience` and one public experience id.

```bash
npm install
npm run dev
```

Open http://localhost:4001

```tsx
import { Experience } from '@liforma/client/react';

export function Demo() {
  return <Experience experienceId="exp_t0i7acmq" />;
}
```

Public session mint (no `sessionEndpoint`).
