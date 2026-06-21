import { defineMetadata } from '../../metadata/schema.ts';

export const CheckboxMetadata = defineMetadata({
  component: {
    name: 'Checkbox',
    category: 'atom',
    description: 'Binary input control. Lets users select zero, one, or many items from a set. Supports an indeterminate state for partial selection.',
    type: 'input',
    path: 'src/components/Checkbox/Checkbox.tsx',
    lastUpdated: '2026-05-18T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'multi-select-form',
      'settings-toggle',
      'table-row-selection',
      'select-all',
      'terms-acceptance',
    ],
    requiredProps: [],

    commonPatterns: [
      {
        name: 'labelled-option',
        description: 'Standard labelled checkbox for a form option.',
        composition: `<Checkbox checked={enabled} onChange={setEnabled}>Enable notifications</Checkbox>`,
      },
      {
        name: 'select-all',
        description: 'Indeterminate state when some (not all) items are selected.',
        composition: `<Checkbox
  checked={allSelected}
  indeterminate={someSelected && !allSelected}
  onChange={toggleAll}
>
  Select all
</Checkbox>`,
      },
      {
        name: 'table-row',
        description: 'Compact checkbox in a table row selection column.',
        composition: `<Checkbox
  size="sm"
  checked={row.selected}
  onChange={(checked) => toggleRow(row.id, checked)}
  aria-label={\`Select \${row.name}\`}
/>`,
      },
      {
        name: 'terms-acceptance',
        description: 'Required checkbox before form submission.',
        composition: `<Checkbox required checked={accepted} onChange={setAccepted}>
  I agree to the <a href="/terms">Terms of Service</a>
</Checkbox>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using Checkbox for a mutually exclusive choice (only one can be selected).',
        reason: 'Checkboxes signal "select any number". Mutually exclusive options require a different semantic.',
        alternative: 'Use a radio button group or a Select component for single-choice scenarios.',
      },
      {
        scenario: 'Using Checkbox as a yes/no toggle that takes immediate effect (like enabling a feature).',
        reason: 'Immediate-effect toggles without a submit step confuse users because checkboxes conventionally require a save action.',
        alternative: 'Use a Switch component for instant-toggle settings.',
      },
      {
        scenario: 'Hiding the label and relying only on position to convey meaning.',
        reason: 'Screen readers need a text label. An unlabelled checkbox is announced as "checkbox, checked" with no context.',
        alternative: 'Either pass a visible label as children, or pass aria-label="Descriptive label" for icon-only use.',
      },
      {
        scenario: 'Disabling a Checkbox without explanation.',
        reason: 'Users see a grayed-out control with no indication of why or when it will become available.',
        alternative: 'Provide adjacent explanatory text or a Tooltip explaining the condition.',
      },
      {
        scenario: 'Using Checkbox to replace a Button for triggering an action.',
        reason: 'Checkbox state implies a condition, not an action. Using it to trigger side effects breaks the mental model.',
        alternative: 'Use a Button for actions. Checkbox is for selecting options, not triggering operations.',
      },
    ],
  },

  variants: {
    size: {
      options: ['sm', 'md'],
      default: 'md',
      purpose: {
        sm: 'Dense surfaces: table rows, compact lists, tight settings panels. Touch-primary surfaces should stay at md.',
        md: 'Default for all form contexts. Meets 44px touch-target guidelines on mobile.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Label text or rich content rendered beside the checkbox control.',
        acceptedComponents: ['Link'],
        forbiddenComponents: ['Button', 'Input', 'Checkbox'],
        required: false,
      },
    ],
    commonSiblings: ['Button', 'Input'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'Input'],
  },

  behavior: {
    states: [
      { name: 'unchecked',      visual: 'Empty box with border.' },
      { name: 'checked',        visual: 'Filled background with checkmark icon.',                        semantic: 'aria-checked="true".' },
      { name: 'indeterminate',  visual: 'Filled background with dash icon instead of checkmark.',       semantic: 'aria-checked="mixed".' },
      { name: 'hover',          visual: 'Border strengthens one step.' },
      { name: 'focus',          visual: '2px focus ring offset by 2px.',                                semantic: 'Keyboard-visible only (:focus-visible).' },
      { name: 'disabled',       visual: '50% opacity, no hover transition.',                            semantic: 'aria-disabled="true", removed from tab order.' },
    ],
    interactions: [
      'Click or Tap toggles checked state.',
      'Space activates when focused.',
      'Tab moves focus in/out following DOM order.',
    ],
    responsive: 'Fixed size by the size prop. Label wraps naturally if long.',
    motion: 'Checkmark/dash fades in over 100ms on check.',
  },

  props: {
    checked:       { type: 'boolean',              required: false, description: 'Controlled checked state.' },
    defaultChecked:{ type: 'boolean',              default: 'false', required: false, description: 'Uncontrolled initial state.' },
    indeterminate: { type: 'boolean',              default: 'false', required: false, description: 'Renders a dash — use for "select all" when some items are selected.' },
    disabled:      { type: 'boolean',              default: 'false', required: false, description: 'Prevents interaction.' },
    required:      { type: 'boolean',              default: 'false', required: false, description: 'Marks the input as required for form validation.' },
    size:          { type: `'sm' | 'md'`,          default: `'md'`, required: false, description: 'Visual size.' },
    onChange:      { type: '(checked: boolean) => void', required: false, description: 'Called with the new boolean state on each change.' },
    children:      { type: 'ReactNode',            required: false, description: 'Label content rendered beside the control.', acceptsNode: true },
    'aria-label':  { type: 'string',               required: false, description: 'Required when children is absent (e.g. table row selection).' },
  },

  tokens: {
    semantic: [
      'component.checkbox.{radius,size,bgChecked,iconChecked,border}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (native <input type="checkbox">)',
    keyboardSupport: 'Space toggles checked state. Tab moves focus.',
    screenReader: 'Announces as "checkbox" + label text + state (checked/unchecked/mixed). Indeterminate is announced as "mixed".',
    wcag: 'AA',
    notes: [
      'Always provide a visible label via children OR aria-label for icon-only contexts.',
      'Indeterminate state must be set via the indeterminate prop (not just the CSS) for screen readers.',
      'Disabled checkboxes are removed from tab order — ensure surrounding text explains why.',
      'Touch target at size="md" is 44px minimum.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['checkbox', 'check', 'select', 'multi-select', 'tick', 'boolean', 'toggle', 'option'],

    selectionCriteria: {
      'Is only one option selectable at a time?':
        'NO — use radio buttons or Select. Checkbox implies multi-select.',
      'Does the toggle take immediate effect without a Save button?':
        'NO — use Switch. Checkbox requires a form submit or explicit save step.',
      'Are there no visible children (label is conveyed by position only)?':
        'Pass aria-label="Descriptive text" to avoid an inaccessible checkbox.',
      'Is this a "select all" that reflects partial selection?':
        'Set indeterminate=true when some but not all items are checked.',
      'Is this inside a dense table or list?':
        'Use size="sm". Keep size="md" on touch-primary surfaces.',
    },

    disambiguateFrom: {
      Button:  'Button triggers an action. Checkbox represents a selected state.',
      Input:   'Input collects free-text data. Checkbox is a boolean selection.',
      NavItem: 'NavItem navigates between pages. Checkbox selects options in a form.',
    },
  },

  examples: [
    {
      name: 'multi-select-filter',
      description: 'List of filterable categories with checkboxes.',
      code: `const categories = ['Design', 'Engineering', 'Marketing'];
const [selected, setSelected] = React.useState<string[]>([]);

return categories.map((cat) => (
  <Checkbox
    key={cat}
    checked={selected.includes(cat)}
    onChange={(checked) =>
      setSelected(checked ? [...selected, cat] : selected.filter((c) => c !== cat))
    }
  >
    {cat}
  </Checkbox>
));`,
    },
    {
      name: 'select-all-with-indeterminate',
      description: '"Select all" checkbox that reflects partial selection.',
      code: `const allChecked = rows.every((r) => r.selected);
const someChecked = rows.some((r) => r.selected);

<Checkbox
  checked={allChecked}
  indeterminate={someChecked && !allChecked}
  onChange={(checked) => setRows(rows.map((r) => ({ ...r, selected: checked })))}
>
  Select all ({rows.filter((r) => r.selected).length} of {rows.length})
</Checkbox>`,
    },
  ],
});
