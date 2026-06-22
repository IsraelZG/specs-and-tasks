import * as React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@plataforma/design-system';
import { SectionWrapper, Subsection } from '../ui/SectionWrapper';

export default function ResizableSection() {
  return (
    <SectionWrapper
      id="resizable"
      title="Resizable"
      overline="Component"
      description="A layout system of panels that can be dynamically resized by dragging a divider."
    >
      <Subsection title="Interactive Demo" stack>
        <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-[color:var(--ds-theme-border-subtle)] bg-[color:var(--ds-theme-surface-subdued)]/10">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel className="bg-[color:var(--ds-theme-surface-default)]">
              <div className="flex h-full items-center justify-center font-medium">Sidebar Panel</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel className="bg-[color:var(--ds-theme-surface-default)]">
              <div className="flex h-full items-center justify-center font-medium">Main Panel Content</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Subsection>
    </SectionWrapper>
  );
}
