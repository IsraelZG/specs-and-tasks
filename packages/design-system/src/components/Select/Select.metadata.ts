import { defineMetadata } from '../../metadata/schema.ts';

export const SelectMetadata = defineMetadata({
  component: {
    name: 'Select',
    category: 'molecule',
    description: 'An interactive form dropdown selector offering users choices from a collapsed option list.',
    type: 'input',
    path: 'src/components/Select/Select.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'form-field-selections',
      'option-configurations',
      'theme-style-pickers',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-select-field',
        description: 'Standard select setup inside a form label layout.',
        composition: `<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Select to trigger generic navigation links or commands.',
        reason: 'Select component is designated to control form value fields. Action buttons and dropdown routes should use DropdownMenu.',
        alternative: 'Use DropdownMenu component for command actions and navigations.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Collapsed trigger showing placeholder or active value.' },
      { name: 'open', visual: 'Fades and zooms option list content viewport anchored to the trigger bounds.' }
    ],
    interactions: [
      'Clicking trigger opens menu.',
      'Keyboard typing performs autocomplete search jump.',
      'Clicking option sets value and collapses panel.'
    ],
    responsive: 'Repositions content position dynamically to prevent clipping on small screen edges.'
  },
  props: {
    value: { type: 'string', required: false, description: 'Controlled value.' },
    defaultValue: { type: 'string', required: false, description: 'Initial default value.' },
    onValueChange: { type: '(value: string) => void', required: false, description: 'Callback fired when option value changes.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.default',
      'theme.border.subtle',
      'theme.content.default',
      'focusRing.{width,offset,color,shadow}',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'combobox',
    keyboardSupport: 'Space/Enter opens and selects. Up/Down arrows navigate options. Escape closes.',
    screenReader: 'Announces combobox roles, focused item value, options count.',
    wcag: 'AAA',
    notes: [
      'Radix Select primitive implements WCAG 2.1 compliant keyboard navigation and roles.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['select', 'dropdown-select', 'form-dropdown', 'option-picker', 'combobox'],
    selectionCriteria: {
      'Do you need to choose a single item from a list inside a form?': 'Yes, use Select.'
    },
    disambiguateFrom: {
      DropdownMenu: 'DropdownMenu is for running generic actions/navigations. Select is specifically for picking values inside forms.'
    }
  },
  examples: [
    {
      name: 'simple-select',
      description: 'Select pick choice for user roles.',
      code: `<Select defaultValue="member">
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="admin">Administrator</SelectItem>
    <SelectItem value="member">Team Member</SelectItem>
  </SelectContent>
</Select>`
    }
  ]
});
