import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.navigation.item.* + focusRing.*
 * Theme exceptions (tone="inverse"): --ds-theme-surface-inverse, --ds-theme-content-on-inverse
 *
 * Anti-patterns:
 *   - Never render as <div> with onClick — always as="a" or as="button"
 *   - Only ONE active item per group (caller's responsibility)
 *   - Icon-only collapsed items REQUIRE aria-label
 */

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

type NavItemAsLink   = NavItemBaseProps & { as?: 'a'; href?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> };
type NavItemAsButton = NavItemBaseProps & { as: 'button'; href?: never; onClick?: React.MouseEventHandler<HTMLButtonElement> };

export type NavItemProps = NavItemAsLink | NavItemAsButton;

const baseClasses = [
  'flex items-center w-full',
  'rounded-[var(--ds-component-navigation-item-radius)]',
  'transition-[background-color,color] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
  'cursor-pointer',
  'focus-visible:outline-none',
  'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
  'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
  'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
].join(' ');

const sizeClasses = {
  sm: 'h-8 px-[var(--ds-component-navigation-item-padding-x)] gap-[var(--ds-component-navigation-item-gap)] text-xs',
  md: 'h-[var(--ds-component-navigation-item-height)] px-[var(--ds-component-navigation-item-padding-x)] gap-[var(--ds-component-navigation-item-gap)] text-sm',
};

const NavItem = React.forwardRef<HTMLElement, NavItemProps>(
  (
    {
      as: Tag = 'a',
      children,
      icon,
      trailing,
      active = false,
      disabled = false,
      collapsed = false,
      tone = 'default',
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const isInverse = tone === 'inverse';

    const colorClasses = active
      ? 'bg-[var(--ds-component-navigation-item-bg-active)] text-[color:var(--ds-component-navigation-item-text-active)]'
      : isInverse
        // inactive + inverse: theme exceptions documented in metadata
        ? 'bg-transparent text-[color:var(--ds-theme-content-on-inverse)] hover:bg-white/10'
        : 'bg-transparent text-[color:var(--ds-component-navigation-item-text-inactive)] hover:bg-[var(--ds-component-navigation-item-bg-hover)] hover:text-[color:var(--ds-component-navigation-item-text-active)]';

    const disabledClasses = disabled
      ? 'pointer-events-none opacity-50'
      : '';

    return React.createElement(
      Tag,
      {
        ref,
        // a11y: aria-current for links, aria-pressed for buttons
        'aria-current': active && Tag === 'a' ? 'page' : undefined,
        'aria-pressed': active && Tag === 'button' ? true : undefined,
        'aria-disabled': disabled || undefined,
        tabIndex: disabled ? -1 : undefined,
        className: cn(
          baseClasses,
          sizeClasses[size],
          colorClasses,
          disabledClasses,
          collapsed && 'justify-center px-0',
          className
        ),
        ...props,
      },
      <>
        {icon && (
          <span aria-hidden="true" className="flex shrink-0 items-center justify-center">
            {icon}
          </span>
        )}
        {/* sr-only hides label visually when collapsed but keeps it for screen readers */}
        <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>
          {children}
        </span>
        {trailing && !collapsed && (
          <span aria-hidden="true" className="ml-auto flex shrink-0 items-center">
            {trailing}
          </span>
        )}
      </>
    );
  }
);

NavItem.displayName = 'NavItem';

export { NavItem };
