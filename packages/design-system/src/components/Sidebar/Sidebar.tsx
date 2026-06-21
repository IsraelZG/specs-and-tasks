import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: boolean;
  isCollapsed?: boolean;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsible = false, isCollapsed = false, children, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-[color:var(--ds-theme-surface-default)] border-r border-[color:var(--ds-theme-border-subtle)] transition-all duration-300 ease-in-out select-none',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4', className)}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1.5', className)} {...props} />;
}

export function SidebarGroupLabel({
  className,
  isCollapsed = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isCollapsed?: boolean }) {
  if (isCollapsed) return null;
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold tracking-wider text-[color:var(--ds-theme-content-muted)] uppercase',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-0.5', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  isCollapsed?: boolean;
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, isCollapsed = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all',
          isActive
            ? 'bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] font-semibold shadow-[var(--ds-theme-shadow-sm)]'
            : 'text-[color:var(--ds-theme-content-muted)] hover:text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)]/50',
          isCollapsed ? 'justify-center px-0 h-9 w-9 mx-auto' : '',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'p-3 border-t border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/10',
        className
      )}
      {...props}
    />
  );
}
