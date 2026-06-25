import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../../src/components/Toast/Toast';

describe('Toast', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(<Toast duration={null}>Notificação</Toast>);
    expect(screen.getByText('Notificação')).toBeInTheDocument();
  });

  it('tem role="status" para intent info (padrão)', () => {
    render(<Toast duration={null}>Info</Toast>);
    // Toast inicialmente tem visible=false, role está presente mas invisível
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<Toast ref={ref} duration={null}>Ref</Toast>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
