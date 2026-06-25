import { defineMetadata } from '../../metadata/schema.ts';

export const ToggleMetadata = defineMetadata({
  component: {
    name: 'Toggle',
    category: 'atom',
    description: 'A two-state button that can be pressed or active, and unpressed or inactive.',
    type: 'input',
    path: 'src/components/Toggle/Toggle.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'toolbar-buttons',
      'binary-mode-switches',
      'rich-text-formatting-controls',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'standard-toggle',
        description: 'A simple formatting button toggle (like bold text).',
        composition: `<Toggle aria-label="Toggle bold">
  <BoldIcon className="h-4 w-4" />
</Toggle>`,
      },
      {
        name: 'outline-toggle',
        description: 'Toggle with a visible border outline variant.',
        composition: `<Toggle variant="outline" aria-label="Toggle italic">
  <ItalicIcon className="h-4 w-4" />
</Toggle>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using Toggle for a simple button link or form submission.',
        reason: 'Toggles maintain an active on/off state. Standard buttons perform a one-time click trigger.',
        alternative: 'Use Button component instead.',
      },
      {
        scenario: 'Omitting aria-label or accessible text inside an icon-only Toggle.',
        reason: 'Screen readers cannot determine what the button controls if there is only a graphic icon and no label.',
        alternative: 'Always provide an aria-label attribute (e.g. aria-label="Toggle italic").',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'default', visual: 'Transparent background, standard text/icon color.' },
      { name: 'hover', visual: 'Subdued background highlight (hover:bg-var(--ds-theme-surface-subdued)).' },
      { name: 'pressed', visual: 'Subdued highlight (data-[state=on]:bg-var(--ds-theme-border-subtle)) indicating selection.' },
      { name: 'focus', visual: 'Standard primary focus ring around the button.' },
      { name: 'disabled', visual: '50% opacity, unclickable, pointer-events-none.' }
    ],
    interactions: [
      'Clicking or pressing Enter/Space toggles between pressed (active) and unpressed (inactive) states.'
    ],
    responsive: 'Adjustable size properties (sm, md, lg).'
  },
  props: {
    pressed: { type: 'boolean', required: false, description: 'Controlled pressed state.' },
    defaultPressed: { type: 'boolean', required: false, description: 'Initial pressed state.' },
    onPressedChange: { type: '(pressed: boolean) => void', required: false, description: 'Callback fired when pressed state toggles.' },
    variant: { type: '"default" | "outline"', default: '"default"', required: false, description: 'Visual style variants.' },
    size: { type: '"sm" | "md" | "lg"', default: '"md"', required: false, description: 'Button sizing variants.' },
    disabled: { type: 'boolean', default: 'false', required: false, description: 'Disables interaction.' }
  },
  tokens: {
    semantic: [
      'theme.surface.subdued',
      'theme.border.subtle',
      'theme.border.default',
      'theme.content.default',
      'component.button.radius'
    ]
  },
  accessibility: {
    role: 'button',
    keyboardSupport: 'Tab focuses. Enter or Space toggles pressed state.',
    screenReader: 'Announces toggle button and its pressed state status (via aria-pressed).',
    wcag: 'AAA',
    notes: [
      'Built using Radix Toggle primitive which coordinates the proper aria-pressed states.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['toggle', 'press-button', 'bold', 'italic', 'format', 'active'],
    selectionCriteria: {
      'Do you need a standalone button that remains selected/highlighted when clicked?': 'Yes, use Toggle.'
    },
    disambiguateFrom: {
      Button: 'Button triggers a direct action. Toggle controls a binary state that stays active.',
      Switch: 'Switch is for settings/options that change immediately. Toggle is typically for formatting or presentation options (e.g. toolbars).'
    }
  },
  examples: [
    {
      name: 'italic-toggle-usage',
      description: 'Standard Toggle usage in toolbars.',
      code: `const [isItalic, setIsItalic] = useState(false);
return (
  <Toggle pressed={isItalic} onPressedChange={setIsItalic} aria-label="Toggle italic text">
    <span className="italic font-serif text-base">I</span>
  </Toggle>
)`
    }
  ]
});
