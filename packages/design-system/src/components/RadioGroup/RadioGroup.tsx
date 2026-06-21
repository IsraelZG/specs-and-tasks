import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../../lib/utils';

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {}

const RadioGroup = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Root>, RadioGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Root
        className={cn('grid gap-[var(--ds-spacing-3)]', className)}
        {...props}
        ref={ref}
      />
    );
  }
);
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {}

const RadioGroupItem = React.forwardRef<React.ElementRef<typeof RadioGroupPrimitive.Item>, RadioGroupItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          'aspect-square rounded-full border border-[color:var(--ds-component-checkbox-border)] text-[color:var(--ds-component-checkbox-bg-checked)]',
          'w-[var(--ds-component-checkbox-size)] h-[var(--ds-component-checkbox-size)]',
          'flex items-center justify-center cursor-pointer',
          // Focus state
          'focus:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]',
          // Checked border color
          'data-[state=checked]:border-[color:var(--ds-component-checkbox-bg-checked)]',
          // Disabled state
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }
);
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
