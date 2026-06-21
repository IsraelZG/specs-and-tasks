# Authoring a new component

Instructions for an AI agent (or human) adding a new component to this design system. The format is non-negotiable: existing components, the validator, the index generator, and downstream agents all assume it.

If you are about to write `<Foo>.metadata.ts` from scratch, stop and read this file first.

---

## When to create a new component vs compose existing ones

Before authoring, prove the component is necessary. Existing components compose into a lot. A new entry costs:

- a metadata file (~2k tokens)
- an entry in the index that every future agent reads
- maintenance over time

Create a new component only when ALL of these are true:

1. **No existing component covers the use case.** Run the discovery flow from `CLAUDE.md` — read `src/metadata/components.index.json`, check candidates' `useCases` and `aiHints.keywords`.
2. **Composing existing components produces awkward or repeated code.** If the same 5-line composition shows up 3+ times, it's a molecule. If it's a one-off, it's not.
3. **The component has a stable, nameable purpose.** "Card with a header and two buttons" is not a component — it's a layout. "MetricTile that displays a label, a value, and a delta" is a component.
4. **Its anti-patterns are different from existing components'.** If the don'ts are identical to Card's don'ts, it probably IS a Card with a specific composition — write the composition into Card's `commonPatterns` instead.

If any of these fails, **don't create the component**. Add an example to an existing one, or propose a `commonPatterns` entry on the closest match.

---

## Decide the category before writing anything

Atomic-design tier is the first decision and affects everything downstream.

| Category | What it is | Examples in this system |
|---|---|---|
| `atom` | Indivisible UI primitive. Renders one thing. No children-of-substance. | Button, Input, Badge, Icon, NavItem |
| `molecule` | Combines 2–4 atoms into a small named unit with its own purpose. | Card, Message, FormField, SearchBar |
| `organism` | Page-level region. Combines molecules/atoms into a complete section. Usually has layout responsibility. | Sidebar, Header, MessageList, DataTable |
| `template` | Page-level skeleton that arranges organisms. Rarely needed; usually a route component instead. | AppShell, SettingsLayout |

Wrong category = wrong instincts about composition, parent constraints, and reuse. Decide first, then write.

---

## Authoring sequence

Do the steps in this order. Each builds on the last. Skipping ahead produces metadata that fails the validator or misleads the agent.

### Step 1 — Folder and file scaffolding

```
src/components/<Name>/
├── <Name>.metadata.ts     ← what you author now
└── <Name>.tsx             ← the implementation (later)
```

**Rules:**
- `<Name>` is PascalCase.
- Folder name = component name = exported metadata constant name (`<Name>Metadata`). The validator rejects any mismatch.
- One component per folder. Co-located sub-pieces (`<Name>.parts.tsx`, hooks, types) live in the same folder but the metadata file describes only the public component.

### Step 2 — Copy the skeleton

Start from the standalone skeleton file:

```bash
cp docs/metadata.skeleton.ts src/components/<Name>/<Name>.metadata.ts
```

Don't reuse another component's metadata as a starting point — you'll inherit assumptions that don't apply. The skeleton is also reproduced inline at the end of this file for reference.

### Step 3 — Identity block (`component`)

Fill it in order:

- `name` — must equal folder name
- `category` — decision from above
- `description` — one sentence. Pattern: *"<What it is>. <Defining trait>."* Example: *"Single-line text input. The base primitive for typed user data."*
- `type` — see `ComponentType` in `schema.ts`. Pick the dominant role; not "all of the above"
- `path` — `src/components/<Name>/<Name>.tsx`
- `lastUpdated` — current ISO-8601 UTC timestamp
- `metadataVersion` — `1.0.0` for new components. Bump on schema-affecting changes.

### Step 4 — Props (`props`)

Mirror the eventual TypeScript interface. For each prop:

