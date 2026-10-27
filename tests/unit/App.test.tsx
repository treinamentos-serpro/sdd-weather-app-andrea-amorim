import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { getWeather, searchCities } from '../../src/services/weatherService';
import { mockWeatherData } from '../../src/mocks/weather';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
});

const cityA: City = {
  id: 1,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  country: 'Brasil',
  region: 'São Paulo',
};
const cityB: City = {
  id: 2,
  name: 'Rio de Janeiro',
  latitude: -22.91,
  longitude: -43.2,
  country: 'Brasil',
  region: 'Rio de Janeiro',
};
const weatherForCityB: WeatherData = {
  ...mockWeatherData,
  city: cityB,
  current: { ...mockWeatherData.current, temperatureC: 0, apparentTemperatureC: 100 },
};

async function submitSearch(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), name);
  await user.keyboard('{Enter}');
}

describe('App', () => {
  it('renderiza a busca, a unidade inicial e a orientação no estado idle', () => {
    render(<App />);

    expect(screen.getByRole('banner')).toHaveTextContent('WeatherView');
    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C — Celsius', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('renderiza loading enquanto a busca de cidades está pendente', async () => {
    let resolveSearch: (cities: City[]) => void = () => {};
    vi.mocked(searchCities).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await submitSearch('São Paulo');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando dados meteorológicos...');
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.queryByLabelText('Temperatura atual')).not.toBeInTheDocument();

    await act(async () => {
      resolveSearch([cityA]);
    });

    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
  });

  it('busca e apresenta as cidades e o clima da primeira opção', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await submitSearch('São Paulo');

    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cidades encontradas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rio de Janeiro, Rio de Janeiro, Brasil' })).toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('26 °C');
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(cityA);
  });

  it('apresenta o estado empty quando a busca não encontra cidades', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    render(<App />);

    await submitSearch('Atlantis');

    expect(await screen.findByRole('status', { name: 'Nenhuma cidade encontrada' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('apresenta erro e ErrorState refaz a última operação', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new Error('Falha simulada na consulta.'))
      .mockResolvedValueOnce([cityA]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await submitSearch('São Paulo');

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha simulada na consulta.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('seleciona outra cidade e apresenta seus dados meteorológicos', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather)
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce(weatherForCityB);
    render(<App />);

    await submitSearch('Rio');
    await userEvent.setup().click(
      await screen.findByRole('button', { name: 'Rio de Janeiro, Rio de Janeiro, Brasil' }),
    );

    expect(await screen.findByRole('region', { name: 'Rio de Janeiro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('0 °C');
    expect(getWeather).toHaveBeenLastCalledWith(cityB);
  });

  it('mantém a unidade como estado da interface sem repetir consultas ao alterná-la', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA]);
    vi.mocked(getWeather).mockResolvedValue(mockWeatherData);
    render(<App />);

    await submitSearch('São Paulo');
    expect(await screen.findByLabelText('Temperatura atual')).toHaveTextContent('26 °C');

    const user = userEvent.setup();
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
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(cityA);
    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
  });

  it('não muda de estado ao tentar enviar um termo vazio', async () => {
    render(<App />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade para buscar.');
    expect(screen.getByRole('main')).toHaveTextContent('Consulte o clima de uma cidade');
    expect(searchCities).not.toHaveBeenCalled();
  });
});
