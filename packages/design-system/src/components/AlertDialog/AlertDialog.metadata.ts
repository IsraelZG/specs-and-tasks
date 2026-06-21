import { defineMetadata } from '../../metadata/schema.ts';

export const AlertDialogMetadata = defineMetadata({
  component: {
    name: 'AlertDialog',
    category: 'organism',
    description: 'A modal dialog that interrupts the user with important content and requires an explicit confirmation action.',
    type: 'container',
    path: 'src/components/AlertDialog/AlertDialog.tsx',
    lastUpdated: '2026-05-20T00:00:00Z',
    metadataVersion: '1.0.0',
  },
  usage: {
    useCases: [
      'critical-action-confirmations',
      'account-deletion-warnings',
      'unsaved-changes-reminders',
    ],
    requiredProps: [],
    commonPatterns: [
      {
        name: 'destructive-confirmation',
        description: 'Requires confirmation before performing an irreversible action.',
        composition: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="danger">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-[color:var(--ds-theme-surface-danger)] text-white hover:bg-[color:var(--ds-theme-surface-danger-hover)]">
        Continue
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
      }
    ],
    antiPatterns: [
      {
        scenario: 'Using AlertDialog for informational messages that do not require explicit choices.',
        reason: 'AlertDialog intercepts page controls and expects users to click cancel/confirm. Informational alerts should use non-modal overlays or components.',
        alternative: 'Use Modal or Popover components instead.',
      }
    ]
  },
  behavior: {
    states: [
      { name: 'closed', visual: 'Alert dialog popup completely hidden.' },
      { name: 'open', visual: 'Fades in overlay backdrop; modal contents zoom and center into view.' }
    ],
    interactions: [
      'Clicking trigger opens dialog.',
      'Must click Action or Cancel to close. Dismiss by clicking backdrop or pressing Escape is supported but alerts are focus-trapped.'
    ],
    responsive: 'Paddings and widths automatically scale down on smaller mobile viewports.'
  },
  props: {},
  tokens: {
    semantic: [
      'theme.surface.default',
      'theme.border.subtle',
      'theme.content.default',
      'theme.content.muted',
      'theme.shadow.lg'
    ]
  },
  accessibility: {
    role: 'alertdialog',
    keyboardSupport: 'Tab focus trap inside dialog. Escape closes. Focus is returned to trigger element.',
    screenReader: 'Screen readers announce alertdialog roles, reading title and description automatically.',
    wcag: 'AAA',
    notes: [
      'Radix AlertDialog ensures WAI-ARIA guidelines compliance for alertdialog patterns.'
    ]
  },
  aiHints: {
    priority: 'high',
    keywords: ['alertdialog', 'confirm-modal', 'confirmation-dialog', 'danger-alert', 'destructive-action'],
    selectionCriteria: {
      'Do you need to prompt users to confirm a critical or destructive action before proceeding?': 'Yes, use AlertDialog.'
    },
    disambiguateFrom: {
      Modal: 'Modal can be dismissed by clicking outside and can contain scrollable forms. AlertDialog is specifically for interrupting important confirmations.'
    }
  },
  examples: [
    {
      name: 'simple-alert',
      description: 'Confirm file removal.',
      code: `<AlertDialog>
  <AlertDialogTrigger>Remove file</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Remove file?</AlertDialogTitle>
    <AlertDialogDescription>This removes the file from active storage.</AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`
    }
  ]
});
