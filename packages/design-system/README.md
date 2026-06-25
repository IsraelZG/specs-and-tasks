# Design System

Multi-platform, themable design system. Built on Style Dictionary so a single source of tokens produces CSS, JS/TS, React Native, Swift (iOS) and XML (Android) outputs.

The system is split into three layers — the most important architectural decision in the whole thing:

```
┌─────────────────────────────────────────────────────────┐
│  COMPONENTS                                             │
│  Use semantic tokens ONLY. Never reference layers below.│
└─────────────────────────────────────────────────────────┘
                          ▲ depends on
┌─────────────────────────────────────────────────────────┐
│  SEMANTIC LAYER  ·  tokens/semantic/                    │
│  component.button.primary.bg, focusRing.color, etc.     │
│  Stable contract. Same names in every theme.            │
└─────────────────────────────────────────────────────────┘
                          ▲ depends on
┌──────────────────────────────┬──────────────────────────┐
│  THEME PRIMITIVES            │  GLOBAL PRIMITIVES       │
│  tokens/themes/{light,dark}  │  tokens/global/          │
│  Surfaces, content, borders, │  Color scales, spacing,  │
│  shadows, intents — vary per │  radii, typography,      │
│  theme.                      │  motion — never vary.    │
└──────────────────────────────┴──────────────────────────┘
```

**Why this matters for white-label:** swapping a client's brand only touches the theme layer. Components keep working without any change.

---

## Quick start

```bash
npm install
npm run build      # writes build/web/, build/react-native/, build/ios/, build/android/, build/tv/
```

Then in your web app:

```html
<link rel="stylesheet" href="./build/web/theme-light.css" />
<link rel="stylesheet" href="./build/web/theme-dark.css" />

<html data-theme="light">  <!-- or "dark" -->
```

```css
.btn-primary {
  background: var(--ds-component-button-primary-bg);
  color: var(--ds-component-button-primary-text);
  border-radius: var(--ds-component-button-radius);
  height: var(--ds-component-button-height-md);
  padding-inline: var(--ds-component-button-padding-x-md);
  font-weight: var(--ds-component-button-font-weight);
  transition: background var(--ds-motion-preset-hover);
}
.btn-primary:hover { background: var(--ds-component-button-primary-bg-hover); }
```

That's it. Switching `data-theme` instantly re-themes everything.

---

## Token layers in detail

### 1. Global primitives  ·  `tokens/global/`

Theme-independent raw values. Never reference these directly in product code — they have no semantic meaning.

| File             | Contents                                                        |
|------------------|-----------------------------------------------------------------|
| `color.json`     | Seven color families (neutral, lavender, blush, sage, amber, coral, ocean) each with a 50→950 scale. |
| `dimension.json` | Spacing scale (base-4), radius scale (`none`→`pill`), border widths, control/icon/avatar sizes, breakpoints, z-index. |
| `typography.json`| Font families, weights, sizes, line-heights, letter-spacing, and composite `textStyle.*` tokens (displayXl, headingLg, bodyMd, label, code, etc.). |
| `motion.json`    | Durations, easings, motion presets.                              |

### 2. Theme primitives  ·  `tokens/themes/light/` and `tokens/themes/dark/`

The same shape in both themes. This is the layer that varies.

| Token group         | Purpose                                                                |
|---------------------|------------------------------------------------------------------------|
| `theme.surface.*`   | `canvas`, `subdued`, `default`, `raised`, `overlay`, `floating`, `inverse`, plus `glassTint`, `glassBorder`, `scrim`. |
| `theme.content.*`   | `strong`, `default`, `muted`, `subtle`, `disabled`, `onInverse`, `onAccent`, `link`. |
| `theme.border.*`    | `subtle`, `default`, `strong`, `focus`, `inverse`.                     |
| `theme.intent.*`    | Seven intents (`primary`, `accent`, `success`, `warning`, `danger`, `info`, `blush`) each with `fill`/`fillHover`/`onFill`/`subtle`/`onSubtle`/`border`/`strong`. |
| `theme.shadow.*`    | `xs`→`2xl`, `inner`, `focus`, `focusDanger`. Dark-theme shadows are deeper and more saturated. |
| `theme.blur.*`      | Backdrop-filter blur scale for glassmorphism.                          |
| `theme.gradient.*`  | Named atmospheric gradients (auroraSoft, lavenderMist…).               |

