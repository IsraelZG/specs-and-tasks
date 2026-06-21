import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/*
 * Tokens consumed: component.avatar.*
 * Display-only atom. Wrap in Button or Link for interactive use.
 */

const avatarVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none',
    'rounded-[var(--ds-component-avatar-radius)]',
    'bg-[var(--ds-component-avatar-fallback-bg)]',
    'text-[color:var(--ds-component-avatar-fallback-text)]',
    'font-semibold leading-none',
  ],
  {
    variants: {
      size: {
        xs:  'w-[var(--ds-component-avatar-size-xs)]  h-[var(--ds-component-avatar-size-xs)]  text-[9px]',
        sm:  'w-[var(--ds-component-avatar-size-sm)]  h-[var(--ds-component-avatar-size-sm)]  text-[11px]',
        md:  'w-[var(--ds-component-avatar-size-md)]  h-[var(--ds-component-avatar-size-md)]  text-[13px]',
        lg:  'w-[var(--ds-component-avatar-size-lg)]  h-[var(--ds-component-avatar-size-lg)]  text-base',
        xl:  'w-[var(--ds-component-avatar-size-xl)]  h-[var(--ds-component-avatar-size-xl)]  text-xl',
        '2xl':'w-[var(--ds-component-avatar-size-2xl)] h-[var(--ds-component-avatar-size-2xl)] text-3xl',
      },
      ring: {
        true: 'outline outline-[length:var(--ds-component-avatar-ring-width)] outline-[color:var(--ds-component-avatar-ring-color)] outline-offset-[2px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// Generic person icon shown when there's no src and no fallback text
const PersonIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="w-[55%] h-[55%] opacity-60">
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" />
  </svg>
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  ring?: boolean;
}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt = '', fallback, size, ring, className, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false);
    const showImage = src && !imgError;

    return (
      <span
        ref={ref}
        role="img"
        aria-label={alt || undefined}
        className={cn(avatarVariants({ size, ring }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            aria-hidden="true"
            className="w-full h-full object-cover"
            onError={() => { setImgError(true); }}
          />
        ) : fallback ? (
          <span aria-hidden="true">{fallback.slice(0, 2).toUpperCase()}</span>
        ) : (
          <PersonIcon />
        )}
      </span>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
