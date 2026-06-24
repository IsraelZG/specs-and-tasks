import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InputOTP } from '../../src/components/InputOTP/InputOTP';

describe('InputOTP', () => {
  it('renderiza sem erro (smoke)', () => {
    render(<InputOTP value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(6);
  });

  it('dispara onChange ao digitar um dígito', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputOTP value="" onChange={onChange} maxLength={6} />);
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('avança para próximo input ao digitar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputOTP value="" onChange={onChange} maxLength={6} />);
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');
    // O segundo input deve ter foco
    expect(document.activeElement).toBe(inputs[1]);
  });

  it('aceita apenas dígitos', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InputOTP value="" onChange={onChange} maxLength={6} />);
    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], 'a');
    // onChange não deve ser chamado com letras
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<InputOTP ref={ref} value="" onChange={() => {}} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
