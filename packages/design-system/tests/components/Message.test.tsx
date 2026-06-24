import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from '../../src/components/Message/Message';

describe('Message', () => {
  it('renderiza sem erro com props obrigatórias (smoke)', () => {
    render(<Message author="received">Olá</Message>);
    expect(screen.getByText('Olá')).toBeInTheDocument();
  });

  it('renderiza com author="sent" sem role específico (div)', () => {
    render(<Message author="sent">Oi</Message>);
    expect(screen.getByText('Oi')).toBeInTheDocument();
  });

  it('mensagem system tem role="status"', () => {
    render(<Message author="system">Evento</Message>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Evento')).toBeInTheDocument();
  });

  it('exibe timestamp quando fornecido', () => {
    render(<Message author="received" timestamp="14:30">Mensagem</Message>);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Message ref={ref} author="received">Teste</Message>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
