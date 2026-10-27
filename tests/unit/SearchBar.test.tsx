import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

afterEach(cleanup);

describe('SearchBar', () => {
  it('oferece região de busca, campo com label e botão acessíveis', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
    expect(screen.getByLabelText('Cidade')).toBe(screen.getByRole('searchbox'));
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
  });

  it('envia a cidade uma vez pelo botão, removendo espaços nas extremidades', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), '  São Paulo  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
  });

  it('permite buscar pelo teclado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.tab();
    expect(screen.getByRole('searchbox')).toHaveFocus();
    await user.keyboard('São Paulo{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
  });

  it.each(["  São João d'Aliança  ", 'A&B + C/#?=100%', '  München 東京  '])(
    'preserva os caracteres especiais de %j ao remover apenas espaços externos',
    async (value) => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<SearchBar onSearch={onSearch} />);

      await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), value);
      await user.click(screen.getByRole('button', { name: 'Buscar' }));

      expect(onSearch).toHaveBeenCalledExactlyOnceWith(value.trim());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );

  it.each(['', '   '])('não busca com entrada %j e apresenta orientação', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');
    if (value) await user.type(input, value);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade para buscar.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Informe uma cidade para buscar.');
  });

  it('limpa a orientação ao editar e permite uma nova busca válida', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await user.type(screen.getByRole('searchbox'), 'Recife');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'false');
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });

  it('desabilita os controles e bloqueia envio mesmo com uma cidade preenchida', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox'), 'Curitiba');

    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();

    rerender(<SearchBar onSearch={onSearch} disabled={false} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Curitiba');
  });

  it('associa labels distintos quando há mais de uma instância', () => {
    render(
      <>
        <SearchBar onSearch={vi.fn()} />
        <SearchBar onSearch={vi.fn()} />
      </>,
    );

    const inputs = screen.getAllByLabelText('Cidade');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
  });
});
