import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../src/components/Select/Select';

describe('Select', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Pick')).toBeInTheDocument();
  });

  it('abre o content ao clicar no trigger', async () => {
    const user = userEvent.setup();
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    // Select do Radix renderiza via portal — buscar no document
    const option = await screen.findByRole('option', { name: 'Option A' });
    expect(option).toBeInTheDocument();
  });

  it('dispara onValueChange ao selecionar item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>
    );
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    const option = await screen.findByRole('option', { name: 'Option B' });
    await user.click(option);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('role combobox presente no trigger', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('forwardRef no Trigger chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
