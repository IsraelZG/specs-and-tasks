import * as React from 'react';
export interface NavGroupProps {
    label?: string;
    children: React.ReactNode;
    className?: string;
}
declare const NavGroup: React.ForwardRefExoticComponent<NavGroupProps & React.RefAttributes<HTMLDivElement>>;
export { NavGroup };
