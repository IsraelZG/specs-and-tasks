import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../../lib/utils';

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>;

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        'peer inline-flex shrink-0 cursor-pointer items-center rounded-[var(--ds-component-switch-track-radius)] transition-colors duration-200 ease-in-out',
        'w-[var(--ds-component-switch-track-width)] h-[var(--ds-component-switch-track-height)]',
        // Background states: Off vs On
        'bg-[var(--ds-component-switch-track-bg-off)] data-[state=checked]:bg-[var(--ds-component-switch-track-bg-on)]',
        // Universal Focus styling matching design-system schema
        'focus-visible:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block rounded-full transition-transform duration-200 ease-in-out',
          'w-[var(--ds-component-switch-thumb-size)] h-[var(--ds-component-switch-thumb-size)]',
          'bg-[var(--ds-component-switch-thumb-bg)] shadow-[var(--ds-component-switch-thumb-shadow)]',
          // Position translation: 2px padding when off, 22px when on (44px total width - 20px thumb - 2px padding = 22px)
          'translate-x-[2px] data-[state=checked]:translate-x-[22px]'
        )}
      />
    </SwitchPrimitives.Root>
  )
);

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
