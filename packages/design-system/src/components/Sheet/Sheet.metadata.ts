import { defineMetadata } from '../../metadata/schema.ts';

export const SheetMetadata = defineMetadata({
  component: {
    name: 'Sheet',
    category: 'organism',
    description: 'A slide-in dialog panel extending from any edge of the screen, typically used for settings, navigation drawer, or detailed profile configurations.',
    type: 'container',
    path: 'src/components/Sheet/Sheet.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'navigation-drawers-mobile',
      'detail-configuration-side-panels',
      'quick-creation-form-overlays',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'right-side-configuration-sheet',
        description: 'Exposes settings inputs in a right-sliding sidebar drawer.',
        composition: `<Sheet>
  <SheetTrigger asChild>
    <Button>Open Settings</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Settings</SheetTitle>
      <SheetDescription>Configure layout themes.</SheetDescription>
    </SheetHeader>
    <div className="py-4">Form inputs here...</div>
    <SheetFooter>
      <SheetClose asChild>
        <Button>Save</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Sheet for simple confirmation messages or alert responses.',
        reason: 'Sheet takes up a large portion of the screen (typically full height/width or 380px sidebar) which is visual overkill for a brief yes/no confirmation prompt.',
        alternative: 'Use Modal or Alert Dialog component for quick focused notifications or choices.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Panel slides completely off-screen and overlay backdrop fades out.' },
      { name: 'open', visual: 'Overlay backdrop fades in; content panel slides in from target screen edge.' }
    ],
    interactions: [
      'Clicking trigger opens the sheet.',
      'Clicking backdrop, close icon, or pressing Escape dismisses the sheet.'
    ],
    responsive: 'Automatically stretches to 100% width on mobile viewports for clean interaction.'
  },
  props: {
    side: { type: '"top" | "bottom" | "left" | "right"', default: '"right"', required: false, description: 'Which screen edge the drawer panel slides from.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.lg',
      'focusRing.{width,offset,color,shadow}'
    ]
  },
  accessibility: {
    role: 'dialog',
    keyboardSupport: 'Tab focus trap inside sheet. Escape closes. Focus is returned to trigger element.',
    screenReader: 'Announces dialog title, description and states natively.',
    wcag: 'AAA',
    notes: [
      'Radix Dialog base manages focus management, keyboard indexing, and WAI-ARIA states.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['sheet', 'drawer', 'sidebar-menu', 'overlay-panel', 'slide-in-modal'],
    selectionCriteria: {
      'Do you need a full-height sidebar menu or settings panel sliding from the side of the screen?': 'Yes, use Sheet.'
    },
    disambiguateFrom: {
      Modal: 'Modal is a centered popup box. Sheet is a sidebar sliding from screen edges.',
      Popover: 'Popover is a small floating bubble anchored directly to a trigger element.'
    }
  },
  examples: [
    {
      name: 'mobile-navigation-menu',
      description: 'Sidebar drawer for mobile navigation links.',
      code: `<Sheet>
  <SheetTrigger>Menu</SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
    </SheetHeader>
    <div className="flex flex-col space-y-3 mt-4">
      <a href="/">Dashboard</a>
      <a href="/projects">Projects</a>
    </div>
  </SheetContent>
</Sheet>`
    }
  ]
});
