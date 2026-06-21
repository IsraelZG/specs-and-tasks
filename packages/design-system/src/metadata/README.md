# AI-Ready Component Metadata

This is the layer that turns the design system from "documentation a human reads" into "a contract an AI agent can query". Every component ships a `<Component>.metadata.ts` file. A single index — `src/metadata/components.index.json` — lists all of them.

The why and the schema are explained in `src/metadata/schema.ts`. This file is the **operational** guide: how the agent uses it, how authors maintain it, and how CI keeps it honest.

---

## The three documents

| File | Audience | Size per component | When read |
|---|---|---|---|
| `components.index.json` | Agents (discovery) | ~100 tokens | Always, first |
| `<Component>.metadata.ts` | Agents (decision), authors (contract) | ~2k tokens | When component is a candidate |
| `<Component>.tsx` | Developers, agents (final implementation) | varies | After metadata confirms fit |

The split matters. An agent scanning 50 components in parallel doesn't load 100k tokens of full metadata — it loads 5k of index, picks 1–3 candidates, and *then* loads their full files.

---

## How an agent uses this (worked example)

User prompt: *"Add a way for users to delete their account from settings."*

**Step 1 — read index.** Agent opens `components.index.json` and scans:
- `Button` keywords include `delete`, `action` → candidate
- `Card` keywords are about grouping → not directly relevant but might be the container
- `Input` is for typed data → not relevant
- `NavItem` is for nav surfaces → not relevant
- `Message` is conversation → not relevant

**Step 2 — full metadata of Button.** Agent walks the file:
- `usage.useCases` lists `destructive-action`, `modal-confirmation` ✓
- `usage.antiPatterns` includes *"Danger variant for non-destructive emphasis"* → confirms this IS the right case for danger
- `aiHints.selectionCriteria` answers *"Will the action delete data?"* → use `variant="danger"` and a consequence verb
- `examples` has `destructive-with-confirmation` showing Button inside Modal

**Step 3 — emit code that respects the metadata:**
```tsx
<Card>
  <Text variant="headingLg">Delete account</Text>
  <Text variant="bodySm">This will permanently remove your data.</Text>
  <Button variant="danger" onClick={confirmDelete}>Delete account</Button>
</Card>
```

Note what the agent did NOT do:
- did not use a red Button for a non-destructive action
- did not write the label as "Click here to delete"
- did not put two Buttons of equal weight side-by-side
- did not nest the Button inside another Button
- did not hardcode `color: red` — it used `variant="danger"`

Each of these would have triggered an anti-pattern hit if the agent skipped the metadata.

---

## How to author a new component's metadata

The order matters — the easy fields first, the AI-critical ones with the most thought.

1. **`component.*` identity.** Folder name = component name = export name.
2. **`props`.** Mirror the TypeScript interface. Mark every truly-required prop as `required: true`.
3. **`tokens.semantic`.** List the `component.*` tokens consumed. Brace expansion is allowed (`component.foo.{a,b,c}`). If you list a `theme.*` token in here, the validator will reject it — those go in `tokens.theme`.
4. **`variants`.** For each variant axis: `options[]`, `default`, and a `purpose` entry per option. Validator will check `options` matches `purpose` keys.
5. **`usage.useCases`.** kebab-case tags. Be specific — `form-submission` beats `actions`.
6. **`usage.commonPatterns`.** Two to five real JSX snippets. They get syntax-checked.
7. **`usage.antiPatterns`.** This is where the most agent value lives. Every entry has three fields:
   - `scenario` — what someone is about to do
   - `reason` — why it's wrong
   - `alternative` — what to do instead, referencing a concrete component
   Two-field anti-patterns are still prose. Don't ship them.
8. **`aiHints.selectionCriteria`.** Keyed by the question the agent is asking itself. Example: `"Will the user write more than one sentence here?": "Use Textarea, not Input."`
9. **`aiHints.disambiguateFrom`.** List the 2–5 components most likely to be confused with this one. One sentence each.
10. **`composition.parentConstraints` and `forbiddenParents`.** Critical for catching nesting bugs.

Run `npm run validate` before committing.

---

## What the validator catches

`scripts/validate-metadata.mjs` runs in CI and rejects:

- folder name ≠ component name ≠ export name mismatch
- `metadataVersion` not in semver
- `lastUpdated` not ISO-8601
- empty `useCases`
- anti-patterns missing any of `{scenario, reason, alternative}`
- `commonPatterns` with non-JSX-looking compositions
- variants where `options` and `purpose` keys disagree
- `default` not in `options`
- semantic tokens that don't exist in `tokens/semantic/components.json`
- high-priority components with empty `selectionCriteria` (warning only — agent will guess)

Run locally:
```bash
npm run validate
```

CI should run it on every PR.

---

## Where this came from

The approach is adapted from Cristian Morales' AI Component Metadata Skill — the central observation is that AI doesn't fail because models are weak. It fails because the documentation we wrote for humans doesn't answer the five questions the model is silently asking:

1. Does this component exist?
2. Should I use it now?
3. Which variant?
4. What goes inside?
5. What should I NEVER do with it?

Every section of the metadata schema maps to one of those questions. If a section feels redundant, it's because you already know the answer — but the agent doesn't.

---

## Lazy-loading guidance for agent prompts

When you wire this design system into Claude Code, Cursor, or a custom agent, put **only** these in the system context by default:

- `CLAUDE.md` (~3k tokens)
- `src/metadata/components.index.json` (~5k tokens for ~50 components)

Have the agent fetch full `<Component>.metadata.ts` files on demand, one per component it intends to use. Don't preload all metadata — you'll burn context for nothing.

For Claude Code specifically, this works well as a Skill: pack the index + CLAUDE.md into the skill, and let Claude open individual metadata files via the file system.

---

## Maintenance signals

A few smells to watch for over time:

- **An agent keeps generating something the metadata forbids.** The anti-pattern wording probably isn't specific enough — rewrite the `scenario` to match what's actually happening.
- **`tokens.semantic` lists tokens not actually imported by the component.** Drift. The validator catches the inverse, but full reconciliation needs a TS-AST script over the actual `.tsx`.
- **A user override on a metadata rule turns into a pattern.** Time to update the metadata, not keep overriding.
- **`disambiguateFrom` gets large.** Means two components have overlapping purpose — consolidate or split, don't paper over with docs.
