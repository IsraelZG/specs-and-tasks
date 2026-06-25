/**
 * Metadata skeleton for a new design system component.
 *
 * HOW TO USE:
 *   cp docs/metadata.skeleton.ts src/components/<Name>/<Name>.metadata.ts
 *
 * Then:
 *   1. Replace every occurrence of "ComponentName" with your actual PascalCase name.
 *   2. Fill in every TODO field. Remove all TODO comments before committing.
 *   3. Run:  npm run validate && npm run typecheck && npm run build:index
 *
 * Read docs/AUTHORING.md for the full 12-step sequence and field-by-field guidance.
 * The validator will reject missing fields, mismatched variant/purpose keys, and
 * theme tokens listed under tokens.semantic.
 */

import { defineMetadata } from '../../metadata/schema.ts';

export const ComponentNameMetadata = defineMetadata({
  component: {
    name: 'ComponentName',
    category: 'atom',            // TODO: atom | molecule | organism | template
    description: 'TODO: One sentence. Pattern: "<What it is>. <Defining trait>."',
    type: 'interactive',         // TODO: interactive | input | display | container | navigation | feedback | layout
    path: 'src/components/ComponentName/ComponentName.tsx',
    lastUpdated: '2026-01-01T00:00:00Z', // TODO: replace with current ISO-8601 UTC timestamp
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      // TODO: 3–6 kebab-case tags. Be specific — "form-submission" beats "actions".
    ],
    requiredProps: [
      // TODO: names of props with required: true. Must match the props block below.
    ],
    commonPatterns: [
      {
        name: 'default-usage',
        description: 'TODO: one-line "use this when…"',
        composition: `<ComponentName />`, // TODO: real JSX — validator checks for capital-letter tag
      },
    ],
    antiPatterns: [
      // TODO: aim for 4–8. All three fields are MANDATORY — the validator rejects 2-field entries.
      {
        scenario: 'TODO: What someone is about to do.',
        reason: 'TODO: Why it is wrong (the underlying principle).',
        alternative: 'TODO: What to do instead, naming a concrete component or pattern.',
      },
      {
        scenario: 'TODO: ...',
        reason: 'TODO: ...',
        alternative: 'TODO: ...',
      },
      {
        scenario: 'TODO: ...',
        reason: 'TODO: ...',
        alternative: 'TODO: ...',
      },
      {
        scenario: 'TODO: ...',
        reason: 'TODO: ...',
        alternative: 'TODO: ...',
      },
    ],
  },

  // OMIT this block entirely if the component has no variant axes.
  variants: {
    variant: {
      options: ['default', 'TODO'],
      default: 'default',
      purpose: {
        // TODO: The purpose text is the most-read field for AI agents.
        // Bad:  "Default is the standard look."
        // Good: "Use when no special emphasis is needed. The baseline rendering."
        default: 'TODO: When to use this option — be specific enough that an agent can decide.',
        TODO: 'TODO: ...',
      },
    },
    // TODO: Add more variant axes (size, tone, etc.) as needed. Remove unused ones.
  },

  // OMIT this block entirely for leaf atoms with only text children.
  composition: {
    slots: [
      {
        name: 'children',
        description: 'TODO: What content goes here.',
        acceptedComponents: [], // empty = anything; add a whitelist if restricted
        forbiddenComponents: ['ComponentName'], // always forbid nesting inside itself
        required: true,
      },
    ],
    commonSiblings: [],
    parentConstraints: [], // components that MUST wrap this — usually empty
    forbiddenParents: [
      // TODO: add any component that must never wrap this one.
      // Interactive components should at minimum forbid: ['Button', 'Link', 'ComponentName']
    ],
  },

  behavior: {
    states: [
      { name: 'default',  visual: 'TODO: what the user sees in the resting state.' },
      { name: 'hover',    visual: 'TODO: visual change on hover.' },
      { name: 'focus',    visual: 'TODO: 2px focus ring from focusRing.* tokens.', semantic: 'Keyboard-visible only (:focus-visible).' },
      { name: 'disabled', visual: 'TODO: reduced opacity or muted appearance.',    semantic: 'TODO: aria change, pointer-events: none.' },
      // Add other states: pressed, loading, error, selected — as applicable.
    ],
    interactions: [
      // TODO: list every key / gesture that does something.
      // "Click or Tap activates onClick."
      // "Enter and Space activate when focused."
    ],
    responsive: 'TODO: one sentence on breakpoint behavior, or "No responsive changes."',
    motion: 'TODO: motion.preset.* token names used, or "None".',
  },

  props: {
    // TODO: mirror your TypeScript interface exactly.
    // Only required: true when the component cannot render without the prop.
    children: { type: 'ReactNode', required: true,  description: 'TODO: describe expected content.', acceptsNode: true },
    // TODO: add remaining props.
  },

  tokens: {
    semantic: [
      // TODO: list only component.* and focusRing.* tokens.
      // Use brace expansion for related groups: 'component.componentname.height.{sm,md,lg}'
      // NEVER list theme.* here — the validator rejects it.
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],     // only for tokens the component genuinely reads by theme primitive (rare)
    primitive: [], // should almost always be empty — a non-empty array is a code smell
  },

  accessibility: {
    role: 'implicit (native <element>)', // TODO: or explicit ARIA role
    keyboardSupport: 'TODO: list every key. "Tab focuses. Enter/Space activate."',
    screenReader: 'TODO: what gets announced. "Announces as \'role\' + label text."',
    wcag: 'AA',
    notes: [
      // TODO: rules consumers must follow.
      // "Always provide a text label. Icon-only usage MUST set aria-label."
      // "Contrast meets 4.5:1 against adjacent surfaces across both themes."
    ],
  },

  aiHints: {
    priority: 'medium', // high (most pages) | medium (situational) | low (rare)
    keywords: [
      // TODO: words an agent's keyword search would match. Include synonyms and verbs.
    ],
    selectionCriteria: {
      // TODO: 5–8 entries. Keys are QUESTIONS the agent asks itself, not topics.
      // Bad key:  "About size"
      // Good key: "Is this in a dense surface like a toolbar or table row?"
      'TODO: Is this the right component for X?': 'TODO: Answer with a clear yes/no and guidance.',
    },
    disambiguateFrom: {
      // TODO: 3–5 components most likely to be confused with this one.
      // OtherComponent: 'One sentence telling them apart.',
    },
  },

  examples: [
    // TODO: 2–4 real, copy-pasteable snippets that go BEYOND commonPatterns.
    // Examples show combined usage; patterns show recognition.
    {
      name: 'basic-usage',
      description: 'TODO: what this example demonstrates',
      code: `<ComponentName />`,
    },
  ],
});
