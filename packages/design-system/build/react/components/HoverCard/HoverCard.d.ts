import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
declare const HoverCard: React.FC<HoverCardPrimitive.HoverCardProps>;
declare const HoverCardTrigger: React.ForwardRefExoticComponent<HoverCardPrimitive.HoverCardTriggerProps & React.RefAttributes<HTMLAnchorElement>>;
export interface HoverCardContentProps extends React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> {
}
declare const HoverCardContent: React.ForwardRefExoticComponent<HoverCardContentProps & React.RefAttributes<HTMLDivElement>>;
export { HoverCard, HoverCardTrigger, HoverCardContent };
