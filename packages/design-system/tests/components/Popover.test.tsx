import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverTrigger, PopoverContent } from '../../src/components/Popover/Popover';

describe('Popover', () => {
  it('não renderiza o conteúdo quando fechado (smoke fechado)', () => {
    render(
      <Popover>
        <PopoverTrigger>Abrir</PopoverTrigger>
        <PopoverContent>Conteúdo</PopoverContent>
      </Popover>
    );
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument();
  });

  it('abre ao clicar no trigger e renderiza conteúdo com role dialog', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Configurações</PopoverTrigger>
        <PopoverContent>Painel de configurações</PopoverContent>
      </Popover>
    );

    await user.click(screen.getByText('Configurações'));
    // Popover usa Portal e role="dialog" (Radix default)
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(screen.getByText('Painel de configurações')).toBeInTheDocument();
  });

  it('PopoverContent forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent ref={ref}>Conteúdo</PopoverContent>
      </Popover>
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('PopoverContent é acessível via role="dialog"', () => {
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent aria-label="Configurações">Conteúdo</PopoverContent>
      </Popover>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
