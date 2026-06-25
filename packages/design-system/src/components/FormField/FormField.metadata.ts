import { defineMetadata } from '../../metadata/schema.ts';

export const FormFieldMetadata = defineMetadata({
  component: {
    name: 'FormField',
    category: 'molecule',
    description: 'Composes a label, an input control, and optional helper/error text into a single accessible form field unit.',
    type: 'input',
    path: 'src/components/FormField/FormField.tsx',
    lastUpdated: '2026-05-19T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'labeled-text-input',
      'labeled-checkbox',
      'form-field-with-validation',
      'accessible-form-row',
      'settings-form-field',
    ],
    requiredProps: ['label', 'children'],
    commonPatterns: [
      {
        name: 'text-input-with-error',
        description: 'Use when the user can make a validation error on a text field.',
        composition: `<FormField label="Email" htmlFor="email" errorText="Invalid email address"><Input id="email" invalid value={email} onChange={setEmail} /></FormField>`,
      },
      {
        name: 'checkbox-with-help',
        description: 'Use when a checkbox needs a label and a supplementary hint.',
        composition: `<FormField label="Marketing emails" helpText="You can unsubscribe at any time."><Checkbox checked={checked} onChange={setChecked} /></FormField>`,
      },
    ],
    antiPatterns: [
      {
        scenario: 'Using FormField without passing htmlFor and id on the inner Input.',
        reason: 'The label is not programmatically associated with the input, breaking accessibility.',
        alternative: 'Always pass htmlFor to FormField and the matching id to the inner Input.',
      },
      {
        scenario: 'Nesting FormField inside FormField.',
        reason: 'Creates duplicate label hierarchies and ambiguous field ownership.',
        alternative: 'Use one FormField per input control.',
      },
      {
        scenario: 'Setting errorText and relying on FormField to pass invalid to Input.',
        reason: 'FormField does not automatically forward invalid — the consumer must do it.',
        alternative: 'Derive invalid from whether errorText is truthy and pass it to Input directly.',
      },
      {
        scenario: 'Using FormField as a layout wrapper for non-form content.',
        reason: 'FormField is specifically for label+input+feedback patterns, not general vertical stacking.',
        alternative: 'Use a plain flex-col div for generic vertical layouts.',
      },
    ],
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'The input control — must be an Input or Checkbox.',
        acceptedComponents: ['Input', 'Checkbox'],
        forbiddenComponents: ['FormField', 'Button', 'Card', 'Modal'],
        required: true,
      },
    ],
    commonSiblings: ['FormField', 'Button'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'NavItem', 'Badge'],
  },

  behavior: {
    states: [
      { name: 'default', visual: 'Label above the child input, optional muted helper text below.' },
      { name: 'error', visual: 'Error text replaces helper text in danger color. Consumer passes invalid to Input.', semantic: 'Error text is visible; consumer must also pass invalid={true} to the inner Input for border color.' },
    ],
    interactions: [],
    responsive: 'No responsive changes. Fills the width of its container.',
    motion: 'None.',
  },

  props: {
    label: { type: 'string', required: true, description: 'Visible label text displayed above the input.' },
    htmlFor: { type: 'string', required: false, description: 'id of the inner input element. Required for accessibility.' },
    helpText: { type: 'string', required: false, description: 'Supplementary hint shown below the input. Hidden when errorText is present.' },
    errorText: { type: 'string', required: false, description: 'Validation error message shown in danger color. Replaces helpText.' },
    children: { type: 'ReactNode', required: true, description: 'The input control (Input or Checkbox).', acceptsNode: true },
    className: { type: 'string', required: false, description: 'Additional classes merged onto the root div.' },
  },

  tokens: {
    semantic: [
      'component.input.height.{sm,md,lg}',
      'component.input.paddingX',
      'component.input.border',
      'component.input.borderFocus',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'implicit (div)',
    keyboardSupport: 'Focus is managed by the child input. Tab navigates to the inner Input or Checkbox.',
    screenReader: 'The <label htmlFor> associates the label text with the inner input. Error text is adjacent plain text — consumers should also set aria-describedby on the input pointing to the error paragraph if needed.',
    wcag: 'AA',
    notes: [
      'Always pass htmlFor to FormField and the matching id to the inner Input for accessible label association.',
      'When errorText is set, also pass invalid={true} to the inner Input so border color signals the error state visually.',
    ],
  },

  aiHints: {
    priority: 'high',
    keywords: ['form field', 'label', 'input with label', 'field with error', 'form row', 'text field label', 'labeled checkbox'],
    selectionCriteria: {
      'Does the input need a visible label?': 'Yes — use FormField. Never use placeholder as a substitute for label.',
      'Does the field show validation errors?': 'Yes — pass errorText and also invalid={true} to the inner Input.',
      'Is this a checkbox that needs contextual help text?': 'Yes — FormField with helpText is the right pattern.',
      'Is this a standalone Input without any label?': 'No — that pattern violates accessibility. Use FormField.',
    },
    disambiguateFrom: {
      Input: 'Input is the raw text control. FormField wraps it with a label and feedback text.',
      Checkbox: 'Checkbox is the raw boolean control. FormField wraps it with a label and help text.',
    },
  },

  examples: [
    {
      name: 'email-field-with-validation',
      description: 'Email input with label, error state, and accessible association.',
      code: `
<FormField label="Email address" htmlFor="email" errorText={errors.email}>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={e => setEmail(e.target.value)}
    invalid={!!errors.email}
    placeholder="you@company.com"
  />
</FormField>`,
    },
    {
      name: 'checkbox-with-help',
      description: 'Checkbox with descriptive help text below.',
      code: `
<FormField label="Newsletter" helpText="Sent once a week, no spam.">
  <Checkbox checked={subscribed} onChange={setSubscribed} />
</FormField>`,
    },
  ],
});
