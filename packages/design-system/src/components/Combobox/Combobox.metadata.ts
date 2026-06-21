import { defineMetadata } from '../../metadata/schema.ts';

export const ComboboxMetadata = defineMetadata({
  component: {
    name: 'Combobox',
    category: 'molecule',
    description: 'An autocomplete selector list offering filtering queries and value matches.',
    type: 'interactive',
    path: 'src/components/Combobox/Combobox.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'searchable-dropdowns',
      'long-option-lists',
      'countries-selections',
    ],
    requiredProps: ['options'],
    commonPatterns: [
      {
        name: 'controlled-combobox',
        description: 'Exposes combobox options selection.',
        composition: `const options = [{ value: '1', label: 'Option 1' }];
const [val, setVal] = useState('');
<Combobox options={options} value={val} onValueChange={setVal} />`,
      }
    ],
    antiPatterns: []
  },
  behavior: {
    states: [
      { name: 'open', visual: 'Displays filter list overlay.' }
    ],
    interactions: [
      'Typing in search input filters matching options list.'
    ],
    responsive: 'Matches trigger button width in layouts.'
  },
  props: {
    options: { type: 'ComboboxOption[]', required: true, description: 'List of key-label option pairs.' },
    value: { type: 'string', required: false, description: 'Selected option value.' },
    onValueChange: { type: '(value: string) => void', required: false, description: 'Callback fired on option select.' },
    placeholder: { type: 'string', default: '"Select option..."', required: false, description: 'Trigger button placeholder text.' },
    searchPlaceholder: { type: 'string', default: '"Search..."', required: false, description: 'Search input placeholder text.' },
    emptyText: { type: 'string', default: '"No options found."', required: false, description: 'No matches info fallback text.' }
  },
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.md'
    ]
  },
  accessibility: {
    role: 'combobox',
    keyboardSupport: 'Full dropdown lists navigation.',
    screenReader: 'Reads selected option state and options matches count.',
    wcag: 'AA',
    notes: []
  },
  aiHints: {
    priority: 'high',
    keywords: ['combobox', 'autocomplete-dropdown', 'searchable-select', 'list-filter'],
    selectionCriteria: {},
    disambiguateFrom: {}
  },
  examples: []
});
