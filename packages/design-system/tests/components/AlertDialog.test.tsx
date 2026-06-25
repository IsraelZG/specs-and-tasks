import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../src/components/AlertDialog/AlertDialog';

describe('AlertDialog', () => {
  it('não renderiza o conteúdo quando fechado (smoke fechado)', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Confirmar</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza?</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('abre ao clicar no trigger e renderiza com role alertdialog', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Remover</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Remover item?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Remover'));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeVisible();
    expect(screen.getByText('Remover item?')).toBeVisible();
    expect(screen.getByText('Esta ação é irreversível.')).toBeVisible();
  });

  it('chama onSelect do AlertDialogAction ao clicar em Confirmar', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Remover</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Remover item?</AlertDialogTitle>
          <AlertDialogDescription>Tem certeza?</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Remover'));
    await user.click(screen.getByText('Confirmar'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('fecha ao clicar no Cancelar', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Abrir</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Título</AlertDialogTitle>
          <AlertDialogDescription>Descrição</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    await user.click(screen.getByText('Abrir'));
    expect(screen.getByRole('alertdialog')).toBeVisible();

    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
