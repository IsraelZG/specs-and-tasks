import { defineMetadata } from '../../metadata/schema.ts';

export const BreadcrumbMetadata = defineMetadata({
  component: {
    name: 'Breadcrumb',
    category: 'molecule',
    description: 'A navigation helper displaying hierarchical link trails leading to the active page.',
    type: 'display',
    path: 'src/components/Breadcrumb/Breadcrumb.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'hierarchical-site-maps',
      'multi-level-folder-navigation',
      'step-by-step-wizards',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-breadcrumb-trail',
        description: 'Exposes home -> dashboard -> settings structure.',
        composition: `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Breadcrumb as the main site-header navigation menu.',
        reason: 'Breadcrumb is meant to show parent-child page hierarchies rather than a selection of unrelated peer links.',
        alternative: 'Use Navigation Menu or NavGroup component instead.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'link-hover', visual: 'Hovering a breadcrumb link changes its color to full theme content default.' },
      { name: 'active-page', visual: 'The terminal page element is non-interactive and styled with static color.' }
    ],
    interactions: [
      'Clicking a link navigates to target path.',
      'Middle-clicking or right-clicking links handles browser tab behaviors.'
    ],
    responsive: 'Optionally wraps paths or hides middle items using BreadcrumbEllipsis on small screens.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.content.default',
      'theme.content.muted'
    ]
  },
  accessibility: {
    role: 'navigation',
    keyboardSupport: 'Standard focusable anchor links. Terminal page carries aria-current="page".',
    screenReader: 'Announces navigation container with breadcrumb label; states and link destinations are announced.',
    wcag: 'AAA',
    notes: [
      'Ensures compliance with WAI-ARIA breadcrumb specifications.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['breadcrumb', 'nav-trail', 'hierarchy-link', 'path-navigator', 'breadcrumb-separator'],
    selectionCriteria: {
      'Do you need to display the current position in a page hierarchy with links back to parent folders?': 'Yes, use Breadcrumb.'
    },
    disambiguateFrom: {
      Tabs: 'Tabs switch view panels locally. Breadcrumbs show path hierarchies.'
    }
  },
  examples: [
    {
      name: 'breadcrumb-with-ellipsis',
      description: 'Collapsed middle paths.',
      code: `<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Billing</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`
    }
  ]
});
