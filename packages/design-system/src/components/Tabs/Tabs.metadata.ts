import { defineMetadata } from '../../metadata/schema.ts';

export const TabsMetadata = defineMetadata({
  component: {
    name: 'Tabs',
    category: 'molecule',
    description: 'A set of layered sections of content, known as tab panels, that are displayed one at a time.',
    type: 'interactive',
    path: 'src/components/Tabs/Tabs.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'settings-panel-sections',
      'dashboard-view-toggles',
      'multi-mode-layout-tabs',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-tabbed-layout',
        description: 'Exposes profile vs password settings tabs.',
        composition: `<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Manage profile info...</TabsContent>
  <TabsContent value="password">Reset secure password...</TabsContent>
</Tabs>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Tabs to perform page routing navigation.',
        reason: 'Tabs are designed to organize panels in local state context. Real page routing should use nav links or navigation menus.',
        alternative: 'Use NavItem or Navigation Menu for page routing.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'active', visual: 'Active tab trigger is styled with white background and subtle drop shadow.' },
      { name: 'inactive', visual: 'Inactive tabs triggers are semi-transparent and blend into list background.' }
    ],
    interactions: [
      'Clicking a tab trigger switches to its corresponding tab content pane immediately.',
      'Keyboard left/right arrows cycle through triggers.'
    ],
    responsive: 'Tabs list stretches to fit trigger items, wraps or adapts on mobile widths.'
  },
  props: {
    defaultValue: { type: 'string', required: false, description: 'The value of the tab that should be active by default.' },
    value: { type: 'string', required: false, description: 'The controlled active tab value.' },
    onValueChange: { type: '(value: string) => void', required: false, description: 'Callback fired when active tab value changes.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.sm',
      'focusRing.{width,offset,color,shadow}'
    ]
  },
  accessibility: {
    role: 'tablist',
    keyboardSupport: 'Left/Right Arrow keys navigate active triggers. Space/Enter activates tab. Home/End jumps to first/last tab.',
    screenReader: 'Announces active state, selected status, panel names, and total count.',
    wcag: 'AAA',
    notes: [
      'Radix Tabs primitive implements standard WAI-ARIA tab list guidelines.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['tabs', 'tablist', 'tabpanel', 'tab-trigger', 'view-switcher'],
    selectionCriteria: {
      'Do you need to partition content views on the same page using local tab switching?': 'Yes, use Tabs.'
    },
    disambiguateFrom: {
      Navbar: 'Navbar is for navigating page URLs. Tabs is for displaying local component segments on the same URL.'
    }
  },
  examples: [
    {
      name: 'simple-tabs',
      description: 'Account settings layout switching.',
      code: `<Tabs defaultValue="info">
  <TabsList>
    <TabsTrigger value="info">Info</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="info">
    <p>Info content</p>
  </TabsContent>
  <TabsContent value="security">
    <p>Security details</p>
  </TabsContent>
</Tabs>`
    }
  ]
});
