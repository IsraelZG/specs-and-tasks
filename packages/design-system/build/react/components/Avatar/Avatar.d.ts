import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const avatarVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xs" | "xl" | "2xl" | null | undefined;
    ring?: boolean | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof avatarVariants> {
    src?: string;
    alt?: string;
    fallback?: string;
    ring?: boolean;
}
declare const Avatar: React.ForwardRefExoticComponent<AvatarProps & React.RefAttributes<HTMLSpanElement>>;
export { Avatar, avatarVariants };
