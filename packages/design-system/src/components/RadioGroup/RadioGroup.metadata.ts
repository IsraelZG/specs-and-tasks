import { defineMetadata } from '../../metadata/schema.ts';

export const RadioGroupMetadata = defineMetadata({
  component: {
    name: 'RadioGroup',
    category: 'atom',
    description: 'A set of checkable buttons, known as radio buttons, where no more than one button can be checked at a time.',
    type: 'input',
    path: 'src/components/RadioGroup/RadioGroup.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'mutually-exclusive-options',
      'settings-forms',
      'filter-panels',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-radio-group',
        description: 'A group of labeled options.',
        composition: `<RadioGroup defaultValue="option-one">
  <div className="flex items-center gap-3">
    <RadioGroupItem value="option-one" id="r1" />
    <Label htmlFor="r1">Option One</Label>
  </div>
  <div className="flex items-center gap-3">
    <RadioGroupItem value="option-two" id="r2" />
    <Label htmlFor="r2">Option Two</Label>
  </div>
</RadioGroup>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using RadioGroup when multiple selections are allowed.',
        reason: 'Radio buttons represent mutually exclusive options (only one can be chosen). Selecting one deselects another.',
        alternative: 'Use Checkbox components for multi-select options.',
      },
      {
        scenario: 'Putting too many options (e.g., more than 5 or 6) inside a RadioGroup.',
        reason: 'Too many options in a vertical list clutter the screen and make scanning difficult.',
        alternative: 'Use a Select component for lists with many items.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Neutral circular border.' },
      { name: 'checked', visual: 'Primary border with solid primary dot centered.' },
      { name: 'focus', visual: 'Outer focus ring outline.' },
      { name: 'disabled', visual: '50% opacity, pointer-events-none, cursor-not-allowed.' }
    ],
    interactions: [
      'Arrow keys navigate between options within the group.',
      'Clicking or pressing Space selects an item and deselects the previously checked one.'
    ],
    responsive: 'Custom gap options. Wraps horizontally or stacks vertically.'
  },
  props: {
    defaultValue: { type: 'string', required: false, description: 'Default checked value on render.' },
    value: { type: 'string', required: false, description: 'Controlled checked value.' },
    onValueChange: { type: '(value: string) => void', required: false, description: 'Callback triggered when selection changes.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables editing and selection.' }
  },
  tokens: {
    semantic: [
      'component.checkbox.size',
      'component.checkbox.border',
      'component.checkbox.bgChecked'
    ]
  },
  accessibility: {
    role: 'radiogroup',
    keyboardSupport: 'Arrow keys select next/previous option. Tab navigation focus.',
    screenReader: 'Announces as radiogroup, option count, selected option, and keyboard navigation instructions.',
    wcag: 'AAA',
    notes: [
      'Uses Radix Radio Group primitive which fully satisfies WAI-ARIA authoring practices.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['radio', 'radiogroup', 'exclusive', 'single-select', 'choice', 'option'],
    selectionCriteria: {
      'Do you need the user to choose exactly one option from a small set of items?': 'Yes, use RadioGroup.'
    },
    disambiguateFrom: {
      Checkbox: 'Checkbox allows selecting multiple options. RadioGroup allows selecting exactly one.',
      Select: 'Select is used for a large list of options that is collapsed by default. RadioGroup displays all options at once.'
    }
  },
  examples: [
    {
      name: 'horizontal-radio-group',
      description: 'Radio group with items aligned horizontally.',
      code: `<RadioGroup defaultValue="cozy" className="flex items-center gap-6">
  <div className="flex items-center gap-2">
    <RadioGroupItem value="compact" id="compact" />
    <Label htmlFor="compact">Compact</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="cozy" id="cozy" />
    <Label htmlFor="cozy">Cozy</Label>
  </div>
</RadioGroup>`
    }
  ]
});
