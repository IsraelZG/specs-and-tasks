import { defineMetadata } from '../../metadata/schema.ts';

export const DropdownMenuMetadata = defineMetadata({
  component: {
    name: 'DropdownMenu',
    category: 'molecule',
    description: 'A contextual menu list presenting toggle options, links, or action shortcuts triggered by clicking a button.',
    type: 'interactive',
    path: 'src/components/DropdownMenu/DropdownMenu.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'context-actions-list',
      'user-profile-navigation-dropdowns',
      'table-row-actions-menus',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'user-profile-menu',
        description: 'Standard header dropdown navigation for a logged-in user.',
        composition: `<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary">My Profile</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using DropdownMenu when Select is intended for form-field selections.',
        reason: 'DropdownMenu triggers immediate navigation or action triggers. Select is optimized to set form state fields.',
        alternative: 'Use Select component for forms.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Menu dropdown list closed.' },
      { name: 'open', visual: 'Fades and slides in immediately under trigger button.' }
    ],
    interactions: [
      'Clicking trigger opens menu.',
      'Arrow keys navigate items.',
      'Clicking item triggers its select/action behavior and closes menu (unless checkbox/radio item configured to stay).'
    ],
    responsive: 'Repositions content position on small screen edges.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'menu',
    keyboardSupport: 'Space/Enter opens. Arrow keys navigate. Escape closes and returns focus.',
    screenReader: 'Announces items count, submenus, states (checkbox/radio checked states).',
    wcag: 'AAA',
    notes: [
      'Radix DropdownMenu primitive complies with WAI-ARIA Menu guidelines.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['dropdownmenu', 'menu-list', 'context-menu', 'action-list', 'dropdown'],
    selectionCriteria: {
      'Do you need a list of navigation options or actions triggered by a button?': 'Yes, use DropdownMenu.'
    },
    disambiguateFrom: {
      Select: 'Select is for choosing a single option inside a form context. DropdownMenu is for executing commands or navigating.'
    }
  },
  examples: [
    {
      name: 'complex-dropdown-menu',
      description: 'Dropdown menu with checklist items and shortcuts.',
      code: `<DropdownMenu>
  <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked>Show Sidebar</DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`
    }
  ]
});
