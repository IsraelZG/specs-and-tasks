import { defineMetadata } from '../../metadata/schema.ts';

export const CollapsibleMetadata = defineMetadata({
  component: {
    name: 'Collapsible',
    category: 'molecule',
    description: 'An interactive component which lets the user expand or collapse a panel of content.',
    type: 'layout',
    path: 'src/components/Collapsible/Collapsible.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'expandable-sections',
      'show-more-show-less-toggles',
      'collapsible-sidebar-submenus',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'basic-collapsible',
        description: 'Standard expansion card layout with title toggle.',
        composition: `<Collapsible>
  <CollapsibleTrigger>Can I edit this theme?</CollapsibleTrigger>
  <CollapsibleContent>
    Yes! You can use the Theme Customizer drawer panel to edit colors.
  </CollapsibleContent>
</Collapsible>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Collapsible when Accordion multi-expand coordination is expected.',
        reason: 'Collapsibles are standalone elements. If you need a group where opening one closes the other, Accordion is much better suited.',
        alternative: 'Use Accordion component instead.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'collapsed', visual: 'Trigger element visible. Content pane hidden.' },
      { name: 'expanded', visual: 'Content pane slides down or reveals itself instantly below trigger.' }
    ],
    interactions: [
      'Clicking trigger toggles open/close state.',
      'Can be controlled using open/onOpenChange props.'
    ],
    responsive: 'Adapts width to parent sizing.'
  },
  props: {
    open: { type: 'boolean', required: false, description: 'Controlled open state.' },
    defaultOpen: { type: 'boolean', required: false, description: 'Initial default open state.' },
    onOpenChange: { type: '(open: boolean) => void', required: false, description: 'Callback fired when open/closed toggles.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Prevents expanding or collapsing.' }
  },
  tokens: {
    semantic: []
  },
  accessibility: {
    role: 'button / region',
    keyboardSupport: 'Tab focus on trigger. Enter/Space key activates toggle.',
    screenReader: 'Trigger button announces state (expanded: true/false) and controls the content pane ID (aria-controls).',
    wcag: 'AAA',
    notes: [
      'Built using Radix Collapsible primitive coordinating proper screen reader attributes and focus indexing.'
    ]
  },
  aiHints: {
    priority: 'medium',
    keywords: ['collapsible', 'expandable', 'reveal-box', 'accordion-item', 'show-more'],
    selectionCriteria: {
      'Do you need a single independent section that can expand and collapse?': 'Yes, use Collapsible.'
    },
    disambiguateFrom: {
      Accordion: 'Accordion is a group of stacked collapsibles that typically coordinate selections (opening one shuts the rest).'
    }
  },
  examples: [
    {
      name: 'show-more-card',
      description: 'Collapsible text preview with show more trigger.',
      code: `const [open, setOpen] = useState(false);
return (
  <Collapsible open={open} onOpenChange={setOpen}>
    <p>This is a short preview paragraph...</p>
    <CollapsibleContent>
      <p>Here is the full descriptive details hidden initially by default.</p>
    </CollapsibleContent>
    <CollapsibleTrigger className="text-xs font-semibold hover:underline">
      {open ? "Show Less" : "Show More"}
    </CollapsibleTrigger>
  </Collapsible>
)`
    }
  ]
});
