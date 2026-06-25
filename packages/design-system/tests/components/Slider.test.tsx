import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '../../src/components/Slider/Slider';

beforeAll(() => {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});
describe('Slider', () => {
  it('renderiza sem erro (smoke)', () => {
    const { container } = render(<Slider defaultValue={[50]} max={100} />);
    expect(container.querySelector('[role="slider"]')).toBeInTheDocument();
  });

  it('dispara onValueChange ao interagir', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider defaultValue={[50]} max={100} onValueChange={onValueChange} />);
    const slider = screen.getByRole('slider');
    // ArrowRight incrementa o valor
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalled();
  });

  it('disabled previne interação', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider defaultValue={[50]} max={100} disabled onValueChange={onValueChange} />);
    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('tem role slider com aria-valuenow', () => {
    render(<Slider defaultValue={[50]} max={100} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Slider ref={ref} defaultValue={[50]} max={100} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
