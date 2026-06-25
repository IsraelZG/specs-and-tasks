import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from '../../src/components/ScrollArea/ScrollArea';

describe('ScrollArea', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(
      <ScrollArea className="h-40">
        <div>Conteúdo rolável</div>
      </ScrollArea>
    );
    expect(screen.getByText('Conteúdo rolável')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <ScrollArea ref={ref} className="h-40">
        <div>Conteúdo</div>
      </ScrollArea>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
