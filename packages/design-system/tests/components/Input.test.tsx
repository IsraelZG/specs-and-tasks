import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../src';

describe('Input', () => {
  it('renders the current value', () => {
    render(<Input value="hello" onChange={() => {}} aria-label="name" />);
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('hello');
  });

  it('calls onChange with each keystroke (controlled input)', async () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} aria-label="name" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'name' }), 'hi');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('marks itself invalid via aria-invalid', () => {
    render(<Input value="" onChange={() => {}} invalid aria-label="name" />);
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('respects the disabled prop', () => {
    render(<Input value="" onChange={() => {}} disabled aria-label="name" />);
    expect(screen.getByRole('textbox', { name: 'name' })).toBeDisabled();
  });

  it('forwards a ref to the underlying <input> element', () => {
    let node: HTMLInputElement | null = null;
    render(
      <Input
        value=""
        onChange={() => {}}
        aria-label="name"
        ref={(el) => {
          node = el;
        }}
      />
    );
    expect(node).toBeInstanceOf(HTMLInputElement);
  });
});
