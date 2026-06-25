import { defineMetadata } from '../../metadata/schema.ts';

export const ToggleGroupMetadata = defineMetadata({
  component: {
    name: 'ToggleGroup',
    category: 'atom',
    description: 'A set of two-state buttons that can be toggled on or off, functioning as single-select (exclusive) or multi-select groups.',
    type: 'input',
    path: 'src/components/ToggleGroup/ToggleGroup.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'formatting-toolbars',
      'alignment-selectors',
      'multi-select-filter-pills',
    ],
    requiredProps: ['type'],
    commonPatterns: [
      {
        name: 'single-select-alignment',
        description: 'A single-select toggle group for paragraph alignment (left, center, right).',
        composition: `<ToggleGroup type="single" defaultValue="left">
  <ToggleGroupItem value="left" aria-label="Align left">Left</ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">Center</ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">Right</ToggleGroupItem>
</ToggleGroup>`,
      },
      {
        name: 'multi-select-formatting',
        description: 'A multi-select toggle group for font styling.',
        composition: `<ToggleGroup type="multiple">
  <ToggleGroupItem value="bold" aria-label="Toggle bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Toggle italic">Italic</ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Toggle underline">Underline</ToggleGroupItem>
</ToggleGroup>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using ToggleGroup as a navigation tabs bar where pages change completely.',
        reason: 'ToggleGroups manage state selections within a view. Changing routes/URLs is the concern of tab lists or navigation links.',
        alternative: 'Use NavItem or Tabs components instead.',
      },
      {
        scenario: 'Using a multi-select ToggleGroup where standard checkboxes are expected in forms.',
        reason: 'Users associate ToggleGroup buttons with immediate formatting toolbar options, not typical checklist inputs in standard forms.',
        alternative: 'Use Checkbox components for lists of checkboxes in form submittals.'
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Group of buttons with small gap layout. Inherits Toggle unchecked state visual.' },
      { name: 'active-item', visual: 'Highlight bg/border matching Toggle pressed state visual.' },
      { name: 'focus-item', visual: 'Standard primary focus ring outline.' },
      { name: 'disabled', visual: 'Opacity reduction, interaction disabled.' }
    ],
    interactions: [
      'Clicking or pressing Enter/Space toggles the active state of an item.',
      'For single-select: selecting one item deselects the others.',
      'For multi-select: items can be toggled independently.'
    ],
    responsive: 'Layout stacks horizontally by default.'
  },
  props: {
    type: { type: '"single" | "multiple"', required: true, description: 'Selection mode: single (mutually exclusive) or multiple (checkbox-like).' },
    value: { type: 'string | string[]', required: false, description: 'Controlled value(s).' },
    defaultValue: { type: 'string | string[]', required: false, description: 'Initial default value(s).' },
    onValueChange: { type: '(value: any) => void', required: false, description: 'Callback fired on selection changes.' },
    variant: { type: '"default" | "outline"', default: '"default"', required: false, description: 'Visual variant shared by child items.' },
    size: { type: '"sm" | "md" | "lg"', default: '"md"', required: false, description: 'Button sizing variant shared by child items.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables all group item interactions.' }
  },
  tokens: {
    semantic: [
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.content.default',
      'component.button.radius'
    ]
  },
  accessibility: {
    role: 'toolbar',
    keyboardSupport: 'Tab moves focus into/out of group. Arrow keys navigate between items inside group.',
    screenReader: 'Announces as toolbar, readouts items, states (aria-pressed), and selection changes.',
    wcag: 'AAA',
    notes: [
      'Built with Radix ToggleGroup primitive managing full ARIA and keyboard tab/arrow indexing.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['togglegroup', 'button-group', 'exclusive-group', 'multi-toggle', 'toolbar'],
    selectionCriteria: {
      'Do you need a set of related toolbar toggle options?': 'Yes, use ToggleGroup.'
    },
    disambiguateFrom: {
      RadioGroup: 'RadioGroup is used inside data forms. ToggleGroup is typically for layout/editor styling toolbars.',
      Toggle: 'Toggle is for a single standalone formatting control. ToggleGroup bundles related controls.'
    }
  },
  examples: [
    {
      name: 'toolbar-formatting',
      description: 'A text alignment toolbar selector.',
      code: `const [align, setAlign] = useState('left');
return (
  <ToggleGroup type="single" value={align} onValueChange={(val) => val && setAlign(val)}>
    <ToggleGroupItem value="left" aria-label="Align left">Left</ToggleGroupItem>
    <ToggleGroupItem value="center" aria-label="Align center">Center</ToggleGroupItem>
    <ToggleGroupItem value="right" aria-label="Align right">Right</ToggleGroupItem>
  </ToggleGroup>
)`
    }
  ]
});
