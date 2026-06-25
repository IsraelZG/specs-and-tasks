import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.input.* + theme.intent.danger.strong + theme.content.muted
 * Wraps an Input or Checkbox with a label, optional helper text, and optional error text.
 * The errorText toggles the Input's invalid prop via context — consumers pass invalid
 * directly to the inner Input when they need programmatic control.
 */

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helpText?: string;
  errorText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, helpText, errorText, children, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-[var(--ds-spacing-1)]', className)}>
      <label
        htmlFor={htmlFor}
        className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[color:var(--ds-theme-content-strong)] leading-none"
      >
        {label}
      </label>
      {children}
      {errorText && (
        <p className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-intent-danger-strong)] leading-snug">
          {errorText}
        </p>
      )}
      {!errorText && helpText && (
        <p className="text-[length:var(--ds-font-size-xs)] text-[color:var(--ds-theme-content-muted)] leading-snug">
          {helpText}
        </p>
      )}
    </div>
  )
);

FormField.displayName = 'FormField';

export { FormField };
