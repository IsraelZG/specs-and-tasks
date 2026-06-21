import * as React from 'react';
export interface CommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    className?: string;
}
export declare function CommandDialog({ open, onOpenChange, children, className }: CommandProps): React.JSX.Element;
export interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onValueChange?: (val: string) => void;
}
export declare const CommandInput: React.ForwardRefExoticComponent<CommandInputProps & React.RefAttributes<HTMLInputElement>>;
export declare function CommandList({ children, className }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function CommandGroup({ heading, children, className, }: React.HTMLAttributes<HTMLDivElement> & {
    heading: string;
}): React.JSX.Element;
export interface CommandItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onSelect?: () => void;
}
export declare const CommandItem: React.ForwardRefExoticComponent<CommandItemProps & React.RefAttributes<HTMLButtonElement>>;
export declare function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element;
export declare namespace CommandShortcut {
    var displayName: string;
}
