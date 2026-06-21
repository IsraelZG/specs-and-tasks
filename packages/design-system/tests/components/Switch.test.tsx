import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../../src';

describe('Switch', () => {
  it('renders unchecked by default', () => {
    render(<Switch aria-label="Notifications" />);
    expect(screen.getByRole('switch', { name: 'Notifications' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
  });

  it('toggles aria-checked and calls onCheckedChange when clicked', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />);
    const switchEl = screen.getByRole('switch', { name: 'Notifications' });

    await userEvent.click(switchEl);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(switchEl).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Notifications" disabled onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
