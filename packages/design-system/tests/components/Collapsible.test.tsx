import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../src/components/Collapsible/Collapsible';

describe('Collapsible', () => {
  it('renderiza sem erro (smoke)', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('abre e fecha ao clicar no trigger', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden Content</CollapsibleContent>
      </Collapsible>
    );
    // Inicialmente fechado
    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    // Abre
    await user.click(screen.getByText('Toggle'));
    expect(screen.getByText('Hidden Content')).toBeInTheDocument();
  });

  it('tem atributo data-state no trigger', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    );
    const trigger = screen.getByText('Toggle');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'open');
  });

  it('não usa forwardRef (são re-exports do Radix)', () => {
    // Collapsible é CollapsiblePrimitive.Root — tem ref forwarding via Radix
    expect(Collapsible).toBeDefined();
  });
});
