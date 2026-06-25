import { defineMetadata } from '../../metadata/schema.ts';

export const BadgeMetadata = defineMetadata({
  component: {
    name: 'Badge',
    category: 'atom',
    description: 'Compact label that communicates status, category, or a count. Never interactive on its own.',
    type: 'display',
    path: 'src/components/Badge/Badge.tsx',
    lastUpdated: '2026-05-18T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'status-indicator',
      'notification-count',
      'category-tag',
      'kpi-delta',
      'record-state',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'status-pill',
        description: 'Label the current state of a record (open, closed, pending).',
        composition: `<Badge intent="success">Active</Badge>`,
      },
      {
        name: 'notification-dot',
        description: 'Numeric count on a nav item or avatar.',
        composition: `<Badge intent="danger">4</Badge>`,
      },
      {
        name: 'kpi-delta',
        description: 'Percentage delta on a dashboard metric.',
        composition: `<Badge intent="success">+12%</Badge>`,
      },
      {
        name: 'category-tag',
        description: 'Neutral label for taxonomy or filtering.',
        composition: `<Badge intent="neutral">Design</Badge>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Making a Badge clickable by wrapping it in an onClick div.',
        reason: 'Badge is a display atom. A clickable badge is a Button or a Tag — use the correct semantic element.',
        alternative: 'Wrap in a Button (variant="ghost") or use a dedicated Tag/Chip component when interaction is needed.',
      },
      {
        scenario: 'Using intent="danger" on a Badge to draw attention to a non-critical metric.',
        reason: 'Red teaches users "something is broken or destructive". Misuse erodes the signal.',
        alternative: 'Use intent="warning" for caution states or intent="neutral" for non-critical emphasis.',
      },
      {
        scenario: 'Putting long sentences inside a Badge.',
        reason: 'Badges are scannable micro-labels. Text longer than 3–4 words breaks the visual contract.',
        alternative: 'Use a Tag or a full text element. Badge is for short codes and counts.',
      },
      {
        scenario: 'Using color as the only differentiator between badge states.',
        reason: '8% of men have color blindness. Green vs. red without text is inaccessible.',
        alternative: 'Always pair color with a short label ("Active" vs. "Inactive") that communicates meaning without color.',
      },
      {
        scenario: 'Nesting a Badge inside a Button to add status.',
        reason: 'Interactive children inside Button create ambiguous hit-targets and broken focus order.',
        alternative: 'Place the Badge as a sibling outside the Button, or use the Button\'s trailing slot if it supports one.',
      },
    ],
  },

  variants: {
    intent: {
      options: ['neutral', 'success', 'warning', 'danger', 'info'],
      default: 'neutral',
      purpose: {
        neutral: 'Default for categories, tags, and labels with no positive/negative valence.',
        success: 'Positive states: active, completed, verified, online. Green tint.',
        warning: 'Caution states: expiring, pending review, degraded. Amber tint.',
        danger:  'Error states, destructive counts, over-limit indicators. Red tint. Use sparingly.',
        info:    'Informational labels: new, beta, draft. Blue tint.',
      },
    },
    size: {
      options: ['sm', 'md'],
      default: 'md',
      purpose: {
        sm: 'Dense surfaces: table cells, nav counters, inline code annotations.',
        md: 'Default for most contexts: cards, settings rows, profile pages.',
      },
    },
  },

  behavior: {
    states: [
      { name: 'default', visual: 'Pill-shaped, intent-tinted background with matching text color.' },
    ],
    interactions: [],
    responsive: 'Badge width is always content-based. Never wraps to a second line.',
    motion: 'None.',
  },

  props: {
    children:  { type: 'ReactNode', required: true,  description: 'Badge label. Keep short — 1–3 words or a number.', acceptsNode: true },
    intent:    { type: `'neutral' | 'success' | 'warning' | 'danger' | 'info'`, default: `'neutral'`, required: false, description: 'Color and semantic meaning.' },
    size:      { type: `'sm' | 'md'`, default: `'md'`, required: false, description: 'Visual density.' },
  },

  tokens: {
    semantic: [
      'component.badge.{radius,paddingX,paddingY,fontSize,fontWeight}',
      'component.badge.neutral.{bg,text}',
      'component.badge.success.{bg,text}',
      'component.badge.warning.{bg,text}',
      'component.badge.danger.{bg,text}',
      'component.badge.info.{bg,text}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (native <span>)',
    keyboardSupport: 'Not interactive. No keyboard behaviour.',
    screenReader: 'Reads as inline text within its surrounding context. Add aria-label on the parent if the badge provides context the label alone does not.',
    wcag: 'AA',
    notes: [
      'Never use color as the only signal — pair with a short text label.',
      'For numeric notification counts, pair with a visually-hidden description on the parent: aria-label="Inbox, 4 unread".',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['badge', 'tag', 'label', 'chip', 'pill', 'status', 'count', 'indicator', 'dot', 'notification'],

    selectionCriteria: {
      'Is the badge expected to be clicked or trigger an action?':
        'NO — Badge is display-only. Use Button (ghost) or a Tag/Chip component if interaction is needed.',
      'Does the content exceed 4 words or a short number?':
        'Use a text element or Tag instead. Badge is for micro-labels.',
      'Is this showing a notification count on an icon?':
        'Use intent="danger" for ≥1 count; include a screen-reader label on the parent icon button.',
      'Is this labelling a category (blog tag, filter chip)?':
        'Use intent="neutral". If the category is clickable, wrap in a button — do not add onClick to Badge.',
      'Is this indicating a record state (active, pending, error)?':
        'Map to intent: success → active/live, warning → pending/expiring, danger → error/blocked, info → draft/new.',
    },

    disambiguateFrom: {
      Button: 'Button is interactive and triggers actions. Badge is purely display and never clickable.',
      NavItem: 'NavItem is a navigation row. Badge can be composed inside a NavItem to show a count.',
      Message: 'Message is a full chat bubble. Badge is a micro-label for status.',
    },
  },

  examples: [
    {
      name: 'status-in-table',
      description: 'Row status badge inside a data table cell.',
      code: `<td>
  <Badge intent="success">Active</Badge>
</td>`,
    },
    {
      name: 'nav-notification-count',
      description: 'Unread count on a nav item. Screen reader label on the parent.',
      code: `<NavItem
  href="/inbox"
  aria-label="Inbox — 4 unread messages"
>
  Inbox
  <Badge intent="danger" size="sm">4</Badge>
</NavItem>`,
    },
    {
      name: 'kpi-with-delta',
      description: 'Dashboard metric card with a positive delta badge.',
      code: `<Card>
  <span>Monthly Revenue</span>
  <span>$28,400</span>
  <Badge intent="success">+12%</Badge>
</Card>`,
    },
  ],
});
