import * as React from 'react';
export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    selected?: Date;
    onSelect?: (date: Date) => void;
    showOutsideDays?: boolean;
}
export declare function Calendar({ className, selected, onSelect, showOutsideDays, ...props }: CalendarProps): React.JSX.Element;
export declare namespace Calendar {
    var displayName: string;
}
