import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.toast.* + focusRing.*
 * Placement is managed internally via fixed positioning.
 * Timer pauses on hover/focus per WCAG 2.2.1 Timing Adjustable.
 */

// ─── Intent icons ──────────────────────────────────────────────────────────

const IntentIcon = ({ intent }: { intent: NonNullable<ToastProps['intent']> }) => {
  const cls = 'shrink-0 mt-0.5';
  if (intent === 'success') return (
    <svg aria-hidden="true" className={cls} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".15" />
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (intent === 'warning') return (
    <svg aria-hidden="true" className={cls} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13H1.5L8 2Z" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M8 6.5v3M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (intent === 'danger') return (
    <svg aria-hidden="true" className={cls} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  // info (default)
  return (
    <svg aria-hidden="true" className={cls} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// ─── Accent bar color map ───────────────────────────────────────────────────

const ACCENT_VAR: Record<string, string> = {
  info:    'var(--ds-component-toast-accent-info)',
  success: 'var(--ds-component-toast-accent-success)',
  warning: 'var(--ds-component-toast-accent-warning)',
  danger:  'var(--ds-component-toast-accent-danger)',
};

// ─── CVA variants ──────────────────────────────────────────────────────────

const toastBase = cva(
  [
    'fixed z-[600] flex items-start overflow-hidden',
    'rounded-[var(--ds-component-toast-radius)]',
    'border border-[var(--ds-component-toast-border)]',
    'bg-[var(--ds-component-toast-bg)]',
    'shadow-[var(--ds-component-toast-shadow)]',
    'text-[color:var(--ds-component-toast-text)] text-sm',
    'min-w-[var(--ds-component-toast-min-width)]',
    'max-w-[var(--ds-component-toast-max-width)]',
    'transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
  ],
  {
    variants: {
      placement: {
        'top-right':    'top-4 right-4',
        'top-center':   'top-4 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-center':'bottom-4 left-1/2 -translate-x-1/2',
      },
      visible: {
        true:  'opacity-100 translate-y-0',
        false: 'opacity-0 translate-y-2 pointer-events-none',
      },
    },
    defaultVariants: {
      placement: 'top-right',
      visible: true,
    },
  }
);

// ─── Props ─────────────────────────────────────────────────────────────────

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  intent?: 'info' | 'success' | 'warning' | 'danger';
  placement?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  duration?: number | null;
  action?: React.ReactNode;
  onDismiss?: () => void;
  showClose?: boolean;
  icon?: React.ReactNode;
}

// ─── Component ─────────────────────────────────────────────────────────────

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      children,
      intent = 'info',
      placement = 'top-right',
      duration = 5000,
      action,
      onDismiss,
      showClose = true,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Mount: trigger enter animation on next frame
    React.useEffect(() => {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }, []);

    const startTimer = React.useCallback(() => {
      if (duration === null) return;
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 200);
      }, duration);
    }, [duration, onDismiss]);

    const clearTimer = React.useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    // Start timer once visible
    React.useEffect(() => {
      if (!visible) return;
      startTimer();
      return clearTimer;
    }, [visible, startTimer, clearTimer]);

    const handleDismiss = () => {
      clearTimer();
      setVisible(false);
      setTimeout(() => onDismiss?.(), 200);
    };

    const isAssertive = intent === 'danger' || intent === 'warning';

    return (
      <div
        ref={ref}
        role={isAssertive ? 'alert' : 'status'}
        aria-live={isAssertive ? 'assertive' : 'polite'}
        aria-atomic="true"
        onMouseEnter={clearTimer}
        onMouseLeave={startTimer}
        onFocus={clearTimer}
        onBlur={startTimer}
        className={cn(toastBase({ placement, visible }), className)}
        {...props}
      >
        {/* Intent accent bar */}
        <span
          aria-hidden="true"
          className="w-2 shrink-0 self-stretch"
          style={{ backgroundColor: ACCENT_VAR[intent] }}
        />

        {/* Body */}
        <div
          className="flex flex-1 items-start gap-[var(--ds-component-toast-gap)] px-[var(--ds-component-toast-padding-x)] py-[var(--ds-component-toast-padding-y)]"
          style={{ color: ACCENT_VAR[intent] }}
        >
          <span style={{ color: ACCENT_VAR[intent] }}>
            {icon ?? <IntentIcon intent={intent} />}
          </span>
          <span className="flex-1 text-[color:var(--ds-component-toast-text)]">
            {children}
          </span>
          {action && <span className="shrink-0">{action}</span>}
          {showClose && !action && (
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={handleDismiss}
              className={cn(
                'shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100',
                'text-[color:var(--ds-component-toast-text-muted)]',
                'transition-opacity duration-[150ms]',
                'focus-visible:outline-none',
                'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
                'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
                'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
              )}
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export { Toast };
