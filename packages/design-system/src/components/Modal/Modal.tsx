import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.modal.* + focusRing.*
 * Portal-based. Focus is trapped inside; body scroll is locked while open.
 * Anti-pattern: never nest Modal inside Modal.
 */

// ─── Panel variants ────────────────────────────────────────────────────────

const panelVariants = cva(
  [
    'relative flex flex-col w-full mx-auto',
    'rounded-[var(--ds-component-modal-radius)]',
    'bg-[var(--ds-component-modal-bg)]',
    'shadow-[var(--ds-component-modal-shadow)]',
    'p-[var(--ds-component-modal-padding)]',
    'transition-[opacity,transform] duration-[200ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'max-h-[calc(100dvh-4rem)] overflow-y-auto',
  ],
  {
    variants: {
      size: {
        sm:         'max-w-[var(--ds-component-modal-width-sm)]',
        md:         'max-w-[var(--ds-component-modal-width-md)]',
        lg:         'max-w-[var(--ds-component-modal-width-lg)]',
        fullscreen: 'max-w-none w-full h-dvh m-0 rounded-none',
      },
      visible: {
        true:  'opacity-100 scale-100',
        false: 'opacity-0 scale-95 pointer-events-none',
      },
    },
    defaultVariants: {
      size: 'md',
      visible: true,
    },
  }
);

// ─── Focus trap ────────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusableEls = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

    const first = focusableEls()[0];
    // `noUncheckedIndexedAccess` is off in this package's tsconfig, so TS sees
    // `first` as always-defined even though the array can be empty at runtime.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = focusableEls();
      if (els.length === 0) { e.preventDefault(); return; }
      const idx = els.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (idx <= 0) { e.preventDefault(); els[els.length - 1].focus(); }
      } else {
        if (idx === els.length - 1) { e.preventDefault(); els[0].focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [active, ref]);
}

// ─── Props ─────────────────────────────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  title?: string;
  dismissible?: boolean;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  title,
  dismissible = true,
  className,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const triggerRef = React.useRef<Element | null>(null);

  // Track the trigger element so we can return focus on close
  React.useEffect(() => {
    if (open) triggerRef.current = document.activeElement;
  }, [open]);

  // Manage scroll lock and layout shift padding
  React.useEffect(() => {
    if (!open) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const oldOverflow = document.body.style.overflow;
    const oldPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${String(scrollbarWidth)}px`;
    }

    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.style.paddingRight = oldPaddingRight;
    };
  }, [open]);

  // Mount → animate in
  React.useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => { setVisible(true); });
      return () => { cancelAnimationFrame(raf); };
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        (triggerRef.current as HTMLElement | null)?.focus();
      }, 200);
      return () => { clearTimeout(t); };
    }
  }, [open]);

  useFocusTrap(panelRef, visible);

  // Esc to close
  React.useEffect(() => {
    if (!visible || !dismissible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, [visible, dismissible, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const titleId = title ? 'modal-title' : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      aria-modal="true"
    >
      {/* Scrim */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-[var(--ds-component-modal-scrim)]',
          'transition-opacity duration-[200ms]',
          visible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={dismissible ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(panelVariants({ size, visible }), className)}
      >
        {/* Header */}
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 mb-4">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold leading-snug">
                {title}
              </h2>
            )}
            {dismissible && (
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className={cn(
                  'shrink-0 rounded-lg p-1.5 -mr-1 -mt-1 opacity-60 hover:opacity-100',
                  'transition-opacity duration-[150ms]',
                  'focus-visible:outline-none',
                  'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
                  'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
                  'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
                )}
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

Modal.displayName = 'Modal';

export { Modal };
