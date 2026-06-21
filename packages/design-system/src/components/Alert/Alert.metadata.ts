import { defineMetadata } from '../../metadata/schema.ts';

export const AlertMetadata = defineMetadata({
  component: {
    name: 'Alert',
    category: 'molecule',
    description: 'Inline persistent status message. Renders in document flow, does not dismiss automatically.',
    type: 'feedback',
    path: 'src/components/Alert/Alert.tsx',
    lastUpdated: '2026-05-18T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'form-level-error',
      'page-level-warning',
      'success-confirmation-inline',
      'permission-notice',
      'quota-warning',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'form-error',
        description: 'Surface a form-level error that is not tied to a single field.',
        composition: `<Alert intent="danger">Could not save — please fix the errors above.</Alert>`,
      },
      {
        name: 'page-warning',
        description: 'Persistent warning at the top of a settings page.',
        composition: `<Alert intent="warning" title="Your trial ends in 3 days">
  Upgrade to keep access to all features.
</Alert>`,
      },
      {
        name: 'success-notice',
        description: 'Inline success state after a background operation.',
        composition: `<Alert intent="success" dismissible onDismiss={clear}>
  Changes saved successfully.
</Alert>`,
      },
      {
        name: 'info-notice',
        description: 'Contextual guidance or limitation notice.',
        composition: `<Alert intent="info">
  This setting applies to all team members.
</Alert>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using Alert for a message that should disappear automatically after a few seconds.',
        reason: 'Alert is inline and persistent. Auto-dismissing inline content is disorienting because the layout shifts.',
        alternative: 'Use Toast for auto-dismissing notifications.',
      },
      {
        scenario: 'Using Alert for a message that requires immediate user action to continue.',
        reason: 'Alert does not block the page. Users can scroll past it and miss it entirely.',
        alternative: 'Use Modal with role="alertdialog" for blocking decisions.',
      },
      {
        scenario: 'Using intent="danger" Alert for a non-error informational message.',
        reason: 'Red signals failure. Using it for neutral info trains users to ignore real errors.',
        alternative: 'Use intent="info" for informational notices and intent="warning" for caution states.',
      },
      {
        scenario: 'Placing an Alert inside a Card without relating it to the Card\'s content.',
        reason: 'Detached feedback is ambiguous — users won\'t know which content the Alert references.',
        alternative: 'Place the Alert immediately above or below the element it describes, or use a field-level error via FormField.',
      },
      {
        scenario: 'Stacking multiple Alerts of the same intent on the same page.',
        reason: 'Multiple warnings or errors overwhelm and create visual noise without guiding the user.',
        alternative: 'Consolidate related issues into one Alert with a list of items, or use separate sections.',
      },
    ],
  },

  variants: {
    intent: {
      options: ['info', 'success', 'warning', 'danger'],
      default: 'info',
      purpose: {
        info:    'Neutral informational notices: tips, limitations, guidance. Default for contextual messages.',
        success: 'Inline confirmation of a completed action. Pair with dismissible=true since the user has already acted.',
        warning: 'Caution about a condition that exists now: expiring trial, quota usage, degraded mode.',
        danger:  'Inline error state — form submission failed, permission denied, destructive action result.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Alert message. Can be a string or structured content (paragraph, list, link).',
        acceptedComponents: ['Button', 'Link'],
        forbiddenComponents: ['Modal', 'Card', 'Input'],
        required: true,
      },
    ],
    commonSiblings: ['Input', 'Button', 'Card'],
    parentConstraints: [],
    forbiddenParents: ['Button', 'Modal'],
  },

  behavior: {
    states: [
      { name: 'default',   visual: 'Intent-tinted background, left accent border, intent icon, message text.' },
      { name: 'dismissed', visual: 'Fades out and collapses (height → 0) over 200ms when onDismiss fires.', semantic: 'Removed from the accessibility tree.' },
    ],
    interactions: [
      'Close button (when dismissible=true) calls onDismiss.',
      'No keyboard shortcut to dismiss — it is inline content, not a transient overlay.',
    ],
    responsive: 'Full width of its container by default.',
    motion: 'Dismiss: height collapse + opacity fade over 200ms.',
  },

  props: {
    children:   { type: 'ReactNode', required: true,  description: 'Alert message content.', acceptsNode: true },
    intent:     { type: `'info' | 'success' | 'warning' | 'danger'`, default: `'info'`, required: false, description: 'Visual and semantic accent.' },
    title:      { type: 'string',    required: false, description: 'Optional bold heading above the message body.' },
    dismissible:{ type: 'boolean',   default: 'false', required: false, description: 'Show a close button. Wire to onDismiss to control visibility.' },
    onDismiss:  { type: '() => void', required: false, description: 'Called when the close button is clicked.' },
  },

  tokens: {
    semantic: [
      'component.alert.{radius,paddingX,paddingY,gap,borderWidth}',
      'component.alert.info.{bg,text,border,icon}',
      'component.alert.success.{bg,text,border,icon}',
      'component.alert.warning.{bg,text,border,icon}',
      'component.alert.danger.{bg,text,border,icon}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'alert (intent=danger/warning); status (intent=info/success)',
    keyboardSupport: 'Close button (when present) is focusable via Tab and activated via Enter/Space.',
    screenReader: 'role="alert" (danger/warning) is announced immediately via assertive live region. role="status" (info/success) via polite. Intent icon has aria-hidden="true".',
    wcag: 'AA',
    notes: [
      'Never rely on color alone — every intent has a distinct icon AND a role.',
      'If the Alert appears dynamically, ensure it is in a live region or has role="alert"/"status".',
      'Dismiss button must have aria-label="Dismiss alert" or equivalent.',
    ],
  },

  aiHints: {
    priority: 'medium',
    keywords: ['alert', 'warning', 'error', 'notice', 'info', 'feedback', 'status', 'inline', 'message', 'notification'],

    selectionCriteria: {
      'Should the message disappear on its own after a few seconds?':
        'YES → use Toast. Alert is persistent and never auto-dismisses.',
      'Does the user need to act on this message to continue?':
        'YES → use Modal (alertdialog). Alert does not block the page.',
      'Is this tied to a specific form field?':
        'Use a field-level error (FormField error prop), not an Alert.',
      'Is this a system-level status the user should see on page load?':
        'YES — Alert is appropriate. Place it near the top of the relevant section.',
      'Is this acknowledging something the user just did?':
        'Use intent="success" with dismissible=true. Or use Toast if it should vanish automatically.',
    },

    disambiguateFrom: {
      Toast:  'Toast floats, is transient, and auto-dismisses. Alert is inline, persistent, and part of the document flow.',
      Modal:  'Modal blocks the full page and traps focus. Alert is an inline message users can scroll past.',
      Badge:  'Badge is a micro-label for status. Alert is a full message with context and optional actions.',
    },
  },

  examples: [
    {
      name: 'form-submission-error',
      description: 'Form-level error above the submit button.',
      code: `{submitError && (
  <Alert intent="danger" title="Submission failed">
    {submitError.message}
  </Alert>
)}`,
    },
    {
      name: 'trial-expiry-warning',
      description: 'Persistent warning at the top of a settings page.',
      code: `<Alert
  intent="warning"
  title="Trial ends in 3 days"
  dismissible
  onDismiss={() => setDismissed(true)}
>
  Upgrade your plan to keep full access after your trial ends.
  <Button variant="ghost" size="sm">View plans</Button>
</Alert>`,
    },
  ],
});
