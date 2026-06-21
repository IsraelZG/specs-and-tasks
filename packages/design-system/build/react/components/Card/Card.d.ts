import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const cardVariants: (props?: ({
    padding?: "sm" | "md" | "lg" | "none" | null | undefined;
    interactive?: boolean | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
type CardAsDiv = {
    as?: 'div' | 'article' | 'section';
    href?: never;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
};
type CardAsButton = {
    as: 'button';
    href?: never;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
type CardAsAnchor = {
    as: 'a';
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};
type CardBaseProps = VariantProps<typeof cardVariants> & {
    children: React.ReactNode;
    className?: string;
};
export type CardProps = CardBaseProps & (CardAsDiv | CardAsButton | CardAsAnchor);
declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLElement>>;
export { Card, cardVariants };
