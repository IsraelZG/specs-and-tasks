import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from '../../src/components/Separator/Separator';

describe('Separator', () => {
  it('renderiza sem erro (smoke)', () => {
    const { container } = render(<Separator />);
    expect(container.querySelector('[role="none"]')).toBeInTheDocument();
  });

  it('tem role="separator" quando decorative=false', () => {
    render(<Separator decorative={false} />);
    const sep = screen.getByRole('separator');
    // Radix usa data-orientation, não aria-orientation
    expect(sep).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Separator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
