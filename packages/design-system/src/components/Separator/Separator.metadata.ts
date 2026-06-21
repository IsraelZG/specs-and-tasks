import { defineMetadata } from '../../metadata/schema.ts';

export const SeparatorMetadata = defineMetadata({
  component: {
    name: 'Separator',
    category: 'atom',
    description: 'A visual or semantic line divider used to separate content.',
    type: 'layout',
    path: 'src/components/Separator/Separator.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'content-dividers',
      'vertical-menu-separators',
      'card-header-footer-demarcations',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'horizontal-separator',
        description: 'Standard horizontal line separating stacked block elements.',
        composition: `<div className="space-y-4">
  <div>Header Content</div>
  <Separator />
  <div>Body Content</div>
</div>`,
      },
      {
        name: 'vertical-separator',
        description: 'A vertical divider between inline elements like links or stats.',
        composition: `<div className="flex h-5 items-center space-x-4">
  <div>Profile</div>
  <Separator orientation="vertical" />
  <div>Settings</div>
</div>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using custom borders everywhere instead of Separator.',
        reason: 'Using ad-hoc borders makes layout changes harder to manage and breaks thematic customizer variables.',
        alternative: 'Use Separator component to consistently apply theme.border.subtle.',
      },
      {
        scenario: 'Using Separator without orientation="vertical" in inline flex container layout.',
        reason: 'A separator default orientation is horizontal. Placing it in an inline flex layout without vertical orientation will cause it to collapse or stretch incorrectly.',
        alternative: 'Pass orientation="vertical" when using inside flex layouts.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: '1px wide/tall line with theme.border.subtle background.' }
    ],
    interactions: [
      'None. It acts as a static divider.'
    ],
    responsive: 'Expands automatically to fit either container width (horizontal) or height (vertical).'
  },
  props: {
    orientation: { type: '"horizontal" | "vertical"', default: '"horizontal"', required: false, description: 'Direction orientation.' },
    decorative: { type: 'boolean', default: 'true', required: false, description: 'Whether the element is decorative only (ignored by screen readers).' }
  },
  tokens: {
    semantic: [
      'theme.border.subtle'
    ]
  },
  accessibility: {
    role: 'separator',
    keyboardSupport: 'None.',
    screenReader: 'If decorative=false, screen reader announces the separator role to demarcate sections. If decorative=true, it is completely ignored.',
    wcag: 'AAA',
    notes: [
      'Built using Radix Separator primitive which coordinates the proper aria-orientation and separator attributes.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['separator', 'divider', 'line', 'border-line', 'horizontal-line'],
    selectionCriteria: {
      'Do you need a visual dividing line between sections or elements?': 'Yes, use Separator.'
    },
    disambiguateFrom: {
      Card: 'Card manages the border layout boundary of a whole section. Separator partitions simple content chunks inside a layout.'
    }
  },
  examples: [
    {
      name: 'toolbar-with-divider',
      description: 'A flex toolbar row with items separated vertically.',
      code: `<div className="flex items-center space-x-2 h-8">
  <button>Edit</button>
  <Separator orientation="vertical" className="h-4" />
  <button>Delete</button>
</div>`
    }
  ]
});
