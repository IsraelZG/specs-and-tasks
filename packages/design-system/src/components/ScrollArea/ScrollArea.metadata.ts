import { defineMetadata } from '../../metadata/schema.ts';

export const ScrollAreaMetadata = defineMetadata({
  component: {
    name: 'ScrollArea',
    category: 'atom',
    description: 'Custom scrollbar container supporting cross-platform mouse, trackpad, and touch scrolling.',
    type: 'layout',
    path: 'src/components/ScrollArea/ScrollArea.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'scrolling-long-dropdown-lists',
      'chat-feed-viewports',
      'code-block-overflow-wrappers',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'fixed-height-scrollarea',
        description: 'A scrolling viewport with a fixed height constraint.',
        composition: `<ScrollArea className="h-72 w-48 rounded-md border border-[color:var(--ds-theme-border-subtle)] p-4">
  <div>Lots of content...</div>
</ScrollArea>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Putting ScrollArea inside a container without height limits.',
        reason: 'If the outer container has infinite height (or auto-stretching), the ScrollArea will expand to match the content height, rendering scrollbars useless.',
        alternative: 'Ensure either the ScrollArea class (like h-48) or its parent has a fixed height limit (like max-h-[300px] or h-[200px]).',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Viewport area showing content. Scrollbar track fades in on scroll or hover.' }
    ],
    interactions: [
      'Mousewheel, trackpad swiping, or dragging scrollbar thumb navigates the viewport.',
      'Touch dragging moves viewport contents natively.'
    ],
    responsive: 'Adapts width and height to fit constraints.'
  },
  props: {
    type: { type: '"auto" | "always" | "scroll" | "hover"', default: '"hover"', required: false, description: 'Scrollbar visibility behavior.' }
  },
  tokens: {
    semantic: [
      'theme.border.default'
    ]
  },
  accessibility: {
    role: 'region',
    keyboardSupport: 'Standard keyboard navigation when viewport is focused.',
    screenReader: 'Reads content elements sequentially.',
    wcag: 'AAA',
    notes: [
      'Coordinated using Radix ScrollArea supporting full accessibility guidelines.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['scrollarea', 'custom-scrollbar', 'overflow', 'scrollbar', 'panel-scroll'],
    selectionCriteria: {
      'Do you need to display scrollable content with custom styling instead of ugly native scrollbars?': 'Yes, use ScrollArea.'
    },
    disambiguateFrom: {
      Card: 'Card is for grouping structural content. ScrollArea is a layout overflow manager.'
    }
  },
  examples: [
    {
      name: 'tags-scroll-list',
      description: 'A scrollable vertical list of tags.',
      code: `const tags = Array.from({ length: 50 }).map((_, i) => \`Tag \${i + 1}\`);
return (
  <ScrollArea className="h-40 w-48 border rounded-md">
    <div className="p-4 space-y-2">
      {tags.map(tag => <div key={tag} className="text-sm">{tag}</div>)}
    </div>
  </ScrollArea>
)`
    }
  ]
});
