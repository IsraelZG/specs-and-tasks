import * as React from 'react';
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
    indeterminate?: boolean;
    size?: 'sm' | 'md';
    onChange?: (checked: boolean) => void;
    children?: React.ReactNode;
}
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
export { Checkbox };
