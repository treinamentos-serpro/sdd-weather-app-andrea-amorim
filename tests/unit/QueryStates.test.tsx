import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it('anuncia o carregamento sem controles interativos', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('deixa de apresentar carregamento quando substituído pelo erro', () => {
    const { rerender } = render(<LoadingState />);
    rerender(<ErrorState message="Verifique sua conexão." onRetry={vi.fn()} />);
    expect(screen.queryByText('Carregando dados meteorológicos...')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Verifique sua conexão.');
  });

  it('deixa de apresentar carregamento quando a consulta termina', () => {
    const { rerender } = render(<LoadingState />);
    rerender(<p>Dados disponíveis.</p>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Dados disponíveis.')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('exibe mensagem de erro distinta do estado vazio', () => {
    render(
      <ErrorState message="O serviço está indisponível. Tente novamente." onRetry={vi.fn()} />,
    );
    const alert = screen.getByRole('alert', { name: 'Não foi possível consultar os dados' });
    expect(alert).toHaveTextContent('O serviço está indisponível. Tente novamente.');
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('chama onRetry uma vez por clique', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Verifique sua conexão." onRetry={onRetry} />);
    expect(onRetry).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(['{Enter}', ' '])('permite nova tentativa por teclado com %j', async (key) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Verifique sua conexão." onRetry={onRetry} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard(key);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it('não submete um formulário ao tentar novamente', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    const onRetry = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <ErrorState message="Verifique sua conexão." onRetry={onRetry} />
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onRetry).toHaveBeenCalledExactlyOnceWith();
  });
});

describe('EmptyState', () => {
  it('apresenta título e dica sem anunciar erro', () => {
    render(<EmptyState />);
    const status = screen.getByRole('status', { name: 'Nenhuma cidade encontrada' });
    expect(within(status).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Nenhuma cidade encontrada',
    );
    expect(status).toHaveTextContent(
      'Verifique o nome da cidade ou tente buscar outra localização.',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('permite personalizar título e dica para o contexto de uso', () => {
    render(<EmptyState title="Busque uma cidade" hint="Digite o nome da cidade para começar." />);
    expect(screen.getByRole('status', { name: 'Busque uma cidade' })).toHaveTextContent(
      'Digite o nome da cidade para começar.',
    );
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
  });
});
