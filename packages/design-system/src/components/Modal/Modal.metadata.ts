import { defineMetadata } from '../../metadata/schema.ts';

export const ModalMetadata = defineMetadata({
  component: {
    name: 'Modal',
    category: 'organism',
    description: 'Blocking dialog that floats above the page. Traps focus, requires explicit dismissal, and scrim covers the background.',
    type: 'container',
    path: 'src/components/Modal/Modal.tsx',
    lastUpdated: '2026-05-18T00:00:00Z',
    metadataVersion: '1.0.0',
  },

  usage: {
    useCases: [
      'destructive-confirmation',
      'form-in-modal',
      'detail-view',
      'critical-error',
      'onboarding-step',
    ],
    requiredProps: ['open', 'onClose', 'children'],

    commonPatterns: [
      {
        name: 'destructive-confirm',
        description: 'Confirm before an irreversible action.',
        composition: `<Modal open={open} onClose={close} size="sm">
  <h2>Delete this project?</h2>
  <p>This cannot be undone.</p>
  <Button variant="danger" onClick={confirmDelete}>Delete project</Button>
  <Button variant="ghost" onClick={close}>Cancel</Button>
</Modal>`,
      },
      {
        name: 'form-modal',
        description: 'Inline form that creates or edits a record without leaving the page.',
        composition: `<Modal open={open} onClose={close} size="md" title="New workspace">
  <Input value={name} onChange={setName} placeholder="Workspace name" />
  <Button type="submit" variant="primary" onClick={create}>Create</Button>
</Modal>`,
      },
      {
        name: 'detail-drawer',
        description: 'Large modal showing the full detail of a record.',
        composition: `<Modal open={open} onClose={close} size="lg" title={record.name}>
  <RecordDetailContent record={record} />
</Modal>`,
      },
    ],

    antiPatterns: [
      {
        scenario: 'Using Modal for a simple success message after an action.',
        reason: 'Modal blocks all other UI, demanding attention. Non-critical status does not warrant that level of interruption.',
        alternative: 'Use Toast for transient confirmations, Alert for inline persistent status.',
      },
      {
        scenario: 'Opening a Modal from inside another Modal.',
        reason: 'Nested focus traps break keyboard navigation and confuse screen reader users about the document hierarchy.',
        alternative: 'Use a single Modal and swap content between steps, or reconsider the UX flow.',
      },
      {
        scenario: 'Not providing a visible close button or Esc dismissal.',
        reason: 'Keyboard users and users with motor disabilities must be able to dismiss without clicking the scrim.',
        alternative: 'Always pair dismissible=true (default) with a visible close button inside the Modal header.',
      },
      {
        scenario: 'Putting a very long scrollable form in a Modal.',
        reason: 'Modals clip viewport and scroll within a small container, which is disorienting and error-prone on mobile.',
        alternative: 'For long flows, use a full-page route or a multi-step Modal that keeps each step short.',
      },
      {
        scenario: 'Using Modal for navigating between pages.',
        reason: 'Modals do not update the URL. The back button cannot close them and deep-linking is impossible.',
        alternative: 'Use a route/page transition. Modal is for contextual overlays in the current route.',
      },
      {
        scenario: 'Disabling the scrim click to dismiss without adding another explicit close control.',
        reason: 'If dismissible=false removes scrim-click, keyboard users still need Esc or a button to escape.',
        alternative: 'Keep dismissible=true (default), or set dismissible=false only for flows that genuinely require completion (e.g. forced onboarding).',
      },
    ],
  },

  variants: {
    size: {
      options: ['sm', 'md', 'lg', 'fullscreen'],
      default: 'md',
      purpose: {
        sm:         'Confirmation dialogs, alerts, simple one-field forms. Width: 384px.',
        md:         'Default for most modals: short forms, detail cards, settings panels. Width: 512px.',
        lg:         'Data-heavy content: record detail, multi-step forms, preview panels. Width: 720px.',
        fullscreen: 'Immersive tasks that benefit from the full viewport: editors, media viewers, onboarding flows.',
      },
    },
  },

  composition: {
    slots: [
      {
        name: 'children',
        description: 'Modal body content. Scrollable if taller than the visible area.',
        acceptedComponents: [],
        forbiddenComponents: ['Modal'],
        required: true,
      },
    ],
    commonSiblings: ['Button', 'Input', 'Alert'],
    parentConstraints: [],
    forbiddenParents: ['Modal', 'Card', 'Button'],
  },

  behavior: {
    states: [
      { name: 'closed',   visual: 'Not rendered. Portal is empty.',                                          semantic: 'Nothing in the tab order.' },
      { name: 'entering', visual: 'Scrim fades in; panel scales from 95% to 100% over 200ms.',              semantic: 'Focus moves to first focusable element inside.' },
      { name: 'open',     visual: 'Panel is centered, scrim covers viewport, body scroll is locked.',        semantic: 'Focus trapped inside. aria-modal="true". Background content is inert.' },
      { name: 'exiting',  visual: 'Panel fades and scales down over 150ms, scrim fades.',                   semantic: 'Focus returns to the trigger element.' },
    ],
    interactions: [
      'Esc key closes the modal (when dismissible=true).',
      'Clicking the scrim closes the modal (when dismissible=true).',
      'Tab cycles focus through all focusable elements inside the modal only.',
      'Shift+Tab reverses focus cycle.',
      'Close button (if rendered) calls onClose.',
    ],
    responsive: 'On viewports narrower than 640px, all size variants except fullscreen collapse to a bottom-sheet with rounded top corners.',
    motion: 'Enter: scale 0.95 → 1.0 + opacity 0 → 1 over 200ms. Exit: same reversed over 150ms.',
  },

  props: {
    open:        { type: 'boolean',                                       required: true,  description: 'Controls visibility. Managed by the parent.' },
    onClose:     { type: '() => void',                                    required: true,  description: 'Called when the user dismisses (Esc, scrim click, close button).' },
    children:    { type: 'ReactNode',                                     required: true,  description: 'Modal body content.',                           acceptsNode: true },
    size:        { type: `'sm' | 'md' | 'lg' | 'fullscreen'`,            default: `'md'`, required: false, description: 'Panel width.' },
    title:       { type: 'string',                                        required: false, description: 'Optional heading text rendered at the top of the panel.' },
    dismissible: { type: 'boolean',                                       default: 'true', required: false, description: 'Allow Esc and scrim-click to close.' },
  },

  tokens: {
    semantic: [
      'component.modal.{radius,padding,bg,shadow,scrim}',
      'component.modal.width.{sm,md,lg}',
      'focusRing.{width,offset,color,shadow}',
    ],
    theme: [],
    primitive: [],
  },

  accessibility: {
    role: 'dialog',
    keyboardSupport: 'Tab/Shift+Tab cycle focus within the modal. Esc dismisses. Focus is trapped — nothing outside is reachable by keyboard while open.',
    screenReader: 'Announced as "dialog" with the title as aria-labelledby. aria-modal="true" hides background content from virtual cursor.',
    wcag: 'AA',
    notes: [
      'Set aria-labelledby pointing to the modal title element.',
      'On open, move focus to the first focusable element or the title.',
      'On close, return focus to the element that opened the modal.',
      'Lock body scroll while the modal is open to prevent background interaction.',
      'Background content must become inert (use the inert attribute or aria-hidden).',
    ],
  },

  aiHints: {
    priority: 'medium',
    keywords: ['modal', 'dialog', 'popup', 'overlay', 'confirm', 'alert dialog', 'lightbox', 'drawer'],

    selectionCriteria: {
      'Does the user need to complete this action before continuing?':
        'YES — Modal is appropriate. Use role="alertdialog" for critical decisions.',
      'Is this a status update the user just needs to see briefly?':
        'NO — use Toast. Modal demands attention unnecessarily for passive messages.',
      'Does this need deep-linking or back-button support?':
        'NO — use a page route. Modal does not update the URL.',
      'Is the content a short confirmation (delete, archive)?':
        'Use size="sm".',
      'Is the content a form with 3–6 fields?':
        'Use size="md".',
      'Is the content data-heavy (record detail, editor)?':
        'Use size="lg" or fullscreen.',
      'Is another Modal already open?':
        'Do NOT open a second Modal. Swap the content of the existing one or rethink the flow.',
    },

    disambiguateFrom: {
      Toast:  'Toast is transient and non-blocking. Modal blocks the full UI and demands interaction.',
      Alert:  'Alert is inline and persistent in the document flow. Modal floats above everything.',
      Card:   'Card is an inline content container. Modal is a floating overlay that traps focus.',
      Popover:'Popover is anchored to a trigger, smaller, and does not block the background. Modal is centered and full-scrim.',
    },
  },

  examples: [
    {
      name: 'delete-confirmation',
      description: 'Danger pattern: confirm before irreversible delete.',
      code: `function DeleteButton({ id }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      <Modal open={open} onClose={() => setOpen(false)} size="sm" title="Delete project?">
        <p>This cannot be undone. All data will be permanently removed.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button variant="danger" onClick={() => { deleteProject(id); setOpen(false); }}>
            Delete project
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}`,
    },
    {
      name: 'create-form-modal',
      description: 'Controlled form inside a modal that blocks until submitted or cancelled.',
      code: `function CreateWorkspace() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>New workspace</Button>
      <Modal open={open} onClose={() => setOpen(false)} size="md" title="Create workspace">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button type="submit" variant="primary" disabled={!name} onClick={() => { create(name); setOpen(false); }}>
            Create
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}`,
    },
  ],
});
