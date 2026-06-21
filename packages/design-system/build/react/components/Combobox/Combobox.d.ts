import * as React from 'react';
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
export declare function Combobox({ options, value, onValueChange, placeholder, searchPlaceholder, emptyText, className, }: ComboboxProps): React.JSX.Element;
