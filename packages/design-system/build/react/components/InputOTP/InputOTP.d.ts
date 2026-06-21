import * as React from 'react';
export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
}
export declare const InputOTP: React.ForwardRefExoticComponent<InputOTPProps & React.RefAttributes<HTMLDivElement>>;
