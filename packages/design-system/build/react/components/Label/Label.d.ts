import * as React from 'react';
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    disabled?: boolean;
    required?: boolean;
}
declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
export { Label };
