import { defineMetadata } from '../../metadata/schema.ts';

export const TextareaMetadata = defineMetadata({
  component: {
    name: 'Textarea',
    category: 'atom',
    description: 'Multi-line text input field for collecting longer form inputs.',
    type: 'input',
    path: 'src/components/Textarea/Textarea.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'feedback-forms',
      'long-descriptions',
      'comment-sections',
      'message-compose',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-textarea',
        description: 'Standard multi-line comment box.',
        composition: `<Textarea placeholder="Type your comment here..." />`,
      },
      {
        name: 'invalid-textarea',
        description: 'Textarea with an error boundary highlight.',
        composition: `<Textarea invalid placeholder="Describe the bug details..." />`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Textarea for short single-line inputs like email or passwords.',
        reason: 'Textareas are designed for multi-line flow. Single-line fields confuse users and make form validation indicators misaligned.',
        alternative: 'Use the standard Input component instead.',
      },
      {
        scenario: 'Setting height constraints that prevent resizing or make text cut off.',
        reason: 'Users need to see the full content they typed. Hardcoding overflow hidden or extremely small max-heights limits readability.',
        alternative: 'Set min-height constraints but allow standard vertical resizing.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Border var(--ds-component-input-border), background var(--ds-component-input-bg).' },
      { name: 'hover', visual: 'Border transitions to var(--ds-component-input-border-hover).' },
      { name: 'focus', visual: 'Border transitions to var(--ds-component-input-border-focus), focus shadow applied.' },
      { name: 'invalid', visual: 'Border changes to var(--ds-component-input-border-error).' },
      { name: 'disabled', visual: '50% opacity, background var(--ds-component-input-bg-disabled), pointer-events-none.' }
    ],
    interactions: [
      'Keyboard typing inputs text.',
      'Tab navigation highlights focus ring.'
    ],
    responsive: 'Fills width of container. Responsive resizing default vertical.'
  },
  props: {
    invalid: { type: 'boolean', default: 'false', required: false, description: 'Renders the input with an error border.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables editing and interaction.' },
    placeholder: { type: 'string', required: false, description: 'Helper placeholder text.' },
    rows: { type: 'number', required: false, description: 'Number of visible text lines.' }
  },
  tokens: {
    semantic: [
      'component.input.radius',
      'component.input.bg',
      'component.input.bgDisabled',
      'component.input.text',
      'component.input.placeholder',
      'component.input.border',
      'component.input.borderHover',
      'component.input.borderFocus',
      'component.input.borderError',
      'component.input.shadowFocus'
    ]
  },
  accessibility: {
    role: 'implicit (native <textarea>)',
    keyboardSupport: 'Standard typing support.',
    screenReader: 'Announces as textarea with placeholder, value and invalid state description.',
    wcag: 'AA',
    notes: [
      'Ensure the textarea is associated with a Label (via FormField or direct Label htmlFor) for full accessibility.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['textarea', 'input', 'multiline', 'comment', 'description', 'message', 'text'],
    selectionCriteria: {
      'Do you need the user to type more than one line of text?': 'Yes, use Textarea.'
    },
    disambiguateFrom: {
      Input: 'Input is for single-line fields (e.g., username, email, search). Textarea is for longer paragraphs.'
    }
  },
  examples: [
    {
      name: 'labelled-textarea',
      description: 'Textarea wrapped in a FormField container.',
      code: `<FormField label="Bio" helpText="Write a few sentences about yourself.">
  <Textarea placeholder="I am a software engineer..." />
</FormField>`
    }
  ]
});
