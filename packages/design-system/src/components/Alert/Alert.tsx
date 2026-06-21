import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.alert.* + focusRing.*
 * Inline persistent feedback — never auto-dismisses. Use Toast for transient messages.
 */

// ─── Intent icons ──────────────────────────────────────────────────────────

const AlertIcon = ({ intent }: { intent: NonNullable<AlertProps['intent']> }) => {
  const cls = 'shrink-0 mt-0.5 w-[18px] h-[18px]';
  if (intent === 'success') return (
    <svg aria-hidden="true" className={cls} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="currentColor" opacity=".2" />
      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (intent === 'warning') return (
    <svg aria-hidden="true" className={cls} viewBox="0 0 18 18" fill="none">
      <path d="M9 2.5L16 15.5H2L9 2.5Z" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M9 7v4M9 12.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (intent === 'danger') return (
    <svg aria-hidden="true" className={cls} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg aria-hidden="true" className={cls} viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="currentColor" opacity=".2" stroke="currentColor" strokeWidth="1.25" />
      <path d="M9 8v5M9 5.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// ─── CVA variants ──────────────────────────────────────────────────────────

const alertVariants = cva(
  [
    'flex items-start gap-[var(--ds-component-alert-gap)]',
    'rounded-[var(--ds-component-alert-radius)]',
    'px-[var(--ds-component-alert-padding-x)]',
    'py-[var(--ds-component-alert-padding-y)]',
    'border-l-[length:var(--ds-component-alert-border-width)] border-l-4',
    'text-sm',
  ],
  {
    variants: {
      intent: {
        info:    'bg-[var(--ds-component-alert-info-bg)]    text-[color:var(--ds-component-alert-info-text)]    border-l-[color:var(--ds-component-alert-info-border)]    [--alert-icon:var(--ds-component-alert-info-icon)]',
        success: 'bg-[var(--ds-component-alert-success-bg)] text-[color:var(--ds-component-alert-success-text)] border-l-[color:var(--ds-component-alert-success-border)] [--alert-icon:var(--ds-component-alert-success-icon)]',
        warning: 'bg-[var(--ds-component-alert-warning-bg)] text-[color:var(--ds-component-alert-warning-text)] border-l-[color:var(--ds-component-alert-warning-border)] [--alert-icon:var(--ds-component-alert-warning-icon)]',
        danger:  'bg-[var(--ds-component-alert-danger-bg)]  text-[color:var(--ds-component-alert-danger-text)]  border-l-[color:var(--ds-component-alert-danger-border)]  [--alert-icon:var(--ds-component-alert-danger-icon)]',
      },
    },
    defaultVariants: {
      intent: 'info',
    },
  }
);

// ─── Props ─────────────────────────────────────────────────────────────────

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { children, intent = 'info', title, dismissible = false, onDismiss, className, ...props },
    ref
  ) => {
    const isAssertive = intent === 'danger' || intent === 'warning';

    return (
      <div
        ref={ref}
        role={isAssertive ? 'alert' : 'status'}
        aria-live={isAssertive ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(alertVariants({ intent }), className)}
        {...props}
      >
        <span style={{ color: 'var(--alert-icon)' }}>
          <AlertIcon intent={intent ?? 'info'} />
        </span>

        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-0.5 leading-snug">{title}</p>}
          <div className="leading-relaxed">{children}</div>
        </div>

        {dismissible && (
          <button
            type="button"
            aria-label="Dismiss alert"
            onClick={onDismiss}
            className={cn(
              'shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100',
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
    );
  }
);

Alert.displayName = 'Alert';

export { Alert, alertVariants };
