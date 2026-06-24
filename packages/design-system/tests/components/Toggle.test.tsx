import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../../src/components/Toggle/Toggle';

describe('Toggle', () => {
  it('renderiza sem erro (smoke)', () => {
    render(<Toggle>Bold</Toggle>);
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('dispara onPressedChange ao clicar', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('disabled previne interação', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle disabled onPressedChange={onPressedChange}>Bold</Toggle>);
    await user.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
  });

  it('tem role button e aria-pressed', () => {
    render(<Toggle>Bold</Toggle>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Toggle ref={ref}>Bold</Toggle>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
