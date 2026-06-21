import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.button.* + focusRing.*
 * All var() references resolve from --ds-component-button-* CSS custom properties
 * compiled into build/web/theme-{light,dark}.css. Never hardcode colors.
 */

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap select-none',
    'rounded-[var(--ds-component-button-radius)]',
    'font-[var(--ds-component-button-font-weight)] text-sm leading-none',
    'gap-[var(--ds-component-button-gap)]',
    'transition-[background-color,box-shadow,transform]',
    'duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
    'cursor-pointer',
    // Focus ring — shared focusRing.* tokens, keyboard-only
    'focus-visible:outline-none',
    'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
    'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
    'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Press
    'active:scale-[0.98] active:duration-[50ms] active:ease-[cubic-bezier(0.4,0,1,1)]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--ds-component-button-primary-bg)]',
          'text-[var(--ds-component-button-primary-text)]',
          'hover:bg-[var(--ds-component-button-primary-bg-hover)]',
        ],
        secondary: [
          'bg-[var(--ds-component-button-secondary-bg)]',
          'text-[var(--ds-component-button-secondary-text)]',
          'border border-[var(--ds-component-button-secondary-border)]',
          'hover:bg-[var(--ds-component-button-secondary-bg-hover)]',
        ],
        ghost: [
          'bg-[var(--ds-component-button-ghost-bg)]',
          'text-[var(--ds-component-button-ghost-text)]',
          'hover:bg-[var(--ds-component-button-ghost-bg-hover)]',
        ],
        danger: [
          'bg-[var(--ds-component-button-danger-bg)]',
          'text-[var(--ds-component-button-danger-text)]',
          'hover:bg-[var(--ds-component-button-danger-bg-hover)]',
        ],
      },
      size: {
        sm: 'h-[var(--ds-component-button-height-sm)] px-[var(--ds-component-button-padding-x-sm)]',
        md: 'h-[var(--ds-component-button-height-md)] px-[var(--ds-component-button-padding-x-md)]',
        lg: 'h-[var(--ds-component-button-height-lg)] px-[var(--ds-component-button-padding-x-lg)]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={(disabled || loading) || undefined}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {loading && (
          <svg
            aria-hidden="true"
            className="animate-spin h-[1em] w-[1em] shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
