import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const badgeVariants: (props?: ({
    intent?: "danger" | "info" | "success" | "warning" | "neutral" | null | undefined;
    size?: "sm" | "md" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
}
declare const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLSpanElement>>;
export { Badge, badgeVariants };
