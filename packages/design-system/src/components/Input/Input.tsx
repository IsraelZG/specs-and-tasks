import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.input.* + focusRing.*
 * Container div carries border/bg; inner <input> is transparent.
 * has-[:focus-visible] on the container responds to child focus without JS state.
 * Anti-pattern: never use placeholder as the only label — always wrap in FormField.
 */

type InputSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-[var(--ds-component-input-height-sm)]',
  md: 'h-[var(--ds-component-input-height-md)]',
  lg: 'h-[var(--ds-component-input-height-lg)]',
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  size?: InputSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  invalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      leadingIcon,
      trailingIcon,
      invalid = false,
      disabled,
      readOnly,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          'relative flex items-center',
          'rounded-[var(--ds-component-input-radius)]',
          'bg-[var(--ds-component-input-bg)]',
          'border transition-[border-color,box-shadow] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          sizeClasses[size],
          // Border states
          !invalid && [
            'border-[var(--ds-component-input-border)]',
            'hover:border-[var(--ds-component-input-border-hover)]',
          ],
          invalid && 'border-[var(--ds-component-input-border-error)]',
          // Focus state via CSS :has() — no JS needed
          'has-[:focus-visible]:border-[var(--ds-component-input-border-focus)]',
          'has-[:focus-visible]:shadow-[var(--ds-component-input-shadow-focus)]',
          // Disabled
          disabled && 'bg-[var(--ds-component-input-bg-disabled)] pointer-events-none opacity-50',
          className
        )}
      >
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[var(--ds-component-input-padding-x)] text-[var(--ds-component-input-placeholder)] flex items-center"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-readonly={readOnly || undefined}
          className={cn(
            'w-full h-full bg-transparent outline-none',
            'text-[color:var(--ds-component-input-text)] text-sm',
            'placeholder:text-[color:var(--ds-component-input-placeholder)]',
            'px-[var(--ds-component-input-padding-x)]',
            leadingIcon  && 'pl-10',
            trailingIcon && 'pr-10',
          )}
          {...props}
        />
        {trailingIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-[var(--ds-component-input-padding-x)] text-[var(--ds-component-input-placeholder)] flex items-center"
          >
            {trailingIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