### 3. Semantic layer  ·  `tokens/semantic/components.json`

Component-level tokens. **This is what components import.** It pulls from theme primitives so a single component definition works in every theme.

Examples:
- `component.button.primary.bg` → `theme.intent.primary.fill`
- `component.card.shadow` → `theme.shadow.sm`
- `component.message.bgSent` → `theme.intent.primary.fill`
- `focusRing.color` → `theme.border.focus`

If a redesign wants chunkier buttons, you only touch `component.button.*`. Theme switching, white-labelling, and per-component tweaks are now independent axes.

---

## White-label / custom themes

Each new client = one new file in `tokens/themes/<client-name>/theme.json` with the same shape as `light` / `dark`. Common overrides:

```json
{
  "theme": {
    "intent": {
      "primary": {
        "fill":      { "value": "#FF5A1F" },
        "fillHover": { "value": "#E94B12" },
        "onFill":    { "value": "#FFFFFF" }
      },
      "accent": {
        "fill":      { "value": "#0F172A" },
        "onFill":    { "value": "#FFFFFF" }
      }
    }
  }
}
```

Optional overrides clients usually want:
- `theme.gradient.*` — branded hero gradients
- `radius.*` (in `global/dimension.json`) — go from `pill`-heavy to squared corners
- `font.family.*` — custom typefaces

For per-client global overrides (radius scale, fonts), add a `tokens/themes/<client>/overrides.json` that re-defines just the keys you need, and Style Dictionary will pick the last value in the source order.

---

## Density modes (productivity vs general public)

The same theme runs in two density modes via a data attribute:

```html
<html data-theme="light" data-density="compact">    <!-- corporate productivity -->
<html data-theme="light" data-density="cozy">       <!-- general public, default -->
<html data-theme="light" data-density="tv">         <!-- embedded / 10-foot UI -->
```

A small CSS layer (see `docs/density.css`) multiplies control heights, paddings, and font sizes per mode without touching tokens.

---

## Platform outputs

After `npm run build`:

```
build/
├── web/
│   ├── theme-light.css      ← scoped to :root[data-theme="light"]
│   ├── theme-dark.css       ← scoped to :root[data-theme="dark"]
│   ├── theme-light.js       ← ES module
│   └── theme-light.d.ts     ← TypeScript types
├── react-native/
│   └── theme-{light,dark}.js + .d.ts
├── ios/
│   └── Theme{Light,Dark}.swift
├── android/
│   └── theme_{light,dark}_{colors,dimens}.xml
└── tv/
    └── theme-{light,dark}-tv.css
```

---

## Naming convention

`<category>-<subcategory>-<role>[-<state>]`

- `--ds-color-lavender-500` — primitive (avoid in product code)
- `--ds-theme-surface-raised` — theme primitive
- `--ds-component-button-primary-bg` — semantic ✅ use this
- `--ds-component-button-primary-bg-hover` — semantic ✅ use this

The `--ds-` prefix is configurable in `style-dictionary.config.js`.

---

## Accessibility baseline

- Every interactive component pulls focus styling from `focusRing.*` — never style focus per-component.
- Content tokens are paired with surface tokens so contrast is preserved across themes (verified against WCAG AA at 4.5:1 for body text, 3:1 for large text). When introducing a new color family, run the contrast checker before adding intent tokens.
- Motion presets respect `prefers-reduced-motion` — global CSS in `docs/reset.css` cancels durations above `fast` when the user prefers reduced motion.

---

## Where to look next

- `docs/showcase.html` — every token rendered visually in both themes
- `docs/density.css` — density-mode overrides
- `docs/reset.css` — minimal reset + motion preferences
- `style-dictionary.config.js` — build config, easy to extend
