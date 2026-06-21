import { defineMetadata } from '../../metadata/schema.ts';

export const TooltipMetadata = defineMetadata({
  component: {
    name: 'Tooltip',
    category: 'molecule',
    description: 'A popup panel displaying helper description text when a user hovers over or focus-indexes an element.',
    type: 'display',
    path: 'src/components/Tooltip/Tooltip.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'icon-only-button-labels',
      'field-helper-definitions',
      'supplementary-status-explainer',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'icon-button-tooltip',
        description: 'Tooltip explaining action of an icon-only button.',
        composition: `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost">＋</Button>
    </TooltipTrigger>
    <TooltipContent>Add repository</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Putting interactive elements like buttons or inputs inside TooltipContent.',
        reason: 'Tooltips are transient and close immediately on hover out. Keyboard and screen reader users cannot easily navigate into tooltip popups.',
        alternative: 'Use Popover component for overlays containing buttons, links, or input fields.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Tooltip bubble hidden.' },
      { name: 'open', visual: 'Fades and zooms in near the trigger element on hover or keyboard focus.' }
    ],
    interactions: [
      'Hovering trigger reveals tooltip.',
      'Keyboard tab focus reveals tooltip.',
      'Moving cursor away or blurring trigger hides tooltip.'
    ],
    responsive: 'Repositioned automatically near screen boundaries to prevent clipping.'
  },
  props: {
    delayDuration: { type: 'number', default: '700', required: false, description: 'Hover delay duration in milliseconds.' }
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
    role: 'tooltip',
    keyboardSupport: 'Revealed on Tab focus. Escape closes.',
    screenReader: 'Announces content associated with the trigger using aria-describedby automatically.',
    wcag: 'AAA',
    notes: [
      'Radix Tooltip primitive automatically links trigger and content for screen reader association.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['tooltip', 'hint', 'helper-text', 'bubble-hint', 'hover-info'],
    selectionCriteria: {
      'Do you need to show a simple, static description text when hovering over a button or icon?': 'Yes, use Tooltip.'
    },
    disambiguateFrom: {
      Popover: 'Popover is triggered on click and can contain interactive elements like inputs. Tooltip is hover/focus triggered and static.'
    }
  },
  examples: [
    {
      name: 'simple-tooltip',
      description: 'Standard tooltip wrapping an icon.',
      code: `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Help</TooltipTrigger>
    <TooltipContent>
      <p>Need assistance? Contact support.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`
    }
  ]
});
