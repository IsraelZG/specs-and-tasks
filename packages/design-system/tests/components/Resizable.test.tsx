import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../src/components/Resizable/Resizable';

describe('ResizablePanelGroup', () => {
  it('renderiza sem erro com painéis (smoke)', () => {
    const { container } = render(
      <ResizablePanelGroup>
        <ResizablePanel>Esquerda</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Direita</ResizablePanel>
      </ResizablePanelGroup>
    );
    expect(container.textContent).toContain('Esquerda');
    expect(container.textContent).toContain('Direita');
  });

  it('aceita direction="vertical"', () => {
    const { container } = render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel>Topo</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Base</ResizablePanel>
      </ResizablePanelGroup>
    );
    expect(container.textContent).toContain('Topo');
  });
});
