import { defineMetadata } from "../../metadata/schema.ts";

export const InputMetadata = defineMetadata({
  component: {
    name: 'Input',
    category: 'atom',
    description: 'Single-line text input. The base primitive for typed user data in forms, search, and filters.',
    type: 'input',
    path: 'src/components/Input/Input.tsx',
    lastUpdated: '2026-05-17T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'form-field',
      'inline-search',
      'filter-field',
      'inline-edit',
      'auth-credentials',
    ],
    requiredProps: ['value', 'onChange'],

    commonPatterns: [
      {
        name: 'labelled-field',
        description: 'Standard form input with a visible label.',
        composition: `<FormField label="Email" htmlFor="email">
  <Input id="email" type="email" value={email} onChange={setEmail} />
</FormField>`,
      },
      {
        name: 'search-with-icon',
        description: 'Search bar with a leading icon and placeholder hint.',
        composition: `<Input
  type="search"
  placeholder="Search anything…"
  leadingIcon={<Icon name="search" />}
  value={q}
  onChange={setQ}
/>`,
      },
      {
        name: 'with-error',
        description: 'Validation failure surfaced inline.',
        composition: `<FormField label="Email" htmlFor="email" error="That email is already in use.">
  <Input id="email" type="email" value={email} onChange={setEmail} invalid />
</FormField>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using placeholder text as the only label.',
        reason: 'Placeholder disappears on focus, fails accessibility, and confuses users with cognitive or vision impairments.',
        alternative: 'Wrap the Input in FormField with an explicit `label` prop. Placeholder is for hints, not labels.',
      },
      {
        scenario: 'Using Input for multi-line text.',
        reason: 'Input is single-line and clips long content. Pasting paragraphs silently loses linebreaks.',
        alternative: 'Use Textarea.',
      },
      {
        scenario: 'Using Input where the user picks from a known set of options.',
        reason: 'Free-text input invites typos and inconsistent values.',
        alternative: 'Use Select for ≤ ~10 options, Combobox for searchable larger sets, RadioGroup for ≤ 5 mutually exclusive options.',
      },
      {
        scenario: 'type="text" for emails, phones, urls, or numbers.',
        reason: 'Wrong mobile keyboard, no native validation, and screen readers miss the semantic.',
        alternative: 'Use the right `type`: email, tel, url, number. Adds keyboard hints and validation for free.',
      },
      {
        scenario: 'Showing the error color before the user has typed anything.',
        reason: 'Pre-emptive errors feel hostile and train users to ignore validation.',
        alternative: 'Validate on blur (or on submit), then surface the error and pass `invalid` to the Input.',
      },
      {
        scenario: 'Disabling the input to mean "you cannot edit yet".',
        reason: 'Disabled controls have no focus, no tooltip, and no explanation. Users see a dead field.',
        alternative: 'Keep it enabled and use helper text, or replace with read-only display if truly final.',
      },
    ],
  },

  variants: {
    size: {
      options: ['sm', 'md', 'lg'],
      default: 'md',
      purpose: {
        sm: 'Dense surfaces: filter rows, popovers, table cells.',
        md: 'Default for product forms and modals.',
        lg: 'Onboarding, marketing, prominent search.',
      },
    },
  },

  composition: {
    slots: [
      { name: 'leadingIcon',  description: 'Icon shown before the text.',      acceptedComponents: ['Icon'],      required: false },
      { name: 'trailingIcon', description: 'Icon shown after the text (e.g. clear, reveal password).', acceptedComponents: ['Icon', 'IconButton'], required: false },
    ],
    commonSiblings: ['FormField', 'Label', 'HelpText', 'Button'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'Input'],
  },

  behavior: {
    states: [
      { name: 'default',  visual: 'Surface bg, 1px subtle border.' },
      { name: 'hover',    visual: 'Border strengthens to border-strong token.' },
      { name: 'focus',    visual: 'Border switches to focus color, shadow ring appears.', semantic: 'aria-describedby points at HelpText if present.' },
      { name: 'invalid',  visual: 'Border and ring switch to danger color.', semantic: 'aria-invalid="true", aria-describedby points at error text.' },
      { name: 'disabled', visual: 'bgSubdued, content.disabled text, no border emphasis.' },
      { name: 'readonly', visual: 'Same as default but no focus ring.', semantic: 'aria-readonly="true". Selectable but not editable.' },
    ],
    interactions: [
      'Type to edit value.',
      'Tab moves focus in/out.',
      'Native IME/autofill supported.',
    ],
    responsive: 'Fills its container by default. Pair with FormField for label positioning that adapts (stacked on mobile, inline on wide).',
    motion: 'Border-color transitions use motion.preset.hover. Focus ring fades in via the same easing.',
  },

  props: {
    value:        { type: 'string',                                   required: true,  description: 'Controlled value.' },
    onChange:     { type: '(value: string, e: ChangeEvent) => void',  required: true,  description: 'Called on every keystroke with the new value.' },
    type:         { type: `'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'`, default: `'text'`, required: false, description: 'HTML input type. Affects keyboard, validation, and screen-reader semantics.' },
    size:         { type: `'sm' | 'md' | 'lg'`,                       default: `'md'`,  required: false, description: 'Control height.' },
    placeholder:  { type: 'string',                                   required: false, description: 'Hint shown when empty. NEVER use as a label.' },
    leadingIcon:  { type: 'ReactNode',                                required: false, description: 'Icon rendered before the value.', acceptsNode: true },
    trailingIcon: { type: 'ReactNode',                                required: false, description: 'Icon or IconButton after the value.', acceptsNode: true },
    invalid:      { type: 'boolean',                                  default: 'false', required: false, description: 'Switch to error styling. Pair with aria-describedby on a nearby error message.' },
    disabled:     { type: 'boolean',                                  default: 'false', required: false, description: 'Block interaction.' },
    readOnly:     { type: 'boolean',                                  default: 'false', required: false, description: 'Selectable but not editable.' },
    autoComplete: { type: 'string',                                   required: false, description: 'Standard autocomplete token: "email", "current-password", etc.' },
    id:           { type: 'string',                                   required: false, description: 'Required when a separate <label> uses htmlFor.' },
  },

  tokens: {
    semantic: [
      'component.input.radius',
      'component.input.height.{sm,md,lg}',
      'component.input.paddingX',
      'component.input.{bg,bgDisabled,text,placeholder}',
      'component.input.{border,borderHover,borderFocus,borderError}',
      'component.input.shadowFocus',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (native <input>)',
    keyboardSupport: 'Full native text-input keys. Tab focus. Esc clears type="search" on supported browsers.',
    screenReader: 'Announces label (from associated <label> or aria-label) + type + value + invalid state.',
    wcag: 'AA',
    notes: [
      'Every Input must have an associated label via FormField, <label htmlFor>, or aria-label.',
      'When invalid, set aria-invalid="true" and aria-describedby pointing at the error text.',
      'For password fields, never disable paste — it breaks password managers.',
      'Touch targets meet 44×44 at size="md" or larger; size="sm" should not appear on touch-primary surfaces.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['input', 'field', 'text field', 'textbox', 'form', 'search', 'edit', 'type'],

    selectionCriteria: {
      'Will the user write more than one sentence here?':
        'Use Textarea, not Input.',
      'Is the user choosing from a fixed set of options?':
        'Use Select / RadioGroup / Combobox, not Input.',
      'Is this for an email / phone / url / number?':
        'Set the right `type` so mobile keyboards and validation work.',
      'Is this a search-as-you-type field?':
        'type="search", leadingIcon={<Icon name="search" />}, and debounce onChange.',
      'Where does the label go?':
        'Always wrap in FormField with `label`. Do not use placeholder as a label.',
      'How do I show validation errors?':
        'Set `invalid` on the Input and pass `error` to FormField — it wires aria-describedby for you.',
    },

    disambiguateFrom: {
      Textarea: 'Textarea is multi-line; Input is single-line. Long content silently truncates in Input.',
      Select:   'Select is for picking from a known list. Input is for free text.',
      Combobox: 'Combobox combines free text with suggestions. Use when both are valuable.',
      SearchBar:'SearchBar is a composed pattern (Input + leading icon + clear button + history). Reach for it when search is a primary action of the page.',
    },
  },

  examples: [
    {
      name: 'login-form',
      description: 'Email + password with autocomplete tokens set for password managers.',
      code: `<form onSubmit={handleLogin}>
  <FormField label="Email" htmlFor="email">
    <Input id="email" type="email" autoComplete="email" value={email} onChange={setEmail} />
  </FormField>
  <FormField label="Password" htmlFor="pw">
    <Input id="pw" type="password" autoComplete="current-password" value={pw} onChange={setPw} />
  </FormField>
  <Button type="submit" variant="primary">Sign in</Button>
</form>`,
    },
    {
      name: 'search-with-clear',
      description: 'Search with trailing clear button that appears once there is content.',
      code: `<Input
  type="search"
  placeholder="Search…"
  leadingIcon={<Icon name="search" />}
  trailingIcon={q && <IconButton aria-label="Clear" onClick={() => setQ('')}><Icon name="x" /></IconButton>}
  value={q}
  onChange={setQ}
/>`,
    },
  ],
});
