import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = React.forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, disabled, ...props }, ref) => {
    const value = props.value ?? props.defaultValue ?? [0];
    const thumbsCount = Array.isArray(value) ? value.length : 1;

    return (
      <SliderPrimitive.Root
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative flex w-full touch-none select-none items-center cursor-pointer',
          disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[color:var(--ds-theme-border-subtle)]">
          <SliderPrimitive.Range className="absolute h-full bg-[color:var(--ds-theme-intent-primary-fill)]" />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbsCount }).map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              'block h-5 w-5 rounded-full border-2 border-[color:var(--ds-theme-intent-primary-fill)] bg-[color:var(--ds-theme-surface-default)] shadow-[var(--ds-theme-shadow-sm)] transition-colors duration-150',
              'hover:bg-[color:var(--ds-theme-surface-subdued)]',
              'focus:outline-none focus-visible:ring-[var(--ds-focus-ring-width)] focus-visible:ring-[var(--ds-focus-ring-color)] focus-visible:ring-offset-[var(--ds-focus-ring-offset)] focus-visible:ring-offset-[var(--ds-theme-surface-default)]'
            )}
          />
        ))}
      </SliderPrimitive.Root>
    );
  }
);

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
