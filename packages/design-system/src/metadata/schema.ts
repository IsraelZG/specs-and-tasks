/**
 * Component Metadata Schema
 *
 * The contract every <Component>.metadata.ts file in this design system follows.
 *
 * Why this exists: humans read prose docs and infer rules. AI agents can't — they
 * need decisions encoded as queryable structured data. This schema turns implicit
 * design contracts (when to use Primary vs Secondary, what NEVER to nest, which
 * tokens a component consumes) into something an agent can read in ~100 tokens
 * for discovery and ~2k tokens for full reasoning.
 *
 * Each component ships TWO things consumers can import:
 *   - the React/Vue/etc component itself
 *   - <Component>.metadata.ts that exports `ComponentMetadata`
 *
 * Tooling reads the metadata to:
 *   - power AI agent selection ("which component fits this need?")
 *   - validate generated code against antiPatterns
 *   - build the global components.index.json for fast discovery
 *   - check that drift between props and metadata gets flagged in CI
 *
 * Authoring tip: the 5 fields AI gets wrong most often are
 *   usage.useCases, usage.antiPatterns, variants.purpose,
 *   composition.parentConstraints, aiHints.selectionCriteria.
 * Spend the most effort there.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Top-level identity (the "header" — read first for discovery)
// ─────────────────────────────────────────────────────────────────────────────

export type ComponentCategory = 'atom' | 'molecule' | 'organism' | 'template';

export type ComponentType =
  | 'interactive'   // user triggers actions: Button, Switch, Tab
  | 'input'         // user provides data: Input, Select, DatePicker
  | 'display'       // renders information: Badge, Avatar, Tooltip
  | 'container'     // holds other content: Card, Modal, Section
  | 'navigation'    // moves user between contexts: NavItem, Breadcrumb, Tabs
  | 'feedback'      // surfaces status: Toast, Alert, Progress
  | 'layout';       // arranges content: Stack, Grid, Divider

export interface ComponentIdentity {
  /** PascalCase. Must match the exported component name. */
  name: string;
  /** Atomic-design tier. Affects allowed composition. */
  category: ComponentCategory;
  /** One sentence. What is it, full stop. */
  description: string;
  /** Drives selection logic. Pick the dominant role. */
  type: ComponentType;
  /** Relative path to component source. Used by codegen and linkbacks. */
  path: string;
  /** ISO-8601 UTC. Updated by the metadata-generator script. */
  lastUpdated: string;
  /** Semver of the metadata itself, independent of component version. */
  metadataVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage — when to reach for this, and when NOT to
// ─────────────────────────────────────────────────────────────────────────────

/** A real, working snippet. NOT pseudocode and NOT a screenshot. */
export interface UsagePattern {
  /** kebab-case. Stable identifier referenced from other components. */
  name: string;
  /** One-line "use this when..." */
  description: string;
  /** Real JSX/TSX. Will be syntax-checked in CI. */
  composition: string;
}

/**
 * Anti-patterns require all three fields. Two-field anti-patterns
 * ("don't overuse primary") are still prose — they don't help the agent decide.
 */
export interface AntiPattern {
  /** What someone is about to do that's wrong. */
  scenario: string;
  /** Why it's wrong (the underlying principle). */
  reason: string;
  /** What they should do instead. Must reference a concrete component or pattern. */
  alternative: string;
}

