import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../../src/components/Skeleton/Skeleton';

describe('Skeleton', () => {
  it('renderiza sem erro (smoke)', () => {
    const { container } = render(<Skeleton className="h-4 w-40" />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('aceita className para dimensões', () => {
    const { container } = render(<Skeleton className="h-10 w-10 rounded-full" />);
    const el = container.querySelector('.animate-pulse');
    expect(el).toHaveClass('h-10');
    expect(el).toHaveClass('w-10');
    expect(el).toHaveClass('rounded-full');
  });
});
