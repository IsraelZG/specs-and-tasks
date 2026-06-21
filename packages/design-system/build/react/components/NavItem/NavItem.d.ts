import * as React from 'react';
export interface NavItemBaseProps {
    children: React.ReactNode;
    icon?: React.ReactNode;
    trailing?: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    collapsed?: boolean;
    tone?: 'default' | 'inverse';
    size?: 'sm' | 'md';
    className?: string;
    'aria-label'?: string;
}
type NavItemAsLink = NavItemBaseProps & {
    as?: 'a';
    href?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};
type NavItemAsButton = NavItemBaseProps & {
    as: 'button';
    href?: never;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
export type NavItemProps = NavItemAsLink | NavItemAsButton;
declare const NavItem: React.ForwardRefExoticComponent<NavItemProps & React.RefAttributes<HTMLElement>>;
export { NavItem };
