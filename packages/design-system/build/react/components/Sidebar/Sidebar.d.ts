import * as React from 'react';
export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    collapsible?: boolean;
    isCollapsed?: boolean;
}
export declare const Sidebar: React.ForwardRefExoticComponent<SidebarProps & React.RefAttributes<HTMLDivElement>>;
export declare function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarGroupLabel({ className, isCollapsed, ...props }: React.HTMLAttributes<HTMLDivElement> & {
    isCollapsed?: boolean;
}): React.JSX.Element | null;
export declare function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isActive?: boolean;
    isCollapsed?: boolean;
}
export declare const SidebarMenuButton: React.ForwardRefExoticComponent<SidebarMenuButtonProps & React.RefAttributes<HTMLButtonElement>>;
export declare function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
