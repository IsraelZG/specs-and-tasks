import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.card.* + focusRing.*
 * Polymorphic via `as` prop — must be "button" or "a" when interactive=true.
 * Anti-pattern: never nest Card inside Card; never use onClick on plain div.
 */

const cardVariants = cva(
  [
    'block text-inherit no-underline',
    'rounded-[var(--ds-component-card-radius)]',
    'bg-[var(--ds-component-card-bg)]',
    'border border-[var(--ds-component-card-border)]',
    'shadow-[var(--ds-component-card-shadow)]',
    'transition-[box-shadow,transform] duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-[var(--ds-component-card-padding)]',
        lg: 'p-10',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:shadow-[var(--ds-component-card-shadow-hover)]',
          'hover:-translate-y-0.5',
          'active:shadow-[var(--ds-component-card-shadow)]',
          'active:translate-y-0',
          'focus-visible:outline-none',
          'focus-visible:ring-[length:var(--ds-focus-ring-width)]',
          'focus-visible:ring-[color:var(--ds-focus-ring-color)]',
          'focus-visible:ring-offset-[length:var(--ds-focus-ring-offset)]',
        ],
      },
    },
    defaultVariants: {
      padding: 'md',
      interactive: false,
    },
  }
);

type CardAsDiv     = { as?: 'div' | 'article' | 'section'; href?: never; onClick?: React.MouseEventHandler<HTMLDivElement> };
type CardAsButton  = { as: 'button'; href?: never; onClick?: React.MouseEventHandler<HTMLButtonElement> };
type CardAsAnchor  = { as: 'a'; href: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> };

type CardBaseProps = VariantProps<typeof cardVariants> & {
  children: React.ReactNode;
  className?: string;
};

export type CardProps = CardBaseProps & (CardAsDiv | CardAsButton | CardAsAnchor);

const Card = React.forwardRef<HTMLElement, CardProps>(
  ({ as: Tag = 'div', padding, interactive, className, children, ...props }, ref) => {
    return React.createElement(
      Tag,
      {
        ref,
        className: cn(cardVariants({ padding, interactive }), className),
        ...props,
      },
      children
    );
  }
);

Card.displayName = 'Card';

export { Card, cardVariants };
