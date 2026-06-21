---
name: design-system-component-author
description: Use this skill whenever the user asks to create, add, or scaffold a new component in this design system, OR when no existing component in `src/metadata/components.index.json` covers a UI request and a new one is genuinely needed. Triggers on phrases like "create a new component", "add a Toast", "we need a DatePicker", "scaffold a Tooltip", and on situations where you searched the index and found nothing. Do NOT trigger this skill for one-off UI compositions — those should be added to an existing component's `commonPatterns` instead.
---

# Authoring a new component for this design system

You are about to create a new component. Before writing any code, follow this checklist exactly. Skipping steps produces metadata that breaks the index, fails the validator, or misleads future agents.

## 0. Did you justify creating it?

A new component is not free. Open `src/metadata/components.index.json` and prove that no existing component covers the case. If the user's need is a one-off composition, propose adding it to an existing component's `commonPatterns` instead. Only proceed if at least one of these is true:

- No existing component's `useCases` or `keywords` match
- The composition would repeat 3+ times across the codebase
- It has a distinct, nameable purpose and unique anti-patterns

If unsure, ask the user before scaffolding.

## 1. Decide category first

| Category | Use when |
|---|---|
| `atom` | Indivisible primitive (Button, Badge) |
| `molecule` | 2–4 atoms combined into one purpose (Card, FormField) |
| `organism` | Page-level region (Sidebar, DataTable) |
| `template` | Page skeleton (rare — usually a route component) |

This decision affects every other field. Commit to it before writing.

## 2. Read the full authoring guide

Open `docs/AUTHORING.md`. It contains:
- The complete 12-step authoring sequence
- A skeleton to copy and fill in
- The list of common mistakes the validator catches
- Examples to use as structural references

Do NOT skip it. The skeleton in AUTHORING.md is the source of truth — even if you've seen it before in this conversation, re-read it because details change.

## 3. Write the metadata file

Create `src/components/<Name>/<Name>.metadata.ts` from the skeleton in AUTHORING.md.

Folder name = component name = export name. PascalCase. The validator rejects mismatches.

## 4. Tokens missing? Add them to the semantic layer first.

If the component needs a token that doesn't exist in `tokens/semantic/components.json`, add it there BEFORE finishing the metadata. The token layer leads; metadata follows. Never list a primitive (`color.*`) in `tokens.semantic` to work around this.

## 5. Validate before declaring done

Run all three:

```bash
npm run validate
npm run typecheck
npm run build:index
```

Or `npm run test` to run validate + typecheck together.

If `validate` fails, fix the metadata — do NOT silence the validator. It's catching a real issue:

- `theme.*` token in `tokens.semantic` → move it to `tokens.theme`, or create a `component.*` wrapper token
- antiPattern missing `alternative` → add it; two-field anti-patterns don't help agents
- variant `options` doesn't match `purpose` keys → reconcile them
- folder name ≠ component name ≠ export name → rename so all three match

## 6. Critical fields, in order of impact on AI

When time is short, spend it here:

1. **`usage.antiPatterns`** — three fields each (scenario + reason + alternative). 4–8 entries minimum.
2. **`aiHints.selectionCriteria`** — keyed by the question the agent asks itself. Not topics — questions.
3. **`variants.*.purpose`** — agents pick variants by reading these. "Primary is the main button" is wrong; *"The single most important action of the section. Use exactly once per section."* is right.
4. **`composition.forbiddenParents`** — catches the biggest class of nesting bugs.
5. **`aiHints.disambiguateFrom`** — list 3–5 components most likely to be confused with this one.

The rest of the schema is mechanical. These five fields are where AI correctness lives.

## 7. After committing

Do nothing extra. `components.index.json` regenerates automatically from the filesystem on the next `npm run build:index`. No additional registration.

---

## Hard rules

- **Never** copy another component's metadata as a starting point. Use AUTHORING.md's skeleton. Inherited assumptions silently break things.
- **Never** write a 2-field anti-pattern. The validator rejects it; more importantly, it's useless to the agent.
- **Never** list a `theme.*` token in `tokens.semantic`. Misclassification is the bug the validator exists to catch.
- **Never** skip `npm run validate` before declaring the component done.
- **Always** ask the user before creating a component you're not certain is needed. A wrong component pollutes the index for every future agent.