- `type` — the TS type as a string. Literal unions stay as literal unions: `` `'sm' | 'md' | 'lg'` ``, not `"string"`.
- `required` — `true` only if the prop has no default AND the component cannot render without it.
- `default` — the literal value, as a string.
- `description` — one sentence.
- `acceptsNode: true` — when the prop takes `ReactNode` or a render prop.

If you can't write the type, you can't write the component yet. Stop and clarify with the user.

### Step 5 — Tokens (`tokens`)

This list is what the component is **allowed** to read. Three buckets:

- `semantic` — `component.*` and `focusRing.*` tokens. The default location for everything. Brace expansion is allowed: `component.button.height.{sm,md,lg}`.
- `theme` — `theme.*` tokens. Only when the component genuinely styles by theme primitive (rare; usually means it should consume a semantic token that wraps the theme token instead).
- `primitive` — global tokens like `color.*` or `spacing.*`. Should almost always be empty. A non-empty `primitive` array is a smell — flag it in PR review.

**The validator will reject a `theme.*` token listed in `semantic`.** Don't fight it; that misclassification is exactly the bug the validator exists to catch.

If the semantic token you need doesn't exist yet, **stop**. Open `tokens/semantic/components.json` and add it under a new `component.<name>` section before continuing. The token layer leads; the metadata follows.

### Step 6 — Variants (`variants`)

For each variant axis (usually `variant`, `size`, `tone`):

- `options` — all valid values
- `default` — must be in `options`
- `purpose` — one entry per option, keyed by option name

`options` and `purpose` keys must match exactly. The validator enforces this.

**The `purpose` text is the most-read field in the entire metadata.** Agents pick the variant by reading these strings. Bad purposes produce wrong choices.

Bad purpose: *"Primary is the main button."*
Good purpose: *"The single most important action of the section. Maximum visual weight. Use exactly once per section."*

The second tells the agent WHEN to use it AND embeds the most common anti-pattern as a hint.

### Step 7 — Composition (`composition`)

Skip this block entirely for components with no slots (e.g. atoms with text-only children).

For everything else:

- `slots` — one entry per named slot. `children` counts as the default slot.
  - `acceptedComponents` — empty array means anything; a list means whitelist.
  - `forbiddenComponents` — explicit blocks. Overrides whitelist.
  - `required` — does the slot need to be filled?
- `parentConstraints` — components that MUST wrap this. Empty array = no constraint.
- `forbiddenParents` — components that must NEVER wrap this. Critical for nesting bugs (e.g. Button inside Button).
- `commonSiblings` — purely informational, helps the agent surface related components.

**Always set `forbiddenParents` if your component has any.** This catches the biggest class of generated-UI bugs: invalid nesting.

### Step 8 — Behavior (`behavior`)

- `states` — every visual state the component has. Each entry needs a `visual` (what the user sees) and optionally a `semantic` (what changes about accessibility or interaction).
- `interactions` — bullet list of how users trigger things. Be specific: "Enter and Space activate when focused" beats "click to activate".
- `responsive` — one sentence on how it adapts across breakpoints.
- `motion` — name the `motion.preset.*` tokens used. If the component doesn't animate, write "None" — don't omit the field.

### Step 9 — Usage (`usage`)

Five fields, two are critical (commonPatterns and antiPatterns):

**`useCases`** — kebab-case tags. Be specific. `form-submission` beats `actions`. These are searchable by agents. Aim for 3–6.

**`requiredProps`** — props with `required: true`. Must match the `props` block.

**`commonPatterns`** — 2–5 real JSX snippets. Each:
- `name` — kebab-case identifier
- `description` — one-line "use this when..."
- `composition` — real JSX. The validator checks that it looks like JSX (contains a tag starting with capital letter).

Don't write contrived examples. Pick the ways this component will actually be used in your app.

**`antiPatterns`** — THE most important field for AI correctness. Each anti-pattern has three required fields:

```ts
{
  scenario: 'What someone is about to do.',
  reason: 'Why it is wrong (the underlying principle).',
  alternative: 'What to do instead, naming a concrete component or pattern.',
}
```

