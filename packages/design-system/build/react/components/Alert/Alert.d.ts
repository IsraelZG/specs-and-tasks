import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare const alertVariants: (props?: ({
    intent?: "danger" | "info" | "success" | "warning" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
    title?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
}
declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
export { Alert, alertVariants };
