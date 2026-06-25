import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '../../lib/utils';

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

export type HoverCardContentProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

const HoverCardContent = React.forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  HoverCardContentProps
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-80 rounded-xl border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] p-4 text-[color:var(--ds-theme-content-default)] shadow-[var(--ds-theme-shadow-md)] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));

HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
