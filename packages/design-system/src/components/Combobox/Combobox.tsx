import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          className={cn('w-[200px] justify-between text-left font-normal border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl text-sm px-4 py-2 flex items-center', className)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="ml-2 text-xs opacity-50">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 overflow-hidden bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-xl shadow-[var(--ds-theme-shadow-md)]">
        <div className="p-2 border-b border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/20">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            className="h-8 text-xs w-full bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-lg px-2"
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
          {filteredOptions.length === 0 ? (
            <div className="text-xs text-[color:var(--ds-theme-content-muted)] p-2 text-center">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onValueChange?.(opt.value);
                  setOpen(false);
                  setSearchQuery('');
                }}
                className={cn(
                  'w-full text-left text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors text-[color:var(--ds-theme-content-default)] flex items-center justify-between',
                  opt.value === value
                    ? 'bg-[color:var(--ds-theme-surface-subdued)] font-semibold'
                    : 'hover:bg-[color:var(--ds-theme-surface-subdued)]/60'
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span className="text-[10px]">✔</span>}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
