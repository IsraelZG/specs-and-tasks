import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const toggleVariants = cva(
  [
    'inline-flex items-center justify-center rounded-[var(--ds-component-button-radius)] text-sm font-medium transition-colors select-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-transparent text-[color:var(--ds-theme-content-default)]',
          'hover:bg-[color:var(--ds-theme-surface-subdued)]',
          'data-[state=on]:bg-[color:var(--ds-theme-border-subtle)] data-[state=on]:text-[color:var(--ds-theme-content-default)]',
        ],
        outline: [
          'border border-[color:var(--ds-theme-border-subtle)] bg-transparent text-[color:var(--ds-theme-content-default)]',
          'hover:bg-[color:var(--ds-theme-surface-subdued)]',
          'data-[state=on]:border-[color:var(--ds-theme-border-default)] data-[state=on]:bg-[color:var(--ds-theme-border-subtle)]',
        ],
      },
      size: {
        sm: 'h-8 px-2 min-w-[32px]',
        md: 'h-10 px-3 min-w-[40px]',
        lg: 'h-12 px-4 min-w-[48px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  )
);

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
