import * as React from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../Button/Button';

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  selected?: Date;
  onSelect?: (date: Date) => void;
  showOutsideDays?: boolean;
}

export function Calendar({
  className,
  selected,
  onSelect,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => selected || new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days: { date: Date; isOutside: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthTotalDays - i),
      isOutside: true,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    days.push({
      date: new Date(year, month, i),
      isOutside: false,
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isOutside: true,
    });
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div
      className={cn(
        'p-4 bg-[color:var(--ds-theme-surface-default)] border border-[color:var(--ds-theme-border-subtle)] rounded-xl shadow-[var(--ds-theme-shadow-md)] w-[280px]',
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:bg-[color:var(--ds-theme-surface-subdued)] cursor-pointer text-sm text-[color:var(--ds-theme-content-muted)]'
          )}
        >
          ◀
        </button>
        <span className="text-sm font-semibold capitalize text-[color:var(--ds-theme-content-default)]">
          {monthName} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'h-7 w-7 p-0 flex items-center justify-center rounded-lg hover:bg-[color:var(--ds-theme-surface-subdued)] cursor-pointer text-sm text-[color:var(--ds-theme-content-muted)]'
          )}
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekdays.map((day) => (
          <span
            key={day}
            className="text-xs font-semibold text-[color:var(--ds-theme-content-muted)]"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, isOutside }, index) => {
          const selectedState = isSelected(date);
          const todayState = isToday(date);

          if (isOutside && !showOutsideDays) {
            return <div key={index} className="h-8 w-8" />;
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect?.(date)}
              className={cn(
                'h-8 w-8 text-xs font-medium rounded-lg flex items-center justify-center transition-all cursor-pointer',
                isOutside
                  ? 'text-[color:var(--ds-theme-content-muted)] opacity-40 hover:opacity-100 hover:bg-[color:var(--ds-theme-surface-subdued)]'
                  : 'text-[color:var(--ds-theme-content-default)] hover:bg-[color:var(--ds-theme-surface-subdued)]',
                todayState &&
                  'border border-[color:var(--ds-theme-border-subtle)] font-bold text-[color:var(--ds-theme-content-default)]',
                selectedState &&
                  'bg-[color:var(--ds-theme-surface-subdued)] text-[color:var(--ds-theme-content-default)] font-bold shadow-[var(--ds-theme-shadow-sm)]'
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';
