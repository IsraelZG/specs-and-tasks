import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Checkbox } from '../../src';

describe('Checkbox', () => {
  it('fires onChange with the new checked value when toggled', async () => {
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange}>Accept terms</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
    await userEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not fire onChange when disabled', async () => {
    const onChange = vi.fn();
    render(
      <Checkbox onChange={onChange} disabled>
        Accept terms
      </Checkbox>
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Accept terms' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets the indeterminate DOM property (not exposed as an HTML attribute)', () => {
    render(<Checkbox indeterminate>Accept terms</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  // Regression test: the indeterminate effect reads a real DOM ref internally
  // (see Checkbox.tsx) and must keep forwarding to *both* ref shapes a caller
  // might pass — a plain callback ref...
  it('forwards a callback ref to the real <input> element', () => {
    let node: HTMLInputElement | null = null;
    render(
      <Checkbox
        ref={(el) => {
          node = el;
        }}
      >
        Accept terms
      </Checkbox>
    );
    expect(node).toBeInstanceOf(HTMLInputElement);
  });

  // ...and a ref object created with useRef.
  it('forwards a ref object to the real <input> element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>Accept terms</Checkbox>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
