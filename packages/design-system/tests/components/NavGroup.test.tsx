import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavGroup } from '../../src/components/NavGroup/NavGroup';

describe('NavGroup', () => {
  it('renderiza sem erro com children (smoke)', () => {
    render(
      <NavGroup>
        <span>Item</span>
      </NavGroup>
    );
    expect(screen.getByText('Item')).toBeInTheDocument();
  });

  it('renderiza label quando fornecido', () => {
    render(
      <NavGroup label="Main">
        <span>Dashboard</span>
      </NavGroup>
    );
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <NavGroup ref={ref}>
        <span>Item</span>
      </NavGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
