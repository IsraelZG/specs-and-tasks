import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../../src/components/Textarea/Textarea';

describe('Textarea', () => {
  it('renderiza sem erro (smoke)', () => {
    render(<Textarea placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('dispara onChange ao digitar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('disabled previne interação', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea disabled onChange={onChange} />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'hello');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('tem role textbox', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
