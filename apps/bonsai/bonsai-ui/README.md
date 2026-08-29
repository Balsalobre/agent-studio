# Bonsai UI

A small, framework-agnostic React component library extracted from the **Bonsai** product. Plain CSS variables for theming (no CSS-in-JS, no Tailwind dependency), TypeScript components, light + dark themes.

Built for **Next.js (Pages Router)** but the components are standard React and work anywhere.

---

## What's inside

```
bonsai-ui/
├─ components/        # all .tsx components + index.ts barrel
│  ├─ Button.tsx  Badge.tsx  Chip.tsx  Card.tsx  Avatar.tsx
│  ├─ ProgressBar.tsx  TextField.tsx
│  ├─ Icon.tsx  BonsaiMark.tsx  Wordmark.tsx           # brand
│  ├─ StepCard.tsx  ResourceChip.tsx  ProgressCard.tsx
│  ├─ RecommendationCard.tsx  BonsaiBar.tsx  WorkflowButtons.tsx
│  ├─ Panel.tsx  KPICard.tsx  RankedList.tsx  TopicBars.tsx
│  ├─ GapRow.tsx  DataTable.tsx                        # dashboard
│  ├─ Rail.tsx  RoleSwitcher.tsx                       # navigation
│  ├─ useTheme.ts                                      # light/dark hook
│  └─ index.ts                                         # barrel export
└─ styles/
   └─ globals.css     # design tokens (light + dark) + component styles
```

---

## Install into your Next.js app

1. **Copy** the `bonsai-ui/` folder into your project, e.g. `src/bonsai-ui/`.

2. **Import the stylesheet once**, in `pages/_app.tsx`:

   ```tsx
   import "@/bonsai-ui/styles/globals.css";
   import type { AppProps } from "next/app";

   export default function App({ Component, pageProps }: AppProps) {
     return <Component {...pageProps} />;
   }
   ```

3. **Load the fonts** (the tokens reference *Space Grotesk* and *Hanken Grotesk*).
   With `next/font` in `_app.tsx`:

   ```tsx
   import { Space_Grotesk, Hanken_Grotesk } from "next/font/google";

   const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display-src" });
   const ui = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-ui-src" });
   ```

   …then map them onto the tokens (or just add a `<link>` to Google Fonts — the
   CSS already falls back to system fonts).

4. **Use the components:**

   ```tsx
   import { Button, StepCard, KPICard, useTheme } from "@/bonsai-ui/components";

   export default function Page() {
     const { theme, toggle } = useTheme("dark");
     return (
       <>
         <Button variant="accent" onClick={toggle}>
           Tema: {theme}
         </Button>
         <KPICard label="Preguntas este mes" value="3.482" delta="+12%" trend="up" />
       </>
     );
   }
   ```

---

## Theming

Tokens live on `:root` (dark) with a `[data-theme="light"]` override. Toggle by
setting `data-theme` on `<html>` — the `useTheme` hook does this for you and
persists the choice to `localStorage`.

```tsx
const { theme, setTheme, toggle } = useTheme("dark");
```

Want a different accent? Override one variable anywhere:

```css
:root { --accent: #1E54E8; }
```

Everything (buttons, bars, chips, focus rings, KPI accents…) re-tones from it.

---

## Conventions

- **No `'use client'`** — these are plain components, fine for the Pages Router.
  If you later move to the App Router, add `'use client'` to any file that uses
  state/effects (`TextField`, `useTheme`, and any interactive composition).
- **Styling is class-based** against `globals.css`. Every component also accepts
  `className` (and primitives forward the rest of their native props), so you can
  extend without forking.
- **Icons** are a single `<Icon name="…" />` component; `ICON_NAMES` lists them all.

---

## License

Internal — Released under the MIT License..
