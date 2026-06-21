import * as React from 'react';
export type Author = 'sent' | 'received' | 'ai' | 'system';
export type Status = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type Density = 'cozy' | 'compact';
export interface MessageProps {
    children: React.ReactNode;
    author: Author;
    timestamp?: Date | string;
    status?: Status;
    density?: Density;
    reactions?: React.ReactNode;
    isEditing?: boolean;
    className?: string;
}
declare const Message: React.ForwardRefExoticComponent<MessageProps & React.RefAttributes<HTMLDivElement>>;
export { Message };
