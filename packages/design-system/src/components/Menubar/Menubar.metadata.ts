import { defineMetadata } from '../../metadata/schema.ts';

export const MenubarMetadata = defineMetadata({
  component: {
    name: 'Menubar',
    category: 'organism',
    description: 'A horizontal menu bar displaying drop-down action lists (e.g. desktop app headers).',
    type: 'interactive',
    path: 'src/components/Menubar/Menubar.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'application-header-menus',
      'desktop-style-navigation-bars',
      'editor-toolbar-actions',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-menubar',
        description: 'Exposes drop-down navigation links.',
        composition: `<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New File<MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Share</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'open', visual: 'Displays drop-down option lists.' }
    ],
    interactions: [
      'Clicking or focusing triggers open states.',
      'Arrow keys navigate between adjacent triggers.'
    ],
    responsive: 'Wraps items or collapses options for viewport limits.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.sm',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'menubar',
    keyboardSupport: 'Full arrow-key triggers traversal.',
    screenReader: 'Reads active options index and selection states.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'medium',
    keywords: ['menubar', 'top-navigation-menu', 'toolbar-actions', 'drop-down-header'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