**All three are mandatory.** Two-field anti-patterns are still prose; they don't help the agent decide. The validator rejects entries missing any field.

Anti-patterns to always consider listing (if applicable):
- Nesting the component inside itself or another interactive
- Using the component for its visual rather than its semantic ("danger as red emphasis")
- Using a non-interactive element where interactive is required (div + onClick)
- Replacing labels with placeholders or visuals only
- Using the wrong variant when a similar component would be correct (Button-as-navigation)
- Disabling without explanation
- Color-only state communication

Aim for 4–8 anti-patterns. Fewer than 3 = you haven't thought hard enough.

### Step 10 — Accessibility (`accessibility`)

- `role` — ARIA role. Use `"implicit (native <element>)"` when the underlying element provides it.
- `keyboardSupport` — list every key that does something. "Tab focuses. Enter/Space activate." not "fully keyboard accessible".
- `screenReader` — what gets announced. Example: *"Announces as 'button' + label text. With loading=true, announces 'busy'."*
- `wcag` — `'A' | 'AA' | 'AAA'`. Default target is AA.
- `notes` — array of additional rules. Common entries:
  - "Always provide a text label. Icon-only X MUST set aria-label."
  - "Contrast on X meets 4.5:1 against Y across both themes."
  - "Touch targets meet 44×44 at size=md or larger."

### Step 11 — AI Hints (`aiHints`)

The agent's cheat sheet. Four fields:

- `priority` — `high` for components used on most pages (Button, Input, Card), `medium` for situational (Modal, Toast), `low` for rare or specialized.
- `keywords` — words an agent's keyword search would match against. Include synonyms and verbs.
- `selectionCriteria` — keyed by **the question the agent is asking itself**, not by topic. Example:

  ```ts
  'Is this a navigation to another page or route?':
    'NO — use Link, not Button. Even if it looks the same visually.'
  ```

  Aim for 5–8 entries covering the realistic decision points. If you're a `high` priority component and this field is empty, the validator warns you.

- `disambiguateFrom` — keyed by similar component name, one sentence telling them apart. List 3–5 components most likely to be confused with this one.

### Step 12 — Examples (`examples`)

2–4 real, copy-pasteable snippets that go beyond `commonPatterns`. Examples are for the agent to adapt; commonPatterns are for the agent to recognize the pattern. Each:

- `name` — kebab-case
- `description` — what the example demonstrates
- `code` — full, runnable JSX. Imports omitted (assume design-system components are in scope).

---

## Skeleton

The canonical skeleton lives at `docs/metadata.skeleton.ts`. Copy it:

```bash
cp docs/metadata.skeleton.ts src/components/<Name>/<Name>.metadata.ts
```

Remove all `// TODO` comments before committing. The inline version below is kept for quick reference only.

