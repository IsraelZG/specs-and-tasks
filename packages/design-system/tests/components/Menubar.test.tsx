import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
} from '../../src/components/Menubar/Menubar';

describe('Menubar', () => {
  it('renderiza a barra de menu (smoke)', () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    expect(screen.getByText('Arquivo')).toBeInTheDocument();
  });

  it('não renderiza conteúdo do menu quando fechado', () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    expect(screen.queryByText('Novo')).not.toBeInTheDocument();
  });

  it('abre o menu ao clicar no trigger', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    await user.click(screen.getByText('Arquivo'));
    expect(screen.getByText('Novo')).toBeVisible();
    expect(screen.getByText('Abrir')).toBeVisible();
  });

  it('MenubarItem forwardRef chega ao nó DOM após abrir o menu', async () => {
    const ref = { current: null };
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem ref={ref}>Novo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    await user.click(screen.getByText('Arquivo'));
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('MenubarSeparator renderiza separador após abrir o menu', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Sair</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    await user.click(screen.getByText('Arquivo'));
    const separator = document.querySelector('[role="separator"]');
    expect(separator).toBeInTheDocument();
  });

  it('MenubarShortcut renderiza após abrir o menu', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Novo <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    await user.click(screen.getByText('Arquivo'));
    expect(screen.getByText('⌘N')).toBeInTheDocument();
  });

  it('MenubarTrigger forwardRef chega ao nó DOM', () => {
    const ref = { current: null };
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger ref={ref}>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
