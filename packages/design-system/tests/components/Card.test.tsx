import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../../src/components/Card/Card';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('Card', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(<Card>Conteúdo</Card>);
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });

  it('renderiza como div por padrão', () => {
    const { container } = render(<Card>Card</Card>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renderiza como button quando as="button"', () => {
    render(<Card as="button" onClick={() => {}}>Botão</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Card</Card>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
