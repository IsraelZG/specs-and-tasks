import * as React from 'react';
type InputSize = 'sm' | 'md' | 'lg';
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    size?: InputSize;
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    invalid?: boolean;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export { Input };
