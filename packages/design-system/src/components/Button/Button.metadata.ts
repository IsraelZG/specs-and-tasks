import { defineMetadata } from "../../metadata/schema.ts";

export const ButtonMetadata = defineMetadata({
  component: {
    name: 'Button',
    category: 'atom',
    description: 'Triggers an action when activated. Pill-shaped by default to match the system aesthetic.',
    type: 'interactive',
    path: 'src/components/Button/Button.tsx',
    lastUpdated: '2026-05-17T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'primary-call-to-action',
      'form-submission',
      'destructive-action',
      'modal-confirmation',
      'toolbar-action',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'primary-cta',
        description: 'The single main action of a page or section.',
        composition: `<Button variant="primary">Get started</Button>`,
      },
      {
        name: 'primary-with-secondary',
        description: 'Primary action paired with a less-emphasized alternative.',
        composition: `<>
  <Button variant="primary">Save changes</Button>
  <Button variant="secondary">Cancel</Button>
</>`,
      },
      {
        name: 'button-with-leading-icon',
        description: 'Icon reinforces the action verbally communicated by the label.',
        composition: `<Button variant="primary">
  <Icon name="plus" size="sm" />
  New project
</Button>`,
      },
      {
        name: 'destructive-confirmation',
        description: 'Destructive actions use danger variant + explicit verb.',
        composition: `<Button variant="danger">Delete account</Button>`,
      },
      {
        name: 'loading-state',
        description: 'Async action — disable the button and show progress.',
        composition: `<Button variant="primary" loading>Submitting</Button>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Two or more primary buttons in the same section.',
        reason: 'Primary signals "the one action". Multiples destroy hierarchy and force the user to choose.',
        alternative: 'One primary; secondary or ghost for everything else.',
      },
      {
        scenario: 'Using Button to navigate to another page or route.',
        reason: 'Buttons announce actions. Navigation must be a link for accessibility (right-click, open in new tab, focus order, screen readers).',
        alternative: 'Use the Link component with the same visual styling if needed.',
      },
      {
        scenario: 'Icon-only Button without an aria-label.',
        reason: 'Screen readers announce nothing. The button is invisible to assistive tech.',
        alternative: 'Pass aria-label="Close" (or equivalent) as a prop.',
      },
      {
        scenario: 'Long labels like "Click here to learn more about our product".',
        reason: 'Buttons are scannable. Long labels read as body copy and bury the action.',
        alternative: 'Two or three words max, verb-led: "Learn more", "Get started".',
      },
      {
        scenario: 'Danger variant used for non-destructive emphasis (e.g. a red "Buy now").',
        reason: 'Users have learned red = destructive. Misuse trains them to ignore real danger states.',
        alternative: 'Use primary; reach for accent or intent.warning if you need attention without destruction.',
      },
      {
        scenario: 'Nesting a Button inside another Button.',
        reason: 'Invalid HTML, breaks event handling, and ambiguous focus order.',
        alternative: 'Split the surface or use IconButton siblings inside a container.',
      },
    ],
  },

  variants: {
    variant: {
      options: ['primary', 'secondary', 'ghost', 'danger'],
      default: 'primary',
      purpose: {
        primary: 'The single most important action of the section. Maximum visual weight.',
        secondary: 'Alternative or cancel actions. Outlined, lower weight than primary.',
        ghost: 'Tertiary or repeated actions. No background, minimal weight. Common in toolbars and inline contexts.',
        danger: 'Destructive actions: delete, remove, archive, leave. Reserved for irreversible or harmful outcomes.',
      },
    },
    size: {
      options: ['sm', 'md', 'lg'],
      default: 'md',
      purpose: {
        sm: 'Dense surfaces: toolbars, table rows, popovers, inline editors.',
        md: 'Default for most product UI: forms, modals, page-level actions.',
        lg: 'Marketing or onboarding moments where the CTA needs presence.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Button label. Strings preferred; may include a single leading or trailing Icon.',
        acceptedComponents: ['Icon'],
        forbiddenComponents: ['Button', 'Link', 'Input'],
        required: true,
      },
    ],
    commonSiblings: ['Button', 'Link', 'IconButton'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'Link'],
  },

  behavior: {
    states: [
      { name: 'default',  visual: 'Base color, full opacity, cursor pointer on hover-capable devices.' },
      { name: 'hover',    visual: 'Fill darkens one step (uses bgHover token).', semantic: 'Cursor: pointer.' },
      { name: 'pressed',  visual: 'Slight scale-down (0.98), instant easing.' },
      { name: 'focus',    visual: '2px focus ring offset by 2px, using focusRing tokens.', semantic: 'Keyboard-visible only (:focus-visible).' },
      { name: 'disabled', visual: '50% opacity, no hover transition.', semantic: 'aria-disabled="true", pointer-events: none, removed from tab order.' },
      { name: 'loading',  visual: 'Spinner replaces leading icon; label remains.', semantic: 'aria-busy="true", clicks ignored.' },
    ],
    interactions: [
      'Click or Tap activates onClick.',
      'Enter and Space activate when focused.',
      'Tab moves focus in/out following DOM order.',
    ],
    responsive: 'Width is content-based by default. Pass `fullWidth` to fill its container — common in mobile bottom-sheets and narrow forms.',
    motion: 'Hover and color transitions use motion.preset.hover (150ms smooth). Press uses motion.preset.press (50ms accelerate).',
  },

  props: {
    children:    { type: 'ReactNode',                                  required: true,  description: 'Button label content.', acceptsNode: true },
    variant:     { type: `'primary' | 'secondary' | 'ghost' | 'danger'`, default: `'primary'`, required: false, description: 'Visual emphasis level.' },
    size:        { type: `'sm' | 'md' | 'lg'`,                          default: `'md'`,      required: false, description: 'Control height and padding.' },
    fullWidth:   { type: 'boolean',                                     default: 'false',      required: false, description: 'Stretch to fill the parent container.' },
    loading:     { type: 'boolean',                                     default: 'false',      required: false, description: 'Show spinner and block interaction.' },
    disabled:    { type: 'boolean',                                     default: 'false',      required: false, description: 'Block interaction without spinner.' },
    onClick:     { type: '(e: MouseEvent) => void',                     required: false,                       description: 'Activation handler.' },
    type:        { type: `'button' | 'submit' | 'reset'`,                default: `'button'`,  required: false, description: 'HTML button type. Use "submit" inside a form.' },
    'aria-label':{ type: 'string',                                       required: false,                       description: 'Required when children is icon-only.' },
  },

  tokens: {
    semantic: [
      'component.button.radius',
      'component.button.fontWeight',
      'component.button.height.{sm,md,lg}',
      'component.button.paddingX.{sm,md,lg}',
      'component.button.gap',
      'component.button.primary.{bg,bgHover,text}',
      'component.button.secondary.{bg,bgHover,text,border}',
      'component.button.ghost.{bg,bgHover,text}',
      'component.button.danger.{bg,bgHover,text}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (native <button>)',
    keyboardSupport: 'Enter and Space activate. Tab moves focus.',
    screenReader: 'Announces as "button" + label text. With loading=true, announces "busy".',
    wcag: 'AA',
    notes: [
      'Always provide a text label. Icon-only buttons MUST set aria-label.',
      'Contrast on primary/danger meets 4.5:1 against onFill across both themes.',
      'Focus ring meets 3:1 against adjacent surfaces.',
      'Disabled buttons should not be the only way to communicate "not allowed" — also explain why nearby.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['button', 'cta', 'submit', 'action', 'click', 'tap', 'press', 'confirm', 'cancel', 'save', 'delete'],

    selectionCriteria: {
      'Is this a navigation to another page or route?':
        'NO — use Link, not Button. Even if it looks the same visually.',
      'Is there already a primary button in this section?':
        'YES — make this one secondary or ghost. There is only ever one primary per section.',
      'Will the action delete data, archive, or otherwise be hard to undo?':
        'Use variant="danger" and a verb that describes the consequence ("Delete", "Remove").',
      'Is this a side action like Cancel, Close, Back?':
        'Use variant="secondary".',
      'Is this in a dense surface (toolbar, table row, popover)?':
        'Use size="sm" and consider variant="ghost".',
      'Is the label icon-only?':
        'Set aria-label. Better still: use IconButton if available.',
      'Is the action async and could take more than ~300ms?':
        'Wire `loading` to the request state so the user gets feedback.',
    },

    disambiguateFrom: {
      Link: 'Use Link for navigation (changes the URL or route). Use Button for actions (mutates state, opens a modal, fires a request).',
      IconButton: 'Use IconButton when there is no text label — it bakes in the aria-label requirement and a square hit-target.',
      MenuItem: 'Use MenuItem inside Menu/Popover lists. Button is for standalone actions.',
      Tab: 'Use Tab when the choice switches the panel below. Button does not maintain a selected state.',
    },
  },

  examples: [
    {
      name: 'form-submit',
      description: 'Primary action in a form with async submit.',
      code: `<form onSubmit={handleSave}>
  {/* fields */}
  <Button type="submit" variant="primary" loading={isSaving}>
    Save changes
  </Button>
  <Button type="button" variant="secondary" onClick={onCancel}>
    Cancel
  </Button>
</form>`,
    },
    {
      name: 'destructive-with-confirmation',
      description: 'Danger button inside a confirmation modal.',
      code: `<Modal>
  <h2>Delete this project?</h2>
  <p>This cannot be undone.</p>
  <Button variant="danger" onClick={confirmDelete}>Delete project</Button>
  <Button variant="ghost"  onClick={dismiss}>Keep it</Button>
</Modal>`,
    },
    {
      name: 'toolbar-action',
      description: 'Dense surface, ghost size sm with leading icon.',
      code: `<Toolbar>
  <Button variant="ghost" size="sm">
    <Icon name="filter" size="sm" /> Filter
  </Button>
  <Button variant="ghost" size="sm">
    <Icon name="download" size="sm" /> Export
  </Button>
</Toolbar>`,
    },
  ],
});
