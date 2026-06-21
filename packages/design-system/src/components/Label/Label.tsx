import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  disabled?: boolean;
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, disabled, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[color:var(--ds-theme-content-strong)] leading-none select-none',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-[color:var(--ds-theme-intent-danger-strong)] ml-[var(--ds-spacing-half)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };
