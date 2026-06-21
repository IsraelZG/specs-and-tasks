import { defineMetadata } from '../../metadata/schema.ts';

export const PopoverMetadata = defineMetadata({
  component: {
    name: 'Popover',
    category: 'molecule',
    description: 'A floating dialog panel that appears anchored relative to a trigger element.',
    type: 'container',
    path: 'src/components/Popover/Popover.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'inline-configuration-forms',
      'rich-hover-info-panels',
      'quick-settings-popups',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'input-settings-popover',
        description: 'Popover containing input settings fields.',
        composition: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Settings</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-semibold">Dimensions</h4>
      <Input label="Width" defaultValue="300px" />
    </div>
  </PopoverContent>
</Popover>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Popover instead of Dialog (Modal) for full-screen checkout or complex workflows.',
        reason: 'Popovers are light overlay elements meant for quick toggles. Complex workflows requiring scrolling, extensive data entry, or blocking background actions should use Modals.',
        alternative: 'Use Modal component instead.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Overlay panel completely hidden.' },
      { name: 'open', visual: 'Fades and zooms in anchored directly adjacent to trigger (customizable placement).' }
    ],
    interactions: [
      'Clicking trigger toggles open/close state.',
      'Clicking outside or pressing Escape closes the popover.'
    ],
    responsive: 'Controlled by width bounding container; placement shifts dynamically to prevent clipping on screen edges.'
  },
  props: {
    open: { type: 'boolean', required: false, description: 'Controlled open state.' },
    defaultOpen: { type: 'boolean', required: false, description: 'Initial default open state.' },
    onOpenChange: { type: '(open: boolean) => void', required: false, description: 'Callback fired when open/closed toggles.' },
    align: { type: '"start" | "center" | "end"', default: '"center"', required: false, description: 'Alignment relative to anchor.' },
    side: { type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', required: false, description: 'Default screen side placement.' },
    sideOffset: { type: 'number', default: '4', required: false, description: 'Spacing gap between trigger and popover.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'dialog',
    keyboardSupport: 'Tab navigates inside panel. Escape closes. Focus is returned to trigger on close.',
    screenReader: 'Announces popover role, focus trap acts correctly, reads interior elements.',
    wcag: 'AAA',
    notes: [
      'Radix Popover manages full overlay WAI-ARIA behavior including focus-trap, portal, and trigger indexing.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['popover', 'floating-box', 'tooltip-box', 'overlay-popup', 'anchor-menu'],
    selectionCriteria: {
      'Do you need a rich HTML dropdown configuration panel anchored to a button?': 'Yes, use Popover.'
    },
    disambiguateFrom: {
      Modal: 'Modal (Dialog) is a centered overlay with a full dark backdrop. Popover is small and anchored to a specific trigger button.',
      Tooltip: 'Tooltip is for hover-based text labels. Popover is click-triggered and can contain inputs and buttons.'
    }
  },
  examples: [
    {
      name: 'simple-popover-info',
      description: 'Helper tooltip-like info popover.',
      code: `<Popover>
  <PopoverTrigger>Info</PopoverTrigger>
  <PopoverContent className="w-56">
    <p className="text-xs">Learn more about our theme system variables here.</p>
  </PopoverContent>
</Popover>`
    }
  ]
});
