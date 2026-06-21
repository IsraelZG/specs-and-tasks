import * as React from 'react';
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'fullscreen';
    title?: string;
    dismissible?: boolean;
    className?: string;
}
declare const Modal: React.FC<ModalProps>;
export { Modal };
