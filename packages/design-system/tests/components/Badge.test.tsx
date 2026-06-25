import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../src/components/Badge/Badge';

describe('Badge', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(<Badge>Ativo</Badge>);
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('aplica variantes de intent sem quebrar', () => {
    const { rerender } = render(<Badge intent="success">OK</Badge>);
    expect(screen.getByText('OK')).toBeInTheDocument();
    rerender(<Badge intent="danger">Erro</Badge>);
    expect(screen.getByText('Erro')).toBeInTheDocument();
    rerender(<Badge intent="warning">Alerta</Badge>);
    expect(screen.getByText('Alerta')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Teste</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
