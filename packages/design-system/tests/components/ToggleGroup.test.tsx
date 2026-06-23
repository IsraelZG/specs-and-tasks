import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup, ToggleGroupItem } from '../../src/components/ToggleGroup/ToggleGroup';

describe('ToggleGroup', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('dispara onValueChange ao clicar em um item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    );
    const items = screen.getAllByRole('radio');
    await user.click(items[1]);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('disabled previne interação', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="single" disabled onValueChange={onValueChange}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>
    );
    await user.click(screen.getByRole('radio'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('itens têm role radio (ToggleGroup usa RadioGroup do Radix)', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <ToggleGroup type="single" ref={ref}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
