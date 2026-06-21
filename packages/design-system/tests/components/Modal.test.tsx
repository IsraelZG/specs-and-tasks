import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../src';

// Modal only wires up the Escape-to-close listener once its mount/enter
// animation has flipped `visible` to true (one requestAnimationFrame after
// mount) — flush that frame before exercising the Escape key.
async function flushEnterAnimation() {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Settings">
        Body
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog with its title and content when open', () => {
    render(
      <Modal open onClose={() => {}} title="Settings">
        Body content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Settings')).toBeVisible();
    expect(screen.getByText('Body content')).toBeVisible();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings">
        Body
      </Modal>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape when dismissible (the default)', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings">
        Body
      </Modal>
    );
    await flushEnterAnimation();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape when dismissible={false}', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Settings" dismissible={false}>
        Body
      </Modal>
    );
    await flushEnterAnimation();
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    // Non-dismissible modals also hide the close button.
    expect(screen.queryByRole('button', { name: 'Close dialog' })).not.toBeInTheDocument();
  });
});
