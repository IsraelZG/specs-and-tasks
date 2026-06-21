import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.checkbox.* + focusRing.*
 * Uses native <input type="checkbox"> for maximum browser + AT compatibility.
 * Indeterminate state requires an imperative DOM call via ref.
 */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  indeterminate?: boolean;
  size?: 'sm' | 'md';
  onChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

const BOX_SIZE: Record<NonNullable<CheckboxProps['size']>, string> = {
  sm: 'w-4 h-4',
  md: 'w-[var(--ds-component-checkbox-size)] h-[var(--ds-component-checkbox-size)]',
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      children,
      indeterminate = false,
      size = 'md',
      disabled,
      onChange,
      className,
      id: idProp,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLInputElement>) ?? internalRef;
    const uid = React.useId();
    const id = idProp ?? uid;

    // Set the indeterminate DOM property (not a standard HTML attribute)
    React.useEffect(() => {
      if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate, ref]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2 select-none',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className
        )}
      >
        {/* Visually hidden native input */}
        <span className="relative inline-flex shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            disabled={disabled}
            onChange={handleChange}
            className={cn(
              'peer appearance-none shrink-0 cursor-pointer',
              BOX_SIZE[size],
              'rounded-[var(--ds-component-checkbox-radius)]',
              'border border-[color:var(--ds-component-checkbox-border)]',
              'bg-transparent',
              'transition-[background-color,border-color] duration-[100ms]',
              'checked:bg-[var(--ds-component-checkbox-bg-checked)]',
              'checked:border-[color:var(--ds-component-checkbox-bg-checked)]',
              'indeterminate:bg-[var(--ds-component-checkbox-bg-checked)]',
              'indeterminate:border-[color:var(--ds-component-checkbox-bg-checked)]',
              // Focus ring
              'focus-visible:outline-none',
              'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
              'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
              'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
              disabled && 'pointer-events-none',
            )}
            {...props}
          />
          {/* Checkmark — shown when checked */}
          <svg
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute opacity-0',
              'text-[color:var(--ds-component-checkbox-icon-checked)]',
              'peer-checked:opacity-100 peer-indeterminate:opacity-0',
              'transition-opacity duration-[100ms]',
              BOX_SIZE[size],
            )}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M3.5 8l3 3 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Dash — shown when indeterminate */}
          <svg
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute opacity-0',
              'text-[color:var(--ds-component-checkbox-icon-checked)]',
              'peer-indeterminate:opacity-100',
              'transition-opacity duration-[100ms]',
              BOX_SIZE[size],
            )}
            viewBox="0 0 16 16"
            fill="none"
          >
            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </span>

        {children && (
          <span className="text-sm leading-snug">{children}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
