import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../../src/components/Progress/Progress';

describe('Progress', () => {
  it('renderiza sem erro com value (smoke)', () => {
    render(<Progress value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('tem role="progressbar" refletindo o valor', () => {
    render(<Progress value={60} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    // Radix Progress seta aria-valuemax/aria-valuemin no Root e o value via style
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Progress ref={ref} value={30} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
