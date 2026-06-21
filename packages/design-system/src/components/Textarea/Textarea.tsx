import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, invalid = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex min-h-[80px] w-full bg-[var(--ds-component-input-bg)] text-[color:var(--ds-component-input-text)] text-sm',
          'rounded-[var(--ds-component-input-radius)]',
          'border transition-[border-color,box-shadow] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          'px-[var(--ds-component-input-padding-x)] py-[var(--ds-spacing-3)]',
          'placeholder:text-[color:var(--ds-component-input-placeholder)]',
          // Border states
          !invalid && [
            'border-[var(--ds-component-input-border)]',
            'hover:border-[var(--ds-component-input-border-hover)]',
          ],
          invalid && 'border-[var(--ds-component-input-border-error)]',
          // Focus states
          'focus-visible:outline-none',
          'focus-visible:border-[var(--ds-component-input-border-focus)]',
          'focus-visible:shadow-[var(--ds-component-input-shadow-focus)]',
          // Disabled state
          disabled && 'bg-[var(--ds-component-input-bg-disabled)] pointer-events-none opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
