import * as React from 'react';
export interface FormFieldProps {
    label: string;
    htmlFor?: string;
    helpText?: string;
    errorText?: string;
    children: React.ReactNode;
    className?: string;
}
declare const FormField: React.ForwardRefExoticComponent<FormFieldProps & React.RefAttributes<HTMLDivElement>>;
export { FormField };
