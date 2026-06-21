import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

export function ResizablePanelGroup({
  direction = 'horizontal',
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const [leftWidth, setLeftWidth] = React.useState(50);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleDrag = (e: PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (direction === 'horizontal') {
      const offset = e.clientX - rect.left;
      const percentage = (offset / rect.width) * 100;
      setLeftWidth(Math.max(10, Math.min(90, percentage)));
    } else {
      const offset = e.clientY - rect.top;
      const percentage = (offset / rect.height) * 100;
      setLeftWidth(Math.max(10, Math.min(90, percentage)));
    }
  };

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const handlePointerMove = (moveEvent: PointerEvent) => {
      handleDrag(moveEvent);
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const childrenArray = React.Children.toArray(children);
  const leftPanel = childrenArray[0];
  const resizeHandle = childrenArray[1];
  const rightPanel = childrenArray[2];

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex w-full h-full overflow-hidden border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-default)] rounded-xl select-none',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
      {...props}
    >
      {leftPanel && (
        <div style={{ [direction === 'horizontal' ? 'width' : 'height']: `${String(leftWidth)}%` }}>
          {leftPanel}
        </div>
      )}
      {resizeHandle && (
        <div onPointerDown={startResize} className="h-full">
          {resizeHandle}
        </div>
      )}
      {rightPanel && (
        <div className="flex-1">
          {rightPanel}
        </div>
      )}
    </div>
  );
}

export function ResizablePanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('h-full w-full overflow-auto p-6 bg-[color:var(--ds-theme-surface-default)] text-[color:var(--ds-theme-content-default)]', className)}
      {...props}
    />
  );
}

export function ResizableHandle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-1.5 h-full cursor-col-resize hover:bg-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-border-subtle)]/40 transition-colors flex items-center justify-center relative active:bg-[color:var(--ds-theme-content-default)]',
        className
      )}
      {...props}
    />
  );
}
