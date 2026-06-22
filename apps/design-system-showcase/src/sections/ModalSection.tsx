import { useState } from 'react';
import { Modal, Button, Checkbox } from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

const sizes = ['sm', 'md', 'lg', 'fullscreen'] as const;
type ModalSize = typeof sizes[number];

const modalContent: Record<ModalSize, { title: string; body: React.ReactNode }> = {
  sm: {
    title: 'Delete file?',
    body: (
      <>
        <p className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-default)]">
          This action cannot be undone. The file <strong>design-tokens-v2.zip</strong> will be permanently removed from your account.
        </p>
      </>
    ),
  },
  md: {
    title: 'Notification preferences',
    body: (
      <div className="flex flex-col gap-3">
        <p className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)]">
          Choose which notifications you'd like to receive.
        </p>
        <Checkbox checked onChange={() => {}}>Product updates and announcements</Checkbox>
        <Checkbox checked={false} onChange={() => {}}>Weekly digest email</Checkbox>
        <Checkbox checked onChange={() => {}}>Security alerts</Checkbox>
      </div>
    ),
  },
  lg: {
    title: 'Invoice #INV-2024-089',
    body: (
      <div className="flex flex-col gap-2">
        {[
          { label: 'Design System License', amount: '$199.00' },
          { label: 'Component Library Add-on', amount: '$49.00' },
          { label: 'Priority Support (1yr)', amount: '$99.00' },
        ].map(({ label, amount }) => (
          <div
            key={label}
            className="flex justify-between py-2 border-b border-[color:var(--ds-theme-border-subtle)] last:border-b-0"
          >
            <span className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-default)]">{label}</span>
            <span className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[color:var(--ds-theme-content-strong)]">{amount}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <span className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[color:var(--ds-theme-content-strong)]">Total</span>
          <span className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-bold)] text-[color:var(--ds-theme-content-strong)]">$347.00</span>
        </div>
      </div>
    ),
  },
  fullscreen: {
    title: 'Import data',
    body: (
      <p className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-muted)]">
        Upload a CSV or JSON file to import your component data. Large imports may take a few minutes to process.
      </p>
    ),
  },
};

export default function ModalSection() {
  const [open, setOpen] = useState<ModalSize | null>(null);
  const [nonDismissibleOpen, setNonDismissibleOpen] = useState(false);

  return (
    <SectionWrapper
      id="modal"
      title="Modal"
      overline="Component"
      description="Blocking dialog with focus trap. Closes on Esc, × or overlay when dismissible=true."
    >
      <Subsection title="Sizes">
        {sizes.map(size => (
          <Button key={size} variant="secondary" onClick={() => setOpen(size)}>
            Open {size}
          </Button>
        ))}
      </Subsection>

      <Subsection title="Non-dismissible">
        <Button variant="ghost" onClick={() => setNonDismissibleOpen(true)}>
          Open modal — requires explicit action
        </Button>
      </Subsection>

      {sizes.map(size => (
        <Modal
          key={size}
          open={open === size}
          onClose={() => setOpen(null)}
          size={size}
          title={modalContent[size].title}
        >
          {modalContent[size].body}
          <div className="mt-6 flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            {size === 'sm'
              ? <Button variant="danger" onClick={() => setOpen(null)}>Delete permanently</Button>
              : <Button onClick={() => setOpen(null)}>Confirm</Button>
            }
          </div>
        </Modal>
      ))}

      <Modal
        open={nonDismissibleOpen}
        onClose={() => setNonDismissibleOpen(false)}
        size="md"
        title="Confirm account deletion"
        dismissible={false}
      >
        <p className="text-[length:var(--ds-font-size-sm)] text-[color:var(--ds-theme-content-default)]">
          This action requires your explicit confirmation. Your account and all associated data will be permanently deleted.
        </p>
        <div className="mt-6 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setNonDismissibleOpen(false)}>Keep my account</Button>
          <Button variant="danger" onClick={() => setNonDismissibleOpen(false)}>Yes, delete account</Button>
        </div>
      </Modal>
    </SectionWrapper>
  );
}
