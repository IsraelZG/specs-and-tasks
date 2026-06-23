import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
} from '../../src/components/DropdownMenu/DropdownMenu';

describe('DropdownMenu', () => {
  it('não renderiza o conteúdo quando fechado (smoke fechado)', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Abrir</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('abre ao clicar no trigger e renderiza itens do menu', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Opções</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuItem>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    await user.click(screen.getByText('Opções'));
    const menu = screen.getByRole('menu');
    expect(menu).toBeVisible();
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('DropdownMenuItem forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem ref={ref}>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('DropdownMenuItem com inset tem padding extra à esquerda', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem inset>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByText('Item').closest('[role="menuitem"]');
    expect(item).toBeInTheDocument();
  });

  it('DropdownMenuCheckboxItem renderiza com checked visual', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Ativo</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const checkboxItem = screen.getByRole('menuitemcheckbox');
    expect(checkboxItem).toHaveAttribute('data-state', 'checked');
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('DropdownMenuRadioGroup com DropdownMenuRadioItem funciona', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">Opção A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">Opção B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText('Opção A')).toBeInTheDocument();
    expect(screen.getByText('Opção B')).toBeInTheDocument();
  });

  it('DropdownMenuSeparator renderiza elemento hr', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Topo</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Base</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const separator = document.querySelector('[role="separator"]');
    expect(separator).toBeInTheDocument();
  });

  it('DropdownMenuLabel renderiza label', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Agrupamento</DropdownMenuLabel>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText('Agrupamento')).toBeInTheDocument();
  });

  it('DropdownMenuShortcut renderiza atalho', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            Copiar <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByText('⌘C')).toBeInTheDocument();
  });
});
