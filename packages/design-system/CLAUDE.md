# Instructions for AI agents working in this repo

You are an AI agent generating, modifying, or reviewing UI code in this repository. This file is the contract you follow. Read it before producing any UI.

The companion file `AGENTS.md` is a symlink to this one — both Claude Code and other agents read from the same source.

---

## Why this file exists

Design systems were written for humans. Humans read prose like "avoid multiple primary buttons" and *infer* the principle behind it. You can't. You read this repo as text, and unless rules are encoded as structured data you can query, you will:

- invent components that don't exist
- pick the wrong variant
- nest components in ways that break accessibility
- bypass the token layer and hardcode colors
- use the right component for the wrong reason

To prevent that, every component ships a `<Component>.metadata.ts` file next to its source. A single index — `src/metadata/components.index.json` — lists every component so you can discover what exists in ~100 tokens per component before reading anything else.

**You MUST consult these files before generating UI code.** The workflow below is mandatory, not a suggestion.

---

## Mandatory workflow

For any task that adds, modifies, or reviews UI code:

### Step 1. Read the index first
Open `src/metadata/components.index.json`. Scan it. Identify components whose `useCases`, `keywords`, or `description` match the user's request. This is your candidate list.

If nothing matches and the user's request is genuinely novel, flag it: *"None of the existing components cover X. I can propose a new component with metadata, or compose existing ones — which do you prefer?"* Do NOT silently invent a component.

### Step 2. Read full metadata for top candidates
Open `<Component>.metadata.ts` for each candidate (the index has `metadataPath`). Walk the file in this order:

1. **`usage.useCases`** — does this component cover the case?
2. **`usage.antiPatterns`** — is the use I'm about to make on the forbidden list?
3. **`aiHints.selectionCriteria`** — answer each question for the current context. If multiple criteria conflict, surface the conflict to the user.
4. **`aiHints.disambiguateFrom`** — am I confusing this with another component?
5. **`variants[*].purpose`** — pick the variant whose purpose matches, not the one that "looks right".
6. **`composition.parentConstraints` / `forbiddenParents`** — verify the placement is allowed.
7. **`props`** — use the typed contract. Don't pass props that aren't listed.
8. **`tokens.semantic`** — these are the ONLY tokens this component reads. Don't add new color/spacing/radius outside this list.

### Step 3. Validate against anti-patterns before writing code
Before emitting JSX, mentally run through each `antiPattern.scenario` for every component you're using. If you match one, change course and document why.

### Step 4. Use only semantic tokens
Components and feature code consume tokens from `tokens/semantic/components.json`. Never write hex literals, raw px values, or reach into `tokens/global/` directly. If a value you need isn't in the semantic layer, that's a signal to either:
- find the right existing semantic token, or
- flag a gap and propose adding one (instead of bypassing the system).

### Step 5. Respect the three architecture layers
```
Components  →  Semantic tokens  →  Theme primitives  →  Global primitives
(consume)      (component.*)      (theme.*)            (color.*, spacing.*)
```
Each layer only references the layer immediately below. Components NEVER reach past the semantic layer. Themes NEVER reach past primitives. If your code crosses two layers in a single file, you're doing it wrong.

---

## Concrete rules

### Components

- **The component exists or you don't use it.** Check the index first.
- **One Primary button per section.** Always. The `Button` metadata's anti-pattern list is non-negotiable.
- **Navigation = `<a>` or `Link`. Action = `<button>` or `Button`.** Never the other way around.
- **Interactive Card requires `as="button"` or `as="a"`.** A `<div>` with `onClick` is a bug.
- **Icon-only interactive elements REQUIRE `aria-label`.** No exceptions.
- **Active states are exclusive within their group.** Two `NavItem`s with `active=true` is a bug.

### Tokens

- Use `var(--ds-component-*)` in CSS or the JS exports from `build/web/theme-*.js`.
- For new themes (white-label clients), create `tokens/themes/<client-name>/theme.json` with the same shape as `tokens/themes/light/theme.json`. Don't add a new theme by patching existing ones.
- For density variants, use `data-density` attribute overrides in `docs/density.css`. Don't fork token files.

### Accessibility

- Every interactive element gets focus styling from `focusRing.*` tokens — don't style focus per component.
- Color is never the only cue. Pair it with weight, icon, or text.
- Touch targets ≥ 44×44 px on touch-primary surfaces. `size="sm"` is desktop-only.
- Disabled states need an explanation nearby. Don't disable without telling the user why.

### Generating new code

- Start from one of the component's `examples` if applicable. Adapt; don't reinvent.
- If you need a component combo that doesn't exist yet, propose it as a **molecule** with its own metadata file — don't inline a half-baked composition.
- Don't introduce new dependencies for things the design system already covers.

---

## When metadata says one thing and the user asks another

Ask. Do NOT silently override the metadata. The metadata is the design team's contract; the user may be unaware of it. Surface the conflict:

> "The `Card` metadata's anti-pattern list says nested Cards create ambiguous click targets. You're asking for a Card inside a Card — should I use a Stack/Panel inside instead, or do you want to override the rule for this case?"

The user can override; you can't.

---

## When metadata seems wrong or missing

Flag it. Don't work around it. Example:

> "The `Input` metadata doesn't cover the case of a password reveal toggle. I can add a `trailingIcon` slot example, but the right move is updating Input's metadata to document this pattern. Want me to draft the metadata change?"

Metadata drift is a real problem — better to surface it once than route around it forever.

---

## Token budget guidance

The full set of metadata files for a medium design system is ~50k tokens. The index is ~5k. Read strategically:

1. **Always:** `CLAUDE.md` (this file) + `src/metadata/components.index.json`.
2. **For the task:** full metadata of the 1–3 components you're using.
3. **As needed:** `tokens/semantic/components.json` to look up specific token names.
4. **Rarely:** raw theme/global tokens — only when adding new semantic tokens.

Don't pre-load everything. The index points the way.

---

## Files you should know exist

| Path | Purpose |
|---|---|
| `src/metadata/schema.ts` | TypeScript schema every metadata file conforms to. |
| `src/metadata/components.index.json` | Auto-generated. The agent's entry point. |
| `src/components/*/<Name>.metadata.ts` | Full per-component metadata. |
| `tokens/global/` | Theme-independent primitives. Don't touch from product code. |
| `tokens/themes/{light,dark,<client>}/theme.json` | Theme-dependent primitives. |
| `tokens/semantic/components.json` | The stable contract components consume. |
| `build/web/theme-*.css` | Compiled CSS variables. |
| `docs/showcase.html` | Visual reference for every token. |
| `docs/density.css` | Compact / Cozy / TV mode overrides. |

---

## Last reminder

If you finish a UI task without having opened `components.index.json` and at least one `.metadata.ts` file, you did the task wrong. Go back.
