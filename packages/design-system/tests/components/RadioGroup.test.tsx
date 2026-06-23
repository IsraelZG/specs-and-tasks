import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from '../../src/components/RadioGroup/RadioGroup';

describe('RadioGroup', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
      </RadioGroup>
    );
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('dispara onValueChange ao selecionar um item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={onValueChange}>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
    );
    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('disabled impede interação', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup disabled onValueChange={onValueChange}>
        <RadioGroupItem value="a" />
        <RadioGroupItem value="b" />
      </RadioGroup>
    );
    const radios = screen.getAllByRole('radio');
    await user.click(radios[1]);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('tem role radiogroup', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" />
      </RadioGroup>
    );
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <RadioGroup ref={ref}>
        <RadioGroupItem value="a" />
      </RadioGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
