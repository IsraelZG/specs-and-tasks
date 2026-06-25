import { defineMetadata } from '../../metadata/schema.ts';

export const CommandMetadata = defineMetadata({
  component: {
    name: 'Command',
    category: 'organism',
    description: 'A modal command palette allowing search-based executable items and shortcuts.',
    type: 'interactive',
    path: 'src/components/Command/Command.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'global-command-palettes',
      'action-quick-triggers',
      'quick-nav-overlays',
    ],
    requiredProps: ['open', 'onOpenChange'],
    commonPatterns: [
      {
        name: 'standard-command-dialog',
        description: 'Exposes actions group and search filter.',
        composition: `<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search actions..." />
  <CommandList>
    <CommandGroup heading="Settings">
      <CommandItem>Toggle Dark Mode<CommandShortcut>⌘D</CommandShortcut></CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'open', visual: 'Renders overlays above main dashboard context.' }
    ],
    interactions: [
      'Esc key closes dialog view.',
      'Clicking items fires click/select actions.'
    ],
    responsive: 'Centers overlays and down-sizes widths on mobile.'
  },
  props: {
    open: { type: 'boolean', required: true, description: 'Triggers open modal state.' },
    onOpenChange: { type: '(open: boolean) => void', required: true, description: 'Fired on close triggers.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.lg'
    ]
  },
  accessibility: {
    role: 'dialog',
    keyboardSupport: 'Standard Esc key closing.',
    screenReader: 'Announces dialog title context and selectable item list indices.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'high',
    keywords: ['command-palette', 'quick-action-dialog', 'shortcuts-menu', 'omni-search'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
