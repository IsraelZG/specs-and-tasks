import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../../src/components/Avatar/Avatar';

describe('Avatar', () => {
  it('renderiza sem erro com props mínimas (smoke)', () => {
    render(<Avatar />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renderiza fallback (iniciais) quando src não é fornecido', () => {
    render(<Avatar fallback="JD" alt="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('tem role="img" com aria-label quando alt é fornecido', () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'John Doe');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Avatar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