```ts
import { defineMetadata } from '../../metadata/schema.ts';

export const <Name>Metadata = defineMetadata({
  component: {
    name: '<Name>',
    category: 'atom', // atom | molecule | organism | template
    description: '<One sentence: what it is.>',
    type: 'interactive', // interactive | input | display | container | navigation | feedback | layout
    path: 'src/components/<Name>/<Name>.tsx',
    lastUpdated: '<ISO-8601 UTC>',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      // kebab-case tags, 3–6
    ],
    requiredProps: [
      // names of props with required: true
    ],
    commonPatterns: [
      {
        name: '<kebab-case>',
        description: '<one line use-when>',
        composition: `<<Name> />`, // real JSX
      },
    ],
    antiPatterns: [
      {
        scenario: '<What someone is about to do.>',
        reason: '<Why it is wrong.>',
        alternative: '<What to do instead, with a component name.>',
      },
      // aim for 4–8
    ],
  },

  // Omit `variants` entirely if the component has no variant axes.
  variants: {
    variant: {
      options: ['a', 'b'],
      default: 'a',
      purpose: {
        a: '<When to use a.>',
        b: '<When to use b.>',
      },
    },
  },

  // Omit `composition` entirely for leaf atoms with only text children.
  composition: {
    slots: [
      {
        name: 'children',
        description: '<What goes here.>',
        acceptedComponents: [], // empty = anything
        forbiddenComponents: [],
        required: true,
      },
    ],
    commonSiblings: [],
    parentConstraints: [],
    forbiddenParents: [],
  },

  behavior: {
    states: [
      { name: 'default', visual: '<...>' },
      { name: 'hover',   visual: '<...>' },
      { name: 'focus',   visual: '<...>' },
      { name: 'disabled',visual: '<...>', semantic: '<...>' },
    ],
    interactions: [
      'Click or Tap activates onClick.',
      'Enter/Space activate when focused.',
    ],
    responsive: '<One sentence.>',
    motion: '<motion.preset.* names or "None">',
  },

  props: {
    children: { type: 'ReactNode', required: true, description: '<...>', acceptsNode: true },
    // …
  },

  tokens: {
    semantic: [
      // 'component.<name>.…'
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (native <element>)',
    keyboardSupport: '<keys>',
    screenReader: '<announcement>',
    wcag: 'AA',
    notes: [
      // rules consumers must follow
    ],
  },

  aiHints: {
    priority: 'medium', // high | medium | low
    keywords: [],
    selectionCriteria: {
      // 'question the agent is asking?': 'answer.'
    },
    disambiguateFrom: {
      // OtherComponent: 'one-line difference.',
    },
  },

  examples: [
    {
      name: '<kebab-case>',
      description: '<what it shows>',
      code: `<<Name> />`,
    },
  ],
});
```

---

## Before you commit

Run all three checks. They take seconds and prevent the most common drift.

```bash
npm run validate        # schema + token sanity
npm run typecheck       # TypeScript validation of all metadata files
npm run build:index     # regenerates components.index.json
```

Or run all checks in one shot: `npm run test`.

If `validate` reports an error, fix it — don't silence it. The validator is the agent's friend.

---

## Common authoring mistakes (read this before you commit)

1. **Anti-patterns with only `scenario` and `reason`.** Missing `alternative` makes the field useless to agents. Validator rejects.
2. **Theme tokens listed in `tokens.semantic`.** Misclassification. Move them to `tokens.theme` — or better, create a `component.*` token that wraps the theme token and use that.
3. **Two variants with similar `purpose` text.** If `purpose` for variant A and B sound the same, you have one variant, not two. Or your purposes are too vague — rewrite to differentiate.
4. **`selectionCriteria` topics instead of questions.** "About sizes" is wrong. *"Is this in a dense surface like a toolbar?"* is right. Keys are questions, values are answers.
5. **Description that names the component again.** "Button: a button that you click" — replace with a sentence about its specific purpose.
6. **Required props that aren't actually required.** `children: required: true` only if rendering without children is impossible/meaningless. Most other props should be optional with sensible defaults.
7. **`forbiddenParents` left empty when it shouldn't be.** Every interactive component should forbid being nested inside Button, Link, and itself at minimum.
8. **Examples that are also `commonPatterns`.** Examples should go BEYOND patterns — show real combined usage.

---

## After you commit

The agent that next reads `components.index.json` will see your component automatically. No additional registration. The index is auto-generated from the filesystem.

If you change the schema itself (`src/metadata/schema.ts`), every existing metadata file must still validate. Run `npm run validate` after schema changes.

---

## When in doubt

Read the existing metadata for whichever component is closest to yours:

- Atom + interactive → `Button.metadata.ts`
- Atom + input → `Input.metadata.ts`
- Atom + navigation → `NavItem.metadata.ts`
- Molecule + container → `Card.metadata.ts`
- Molecule + display → `Message.metadata.ts`

Use them as **structural** references, not as templates to copy wholesale. Your component's purpose is different; copying defeats the purpose of metadata.
