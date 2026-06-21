import { defineMetadata } from '../../metadata/schema.ts';

export const LabelMetadata = defineMetadata({
  component: {
    name: 'Label',
    category: 'atom',
    description: 'Render an accessible label associated with form controls.',
    type: 'display',
    path: 'src/components/Label/Label.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'form-labels',
      'input-descriptors',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-label',
        description: 'Standard text label for an input field.',
        composition: `<Label htmlFor="email-input">Email Address</Label>`,
      },
      {
        name: 'required-label',
        description: 'Label showing red indicator for required inputs.',
        composition: `<Label htmlFor="username" required>Username</Label>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Label to display large section headings.',
        reason: 'Label is semantically tied to form inputs and should not be used as a general typographic heading.',
        alternative: 'Use standard heading elements (h1, h2, etc.) or a dedicated Text/Heading component.',
      },
      {
        scenario: 'Nesting interactive elements inside a Label.',
        reason: 'Clicking any part of a label focuses the associated input. Nesting buttons or other inputs inside it creates ambiguous click targets.',
        alternative: 'Keep the label content simple and place interactive helpers beside or below it.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Regular text color var(--ds-theme-content-strong).' },
      { name: 'disabled', visual: '50% opacity, cursor-not-allowed.' }
    ],
    interactions: [
      'Clicking or tapping the label focuses the associated element linked via htmlFor.'
    ],
    responsive: 'Fixed standard font size. Wraps naturally.'
  },
  props: {
    htmlFor: { type: 'string', required: false, description: 'ID of the input component this label is associated with.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Visual state indicating the linked input is disabled.' },
    required: { type: 'boolean', default: 'false', required: false, description: 'Appends a red asterisk to indicate the field is mandatory.' },
    children: { type: 'ReactNode', required: false, description: 'Label text or elements.' }
  },
  tokens: {
    semantic: []
  },
  accessibility: {
    role: 'implicit (native <label>)',
    keyboardSupport: 'None.',
    screenReader: 'Announces as the label text for the associated input.',
    wcag: 'AA',
    notes: [
      'Ensure htmlFor matches the ID of the target input element for accessibility.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['label', 'form', 'text', 'descriptor', 'required', 'asterisk'],
    selectionCriteria: {
      'Do you need to label a form control?': 'Yes, use Label with htmlFor pointing to the control ID.'
    },
    disambiguateFrom: {
      FormField: 'FormField is a wrapper containing a label, input, and help text. Label is the raw text label itself.'
    }
  },
  examples: [
    {
      name: 'labelled-input',
      description: 'Using Label with an Input component.',
      code: `<div className="flex flex-col gap-2">
  <Label htmlFor="email" required>Email Address</Label>
  <Input id="email" type="email" placeholder="name@example.com" />
</div>`
    }
  ]
});
