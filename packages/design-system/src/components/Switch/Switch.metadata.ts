import { defineMetadata } from '../../metadata/schema.ts';

export const SwitchMetadata = defineMetadata({
  component: {
    name: 'Switch',
    category: 'atom',
    description: 'Toggle switch control allowing user to toggle between checked and unchecked states.',
    type: 'input',
    path: 'src/components/Switch/Switch.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'settings-toggles',
      'feature-switches',
      'simple-boolean-inputs',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-switch',
        description: 'Standard settings option toggle with a Label.',
        composition: `<div className="flex items-center gap-3">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`,
      },
      {
        name: 'disabled-switch',
        description: 'Toggle switch in disabled state.',
        composition: `<Switch disabled checked />`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Switch when a Checkbox would be more appropriate (e.g. multiple items in a list to select).',
        reason: 'Switches represent immediate actions or preference toggles (like switching a state). Checkboxes are better for selection actions where a save/submit action is required.',
        alternative: 'Use Checkbox for item selection or multi-option checkboxes.',
      },
      {
        scenario: 'Omitting a text label descriptor.',
        reason: 'Screen readers need a text description to announce what the toggle does.',
        alternative: 'Always associate the Switch with a Label component via id and htmlFor, or add an aria-label.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Track bg var(--ds-component-switch-track-bg-off) with 2px thumb offset.' },
      { name: 'checked', visual: 'Track bg var(--ds-component-switch-track-bg-on) with 22px thumb offset.' },
      { name: 'focus', visual: 'Outer outline focus ring using universal focusRing tokens.' },
      { name: 'disabled', visual: '50% opacity, pointer-events-none, cursor-not-allowed.' }
    ],
    interactions: [
      'Clicking or tapping toggles checked state.',
      'Space or Enter key toggles checked state when focused.'
    ],
    responsive: 'Fixed size (44x24px).'
  },
  props: {
    checked: { type: 'boolean', required: false, description: 'Programmatic checked state control.' },
    defaultChecked: { type: 'boolean', required: false, description: 'Initial default checked state.' },
    onCheckedChange: { type: '(checked: boolean) => void', required: false, description: 'Callback triggered on toggled state changes.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables editing and toggling.' }
  },
  tokens: {
    semantic: [
      'component.switch.track.width',
      'component.switch.track.height',
      'component.switch.track.radius',
      'component.switch.track.bgOff',
      'component.switch.track.bgOn',
      'component.switch.thumb.size',
      'component.switch.thumb.bg',
      'component.switch.thumb.shadow'
    ]
  },
  accessibility: {
    role: 'switch',
    keyboardSupport: 'Tab focuses. Space/Enter toggles.',
    screenReader: 'Announces switch with labels, checked/unchecked state and disabled state.',
    wcag: 'AAA',
    notes: [
      'Built on Radix Switch primitive which fully manages ARIA attributes (aria-checked, aria-required) and focus routing.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['switch', 'toggle', 'checkbox', 'boolean', 'option', 'setting'],
    selectionCriteria: {
      'Do you need to toggle a single binary setting on-the-fly?': 'Yes, use Switch.'
    },
    disambiguateFrom: {
      Checkbox: 'Checkbox is for selecting items in a list or forms with a submit button. Switch is for settings that take effect immediately.'
    }
  },
  examples: [
    {
      name: 'labelled-switch',
      description: 'Switch with custom label layout.',
      code: `<div className="flex items-center space-x-3">
  <Switch id="dark-mode" />
  <Label htmlFor="dark-mode">Enable Dark Mode</Label>
</div>`
    }
  ]
});
