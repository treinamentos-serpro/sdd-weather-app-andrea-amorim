import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function demoButton(name: string) {
  return within(screen.getByRole('group', { name: 'Estado da demonstração' })).getByRole('button', {
    name,
  });
}

describe('App com dados mock', () => {
  it('monta header, busca, unidade inicial e orientação no estado idle', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('WeatherView');
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C — Celsius', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
    expect(demoButton('Inicial')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('complementary')).toHaveTextContent('não o clima de hoje');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('busca exibe o mock identificado como São Paulo, sem renomear os dados pela entrada', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife{Enter}');

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('26 °C');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(demoButton('Sucesso')).toHaveAttribute('aria-pressed', 'true');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('não muda de estado ao buscar um termo vazio', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), '   ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade para buscar.');
    expect(demoButton('Inicial')).toHaveAttribute('aria-pressed', 'true');
  });

  it('converte todas as temperaturas sem requests ou mutação dos dados canônicos', async () => {
    const user = userEvent.setup();
    const originalData = structuredClone(mockWeatherData);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<App />);
    await user.click(demoButton('Sucesso'));
    await user.click(screen.getByRole('button', { name: '°F — Fahrenheit' }));

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('78,8 °F');
    expect(screen.getByText('Sensação térmica: 82,4 °F')).toBeInTheDocument();
    expect(
      screen.getAllByRole('article').map((card) =>
        within(card)
          .getAllByRole('definition')
          .slice(0, 2)
          .map((value) => value.textContent),
      ),
    ).toEqual([
      ['82,4 °F', '64,4 °F'],
      ['84,2 °F', '66,2 °F'],
      ['80,6 °F', '68 °F'],
      ['73,4 °F', '62,6 °F'],
      ['77 °F', '60,8 °F'],
    ]);

    await user.click(screen.getByRole('button', { name: '°C — Celsius' }));
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('26 °C');
    expect(screen.getByText('Sensação térmica: 28 °C')).toBeInTheDocument();
    expect(mockWeatherData).toEqual(originalData);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('retira dados anteriores durante loading e permite sair pelo painel', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(demoButton('Sucesso'));
    await user.click(demoButton('Carregando'));

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    await user.click(demoButton('Sucesso'));
    expect(screen.queryByText('Carregando dados meteorológicos...')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeEnabled();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('distingue empty de error e permite tentar novamente preservando a unidade', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '°F — Fahrenheit' }));
    await user.click(demoButton('Sem resultados'));
    expect(screen.getByRole('main')).toHaveTextContent('Nenhuma cidade encontrada');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(demoButton('Erro'));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha simulada na consulta.');
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(screen.getByRole('main', { name: 'Previsão do tempo' })).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('78,8 °F');
    expect(screen.getAllByRole('article')).toHaveLength(5);

    await user.click(demoButton('Inicial'));
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '°F — Fahrenheit', pressed: true }),
    ).toBeInTheDocument();
  });
});
