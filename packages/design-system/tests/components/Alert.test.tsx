import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert } from '../../src/components/Alert/Alert';

describe('Alert', () => {
  it('renderiza sem erro com props mínimas (smoke)', () => {
    render(<Alert>Mensagem</Alert>);
    expect(screen.getByText('Mensagem')).toBeInTheDocument();
  });

  it('tem role="status" para intents info/success (padrão)', () => {
    render(<Alert>Info</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('tem role="alert" para intents danger/warning', () => {
    render(<Alert intent="danger">Erro</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renderiza title quando fornecido', () => {
    render(<Alert title="Título">Corpo</Alert>);
    expect(screen.getByText('Título')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Alert ref={ref}>Mensagem</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
