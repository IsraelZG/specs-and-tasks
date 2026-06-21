import { defineMetadata } from '../../metadata/schema.ts';

export const AccordionMetadata = defineMetadata({
  component: {
    name: 'Accordion',
    category: 'molecule',
    description: 'A vertically stacked set of interactive headings that each disclose an associated content section.',
    type: 'interactive',
    path: 'src/components/Accordion/Accordion.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'frequently-asked-questions-faqs',
      'settings-group-sections',
      'collapsible-sidebar-submenus',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'faq-accordion',
        description: 'Exposes collapsible FAQ content blocks.',
        composition: `<Accordion type="single" collapsible>
  <AccordionItem value="faq-1">
    <AccordionTrigger>What is this design system?</AccordionTrigger>
    <AccordionContent>A highly accessible premium components framework.</AccordionContent>
  </AccordionItem>
</Accordion>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Accordion to stack forms with multiple critical inputs.',
        reason: 'Accordion hides content panel states by default, which can cause users to overlook required inputs inside collapsed panes.',
        alternative: 'Use standard page layout columns or Tabs to present extensive form inputs.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'collapsed', visual: 'Panel body hidden; trigger arrow indicator pointing down.' },
      { name: 'expanded', visual: 'Panel slides down; trigger arrow rotates 180 degrees upwards.' }
    ],
    interactions: [
      'Clicking header trigger expands target panel (and collapses other panes if type="single" is set).',
      'Trigger hover highlights header link underline.'
    ],
    responsive: 'Paddings and layouts adjust inline seamlessly on small screens.'
  },
  props: {
    type: { type: '"single" | "multiple"', required: true, description: 'Determines whether one or multiple items can be opened at a time.' },
    collapsible: { type: 'boolean', default: 'false', required: false, description: 'When type="single", allows closing the open item on trigger click.' }
  },
  tokens: {
    semantic: [
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'focusRing.{width,offset,color,shadow}'
    ]
  },
  accessibility: {
    role: 'region',
    keyboardSupport: 'Tab focusable triggers. Space/Enter toggles expand. Up/Down arrow keys navigate header triggers.',
    screenReader: 'Announces header button controls, expand states, panel region names.',
    wcag: 'AAA',
    notes: [
      'Radix Accordion complies with standard WAI-ARIA Accordion design guidelines.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['accordion', 'faq-list', 'collapsible-headers', 'disclosure-stack', 'expandable-panel'],
    selectionCriteria: {
      'Do you need to stack collapsible informational headings (e.g. FAQs)?': 'Yes, use Accordion.'
    },
    disambiguateFrom: {
      Collapsible: 'Collapsible is a single standalone expandable element. Accordion is a stacked group of elements sharing state/behaviors.'
    }
  },
  examples: [
    {
      name: 'multiple-accordion',
      description: 'Multiple active headers configuration.',
      code: `<Accordion type="multiple">
  <AccordionItem value="item-1">
    <AccordionTrigger>Details 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
</Accordion>`
    }
  ]
});
