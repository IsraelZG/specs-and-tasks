import * as React from 'react';
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    intent?: 'info' | 'success' | 'warning' | 'danger';
    placement?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
    duration?: number | null;
    action?: React.ReactNode;
    onDismiss?: () => void;
    showClose?: boolean;
    icon?: React.ReactNode;
}
declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
export { Toast };
