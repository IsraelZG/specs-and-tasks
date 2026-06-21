import * as React from 'react';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.navigation.item.padding-x + focusRing.*
 * Groups NavItems under an optional category label.
 * The label uses ds-overline text treatment from the showcase styles.
 */

export interface NavGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

const NavGroup = React.forwardRef<HTMLDivElement, NavGroupProps>(
  ({ label, children, className }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)}>
      {label && (
        <p
          className={cn(
            'px-[var(--ds-component-navigation-item-padding-x)]',
            'text-[length:var(--ds-font-size-xs)]',
            'font-[var(--ds-font-weight-semibold)]',
            'tracking-[var(--ds-font-letter-spacing-widest)]',
            'uppercase',
            'text-[color:var(--ds-theme-content-subtle)]',
            'select-none',
            'mb-1',
          )}
        >
          {label}
        </p>
      )}
      {children}
    </div>
  )
);

NavGroup.displayName = 'NavGroup';

export { NavGroup };
