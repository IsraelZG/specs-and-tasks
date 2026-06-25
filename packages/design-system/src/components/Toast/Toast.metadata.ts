import { defineMetadata } from '../../metadata/schema.ts';

export const ToastMetadata = defineMetadata({
  component: {
    name: 'Toast',
    category: 'molecule',
    description: 'Transient notification that surfaces system status. Floats above content and dismisses automatically.',
    type: 'feedback',
    path: 'src/components/Toast/Toast.tsx',
    lastUpdated: '2026-05-18T18:22:57Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'save-confirmation',
      'background-task-result',
      'error-notification',
      'connection-status',
      'undo-affordance',
    ],
    requiredProps: ['children'],

    commonPatterns: [
      {
        name: 'success-confirmation',
        description: 'Confirm a completed action without interrupting flow.',
        composition: `<Toast intent="success">Project saved.</Toast>`,
      },
      {
        name: 'error-with-retry',
        description: 'Surface a recoverable error and let the user retry inline.',
        composition: `<Toast intent="danger" action={<Button variant="ghost" size="sm" onClick={retry}>Retry</Button>}>
  Could not sync changes.
</Toast>`,
      },
      {
        name: 'undo-affordance',
        description: 'Destructive action paired with an undo within the timeout window.',
        composition: `<Toast intent="info" duration={6000} action={<Button variant="ghost" size="sm" onClick={undo}>Undo</Button>}>
  Email moved to trash.
</Toast>`,
      },
      {
        name: 'persistent-critical',
        description: 'Stay visible until acknowledged — only for genuinely critical issues.',
        composition: `<Toast intent="danger" duration={null} onDismiss={ack}>
  Connection lost. Working offline.
</Toast>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using Toast for content the user must read or act on to continue.',
        reason: 'Toasts auto-dismiss and may be missed entirely by users with cognitive disabilities, slow readers, or screen magnifiers. Critical decisions disappear.',
        alternative: 'Use Modal for blocking decisions, Alert for inline persistent status, Banner for app-wide warnings.',
      },
      {
        scenario: 'Putting form fields, multiple buttons, or rich content inside a Toast.',
        reason: 'Toasts are not focus-trapping. Inputs inside them are unreachable by keyboard, and the auto-dismiss timer destroys partial input.',
        alternative: 'Use Modal or Drawer for any flow that requires sustained interaction.',
      },
      {
        scenario: 'Stacking more than 3 Toasts at once.',
        reason: 'Visual overwhelm, occluded content, and on touch devices the bottom-most toast covers gesture areas.',
        alternative: 'Queue toasts (one visible, others wait) or consolidate ("3 files uploaded" instead of 3 separate toasts).',
      },
      {
        scenario: 'Using Toast to communicate validation errors on a specific form field.',
        reason: 'The error is detached from the field, fails 1:1 association for screen readers, and disappears before the user fixes it.',
        alternative: 'Use FormField error prop next to the input. Toast is for system-level events, not field-level validation.',
      },
      {
        scenario: 'Duration < 4 seconds for any message longer than 4 words.',
        reason: 'Users need ~300ms per word to read plus time to process. Below this threshold the toast effectively never existed for many users.',
        alternative: 'Default duration=5000ms. Add +1s per 10 characters beyond a short label. Persistent for anything actionable.',
      },
      {
        scenario: 'Using intent="danger" toasts for non-recoverable critical failures.',
        reason: 'Auto-dismiss + low visual weight ≠ critical. Users learn red toasts are minor.',
        alternative: 'Use Modal with role="alertdialog" for critical failures that block the user.',
      },
      {
        scenario: 'Color-only intent communication (red bar = bad, green bar = good, no icon).',
        reason: 'Colorblind users (8% of men) and high-contrast-mode users miss the only signal.',
        alternative: 'Always pair the accent color with an intent icon. The component does this by default — do not disable it.',
      },
    ],
  },

  variants: {
    intent: {
      options: ['info', 'success', 'warning', 'danger'],
      default: 'info',
      purpose: {
        info: 'Neutral system message. Default for confirmations that have no positive/negative valence.',
        success: 'A user-initiated action completed successfully. Pair with a verb in past tense ("Saved", "Sent").',
        warning: 'Something needs attention but did not fail. Connection degraded, quota approaching, partial save.',
        danger: 'Recoverable failure or destructive action confirmation. NOT for critical failures — those go in Modal.',
      },
    },
    placement: {
      options: ['top-right', 'top-center', 'bottom-right', 'bottom-center'],
      default: 'top-right',
      purpose: {
        'top-right': 'Default on desktop. Out of the way of primary content.',
        'top-center': 'Use for app-wide notices that should command attention briefly.',
        'bottom-right': 'Alternative for apps with top-anchored UI (toolbars, headers) that conflict with top-right.',
        'bottom-center': 'Mobile default. Within thumb reach but above the gesture area.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Toast message body. Plain text or a single short inline element. Do NOT put forms or multiple actions here.',
        acceptedComponents: ['Link', 'Code'],
        forbiddenComponents: ['Input', 'Textarea', 'Select', 'Card', 'Modal', 'Form'],
        required: true,
      },
      {
        name: 'action',
        description: 'A single trailing action — typically a ghost-variant Button for "Undo" or "Retry".',
        acceptedComponents: ['Button'],
        forbiddenComponents: ['Input', 'Select'],
        required: false,
      },
    ],
    commonSiblings: ['Toast'],
    parentConstraints: ['ToastViewport'],
    forbiddenParents: ['Modal', 'Card', 'Button', 'Link'],
  },

  behavior: {
    states: [
      { name: 'entering',  visual: 'Slides + fades in from placement edge over 250ms.' },
      { name: 'visible',   visual: 'Floating surface with shadow lg and intent-colored accent bar.', semantic: 'aria-live region announces content.' },
      { name: 'hovered',   visual: 'Auto-dismiss timer pauses.', semantic: 'Allows users to read long messages.' },
      { name: 'focused',   visual: 'Timer pauses; focus ring on action if present.' },
      { name: 'exiting',   visual: 'Fades and slides out over 150ms.' },
    ],
    interactions: [
      'Auto-dismisses after `duration` ms (default 5000).',
      'Hover or keyboard focus pauses the dismiss timer.',
      'Close button (if shown) or Esc dismisses immediately.',
      'Action button (if present) fires onClick and does NOT auto-dismiss — let the action handler call onDismiss.',
    ],
    responsive: 'On viewports < 640px, placement collapses to bottom-center and width spans the viewport with safe-area padding.',
    motion: 'Enter: motion.preset.enter. Exit: motion.preset.exit. Timer pause has no animation — instant.',
  },

  props: {
    children: { type: 'ReactNode', required: true, description: 'Toast message body. Short — one sentence ideal.', acceptsNode: true },
    intent:   { type: `'info' | 'success' | 'warning' | 'danger'`, default: `'info'`, required: false, description: 'Visual and semantic accent.' },
    placement:{ type: `'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'`, default: `'top-right'`, required: false, description: 'Anchor position. Mobile auto-overrides to bottom-center.' },
    duration: { type: 'number | null', default: '5000', required: false, description: 'Milliseconds before auto-dismiss. `null` keeps the toast visible until manually dismissed.' },
    action:   { type: 'ReactNode', required: false, description: 'Single trailing action — Button preferred.', acceptsNode: true },
    onDismiss:{ type: '() => void', required: false, description: 'Called on auto-dismiss, manual close, or Esc.' },
    showClose:{ type: 'boolean', default: 'true', required: false, description: 'Render a close icon button. Set false only when an action button already exists.' },
    icon:     { type: 'ReactNode', required: false, description: 'Override the default intent icon. Use sparingly.', acceptsNode: true },
  },

  tokens: {
    semantic: [
      'component.toast.{radius,paddingX,paddingY,gap,minWidth,maxWidth}',
      'component.toast.{bg,border,shadow,text,textMuted}',
      'component.toast.{accentSuccess,accentWarning,accentDanger,accentInfo}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'status (intent=info/success); alert (intent=warning/danger)',
    keyboardSupport: 'Esc dismisses the focused toast. Tab moves focus to the action button (if present) then close button.',
    screenReader: 'Announces content via aria-live="polite" (info/success) or aria-live="assertive" (warning/danger). Intent is announced as part of the role.',
    wcag: 'AA',
    notes: [
      'ToastViewport must set aria-label="Notifications" so screen readers identify the region.',
      'Never make the only way to dismiss a toast a click on a tiny X — keyboard users need Esc support.',
      'Hover/focus MUST pause the timer. WCAG 2.2.1 Timing Adjustable.',
      'Auto-dismiss conflicts with WCAG 2.2.3 No Timing for time-critical content — use duration={null} for anything important.',
      'Color is never the only signal: every intent has a distinct icon AND a labelled role.',
    ],
  },

  aiHints: {
    priority: 'medium',
    keywords: ['toast', 'notification', 'snackbar', 'alert', 'status', 'message', 'flash', 'banner', 'notice'],

    selectionCriteria: {
      'Does the user need to read or act on this to continue?':
        'YES → use Modal. Toast auto-dismisses; critical content cannot disappear.',
      'Is this a field-level validation error?':
        'NO — pass error to FormField. Toast detaches the error from its source.',
      'Is this an app-wide warning that should stay visible (e.g. offline)?':
        'Use Banner, not Toast. Or set duration={null} on the Toast if it should still be dismissable.',
      'Is this acknowledging an action the user just took?':
        'YES — Toast with intent matching the outcome (success / warning / danger).',
      'Will multiple of these fire in quick succession?':
        'Queue them or consolidate ("3 files uploaded") — do not stack more than 3 visible.',
      'Does the action allow undo?':
        'Set duration ≥ 6000ms and pass action={<Button>Undo</Button>}. Five seconds is too short for users to react.',
      'How long should it stay?':
        'Default 5000ms. Add 1s per 10 characters of message. null if actionable or critical.',
    },

    disambiguateFrom: {
      Modal: 'Modal blocks the rest of the UI and demands action. Toast slides past without interrupting.',
      Alert: 'Alert is inline and persistent in the document flow. Toast floats and dismisses.',
      Banner: 'Banner is anchored to the top of the app or a section and stays until conditions change. Toast is transient.',
      Tooltip: 'Tooltip is anchored to a trigger and shown on hover/focus. Toast appears in response to state changes.',
      Popover: 'Popover is anchored and interactive. Toast is detached and minimally interactive.',
    },
  },

  examples: [
    {
      name: 'undo-deletion',
      description: 'Destructive action paired with undo. Persistent until user acts or 6s pass.',
      code: `function deleteItem(id) {
  remove(id);
  showToast(
    <Toast
      intent="info"
      duration={6000}
      action={<Button variant="ghost" size="sm" onClick={() => restore(id)}>Undo</Button>}
    >
      Item deleted.
    </Toast>
  );
}`,
    },
    {
      name: 'connection-offline',
      description: 'Persistent warning that requires acknowledgment.',
      code: `<Toast intent="warning" duration={null} onDismiss={ack}>
  You are offline. Changes will sync when you reconnect.
</Toast>`,
    },
    {
      name: 'queued-uploads',
      description: 'Consolidated success message instead of stacking 5 toasts.',
      code: `<Toast intent="success">5 files uploaded.</Toast>`,
    },
  ],
});
