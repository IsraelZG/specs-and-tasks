import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from '../../src/components/Label/Label';
import userEvent from '@testing-library/user-event';

describe('Label', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(<Label>Nome</Label>);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('renderiza como elemento <label>', () => {
    const { container } = render(<Label htmlFor="input-id">Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('renderiza asterisco quando required', () => {
    render(<Label required>Nome</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
