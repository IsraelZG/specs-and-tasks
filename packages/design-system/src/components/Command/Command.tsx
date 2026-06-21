import * as React from 'react';
import { Modal } from '../Modal/Modal';
import { cn } from '../../lib/utils';

export interface CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function CommandDialog({ open, onOpenChange, children, className }: CommandProps) {
  return (
    <Modal open={open} onClose={() => { onOpenChange(false); }}>
      <div className={cn('w-full max-w-lg overflow-hidden bg-[color:var(--ds-theme-surface-default)] rounded-2xl border border-[color:var(--ds-theme-border-subtle)] shadow-[var(--ds-theme-shadow-lg)]', className)}>
        {children}
      </div>
    </Modal>
  );
}

export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (val: string) => void;
}

export const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, onValueChange, onChange, ...props }, ref) => {
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <div className="flex items-center px-4 border-b border-[color:var(--ds-theme-border-subtle)] h-12 gap-3 bg-[color:var(--ds-theme-surface-subdued)]/10">
        <span className="text-[color:var(--ds-theme-content-muted)] text-sm">🔍</span>
        <input
          ref={ref}
          onChange={handleValueChange}
          className={cn(
            'flex-1 h-8 bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm placeholder-[color:var(--ds-theme-content-muted)] text-[color:var(--ds-theme-content-default)]',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CommandInput.displayName = 'CommandInput';

export function CommandList({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('max-h-[300px] overflow-y-auto p-2 space-y-1', className)}>
      {children}
    </div>
  );
}

export function CommandGroup({
  heading,
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement> & { heading: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[color:var(--ds-theme-content-muted)] uppercase">
        {heading}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void;
}

export const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, onSelect, children, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      onSelect?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn(
          'w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)] flex items-center justify-between',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CommandItem.displayName = 'CommandItem';

export function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'ml-auto text-[10px] font-semibold text-[color:var(--ds-theme-content-muted)] tracking-widest px-1.5 py-0.5 border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/40 rounded',
        className
      )}
      {...props}
    />
  );
}
CommandShortcut.displayName = 'CommandShortcut';
