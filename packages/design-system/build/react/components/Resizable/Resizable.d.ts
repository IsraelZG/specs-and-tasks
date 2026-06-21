import * as React from 'react';
export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    direction?: 'horizontal' | 'vertical';
}
export declare function ResizablePanelGroup({ direction, className, children, ...props }: ResizablePanelGroupProps): React.JSX.Element;
export declare function ResizablePanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export declare function ResizableHandle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
