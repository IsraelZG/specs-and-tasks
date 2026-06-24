import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavItem } from '../../src/components/NavItem/NavItem';

describe('NavItem', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(<NavItem href="/">Dashboard</NavItem>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renderiza como link (<a>) por padrão', () => {
    render(<NavItem href="/home">Home</NavItem>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/home');
  });

  it('renderiza como button quando as="button"', () => {
    render(<NavItem as="button" onClick={() => {}}>Ação</NavItem>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('tem aria-current="page" quando active', () => {
    render(<NavItem href="/" active>Ativo</NavItem>);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'page');
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(<NavItem ref={ref} href="/">Ref</NavItem>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
