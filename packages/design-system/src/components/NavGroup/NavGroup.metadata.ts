import { defineMetadata } from '../../metadata/schema.ts';

export const NavGroupMetadata = defineMetadata({
  component: {
    name: 'NavGroup',
    category: 'molecule',
    description: "Groups NavItems under an optional overline category label. The structural wrapper that satisfies NavItem's parentConstraints.",
    type: 'navigation',
    path: 'src/components/NavGroup/NavGroup.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'sidebar-category-group',
      'menu-section',
      'settings-section-header',
      'navigation-rail-group',
    ],
    requiredProps: ['children'],
    commonPatterns: [
      {
        name: 'labeled-group',
        description: 'Use when a sidebar has multiple sections with distinct categories.',
        composition: `<NavGroup label="Main"><NavItem as="button">Dashboard</NavItem></NavGroup>`,
      },
      {
        name: 'unlabeled-group',
        description: 'Use when only one group exists and no label is needed.',
        composition: `<NavGroup><NavItem as="button">Home</NavItem></NavGroup>`,
      },
    ],
    antiPatterns: [
      {
        scenario: 'Nesting NavGroup inside NavGroup.',
        reason: 'Creates ambiguous hierarchy and breaks the flat navigation contract.',
        alternative: 'Use sequential NavGroup siblings with different labels.',
      },
      {
        scenario: 'Placing non-NavItem content directly inside NavGroup.',
        reason: 'NavGroup is a structural wrapper — only NavItems belong inside it.',
        alternative: 'Use Card or a plain div for mixed content layouts.',
      },
      {
        scenario: 'Using NavGroup as a generic vertical list container.',
        reason: 'NavGroup is navigation-specific and sets gap/padding for NavItem height.',
        alternative: 'Use a plain flex flex-col div for non-navigation lists.',
      },
      {
        scenario: 'Setting active=true on more than one NavItem inside the same NavGroup.',
        reason: 'Active state is exclusive within a navigation group — two active items is a bug.',
        alternative: 'Track the single active route/section in state and derive active prop.',
      },
    ],
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'One or more NavItem components.',
        acceptedComponents: ['NavItem'],
        forbiddenComponents: ['NavGroup', 'Button', 'Card'],
        required: true,
      },
    ],
    commonSiblings: ['NavGroup'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'NavItem', 'Card'],
  },

  behavior: {
    states: [
      { name: 'default', visual: 'Transparent container with optional muted overline label.' },
    ],
    interactions: [],
    responsive: 'No responsive changes. The parent sidebar controls width.',
    motion: 'None.',
  },

  props: {
    label: { type: 'string', required: false, description: 'Overline category heading displayed above the items.' },
    children: { type: 'ReactNode', required: true, description: 'NavItem elements to group.', acceptsNode: true },
    className: { type: 'string', required: false, description: 'Additional classes merged onto the root div.' },
  },

  tokens: {
    semantic: [
      'component.navigation.item.paddingX',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (div, no landmark role)',
    keyboardSupport: 'No keyboard behavior — NavItem handles all keyboard interaction.',
    screenReader: 'Label text is visible but has no ARIA role. Wrap in <nav aria-label="..."> at the sidebar level.',
    wcag: 'AA',
    notes: [
      'The sidebar that contains NavGroup should carry the <nav> landmark and aria-label.',
      'Label text is decorative structure, not a landmark heading — do not use <h*> tags.',
    ],
  },

  aiHints: {
    priority: 'medium',
    keywords: ['nav group', 'sidebar section', 'menu section', 'navigation category', 'nav label'],
    selectionCriteria: {
      'Is the user building a sidebar with multiple sections?': 'Yes — use NavGroup with a label for each section.',
      'Does the content include non-navigation items?': 'No — use a plain div. NavGroup is for NavItem children only.',
      'Should the category label appear as a heading?': 'No — the label is an overline (uppercase, muted), not a heading. Use it for navigation grouping only.',
    },
    disambiguateFrom: {
      NavItem: 'NavItem is a single row; NavGroup is the container that holds multiple NavItems.',
      Card: 'Card is a content container with border/shadow; NavGroup is a structural wrapper for navigation only.',
    },
  },

  examples: [
    {
      name: 'sidebar-with-categories',
      description: 'Two-section sidebar with labeled NavGroups.',
      code: `
<nav aria-label="Main navigation">
  <NavGroup label="Main">
    <NavItem as="button" active>Dashboard</NavItem>
    <NavItem as="button">Analytics</NavItem>
  </NavGroup>
  <NavGroup label="Admin">
    <NavItem as="button">Users</NavItem>
    <NavItem as="button" disabled>Settings</NavItem>
  </NavGroup>
</nav>`,
    },
  ],
});