export interface Usage {
  /** kebab-case tags. Searchable. Be specific: "form-submission" beats "actions". */
  useCases: string[];
  /** Props that have no default and must be supplied. Drives codegen. */
  requiredProps: string[];
  /** The 2–5 most common ways this component is composed. */
  commonPatterns: UsagePattern[];
  /** Forbidden uses. The single most important field for AI correctness. */
  antiPatterns: AntiPattern[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Variants — what visual/behavioral options exist
// ─────────────────────────────────────────────────────────────────────────────

export interface VariantAxis {
  /** Enumerated values this axis accepts. */
  options: string[];
  /** Value used when the prop is omitted. */
  default: string;
  /** Per-option explanation. THIS is what the agent reads to pick. */
  purpose: Record<string, string>;
}

/** Keyed by prop name (e.g. `variant`, `size`, `tone`). */
export type Variants = Record<string, VariantAxis>;

// ─────────────────────────────────────────────────────────────────────────────
// Composition — what goes inside, what may wrap it
// ─────────────────────────────────────────────────────────────────────────────

export interface Slot {
  /** Slot identifier. Use "children" for the default React children slot. */
  name: string;
  /** What this slot is for. */
  description: string;
  /** Component names allowed in this slot. Empty array = anything. */
  acceptedComponents: string[];
  /** Components explicitly forbidden here. Overrides acceptedComponents. */
  forbiddenComponents?: string[];
  /** Whether the slot must be filled. */
  required: boolean;
}

export interface Composition {
  /** Named slots this component exposes. */
  slots: Slot[];
  /** Components that frequently appear alongside this one, for hint surfacing. */
  commonSiblings?: string[];
  /**
   * Parents that MUST wrap this component (e.g. NavItem requires Sidebar).
   * Empty array = no parent required.
   */
  parentConstraints: string[];
  /**
   * Components that must NEVER wrap this. Critical for nesting bugs.
   * Example: Button cannot be nested inside Button.
   */
  forbiddenParents?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Behavior — states, interactions, responsiveness
// ─────────────────────────────────────────────────────────────────────────────

export interface InteractionState {
  /** State key: hover, focus, active, disabled, loading, error, etc. */
  name: string;
  /** What the user sees. */
  visual: string;
  /** What changes about availability/behavior. */
  semantic?: string;
}

export interface Behavior {
  /** All visual states this component can be in. */
  states: InteractionState[];
  /** How the user triggers actions (click, key, gesture). */
  interactions: string[];
  /** How it adapts across breakpoints. "stacks", "hides label", "fills width", etc. */
  responsive: string;
  /** Notes about animation: which token, what transitions. */
  motion?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props — typed interface (the developer contract)
// ─────────────────────────────────────────────────────────────────────────────

export interface PropSpec {
  /** TypeScript type as a string. e.g. `'primary' | 'secondary'` or `string`. */
  type: string;
  /** Default literal as a string. `undefined` if no default. */
  default?: string;
  /** Whether the prop is required (no default and not optional). */
  required: boolean;
  /** One-line purpose. */
  description: string;
  /** True for props that take a render-prop or ReactNode. Affects codegen. */
  acceptsNode?: boolean;
}

export type Props = Record<string, PropSpec>;

// ─────────────────────────────────────────────────────────────────────────────
// Tokens — which design tokens this component consumes (relationship pillar)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lists the SEMANTIC tokens (component.* and focusRing.*) the component reads.
 * Never list raw primitives — if you find yourself wanting to, that's a smell:
 * the component is bypassing the semantic layer.
 *
 * CI script verifies this list matches what the component file actually imports.
 */
export interface TokenUsage {
  /** Semantic token names from tokens/semantic/components.json. */
  semantic: string[];
  /** Theme tokens (theme.*) used directly. Should be rare. */
  theme?: string[];
  /** Global primitives used directly. Should be even rarer — usually a bug. */
  primitive?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG, ARIA, keyboard
// ─────────────────────────────────────────────────────────────────────────────

export interface Accessibility {
  /** ARIA role. Use "implicit" if the underlying element provides it natively. */
  role: string;
  /** Keys the component responds to. Be specific: "Enter activates, Esc dismisses". */
  keyboardSupport: string;
  /** What a screen reader announces. */
  screenReader: string;
  /** WCAG level this component meets when used correctly. */
  wcag: 'A' | 'AA' | 'AAA';
  /** Extra notes. ARIA attributes the consumer must provide, etc. */
  notes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// AI hints — the agent's cheat sheet
// ─────────────────────────────────────────────────────────────────────────────

export interface AIHints {
  /**
   * How aggressively to surface this component during selection.
   * `high` = atoms used everywhere (Button, Input).
   * `medium` = common but situational (Modal, Toast).
   * `low` = rare or specialized (PinInput, ColorPicker).
   */
  priority: 'high' | 'medium' | 'low';
  /** Free-text keywords for natural-language matching. */
  keywords: string[];
  /**
   * Plain-language statements: "use X when Y". One per realistic decision point.
   * Keyed by the human question the agent is actually asking itself.
   */
  selectionCriteria: Record<string, string>;
  /**
   * Components in this same design system the agent might confuse with this one.
   * Each gets a one-line disambiguation.
   */
  disambiguateFrom?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Examples — copy-pasteable snippets
// ─────────────────────────────────────────────────────────────────────────────

export interface Example {
  /** kebab-case title. */
  name: string;
  /** Why this example exists. */
  description: string;
  /** Real JSX/TSX. Will be syntax-checked in CI. */
  code: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Final top-level schema
// ─────────────────────────────────────────────────────────────────────────────

export interface ComponentMetadata {
  component: ComponentIdentity;
  usage: Usage;
  variants?: Variants;         // omit if the component has no variants
  composition?: Composition;   // omit for leaf components with no children
  behavior: Behavior;
  props: Props;
  tokens: TokenUsage;
  accessibility: Accessibility;
  aiHints: AIHints;
  examples: Example[];
}

/** Helper so authoring metadata gets full IntelliSense. */
export const defineMetadata = (meta: ComponentMetadata): ComponentMetadata => meta;
