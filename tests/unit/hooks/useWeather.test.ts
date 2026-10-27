import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';
import { useWeather } from '../../../src/hooks/useWeather';

vi.mock('../../../src/services/weatherService', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../src/services/weatherService')>();
  return { ...actual, getWeather: vi.fn(), searchCities: vi.fn() };
});

const cityA: City = { name: 'São Paulo', latitude: -23.55, longitude: -46.63 };
const cityB: City = { name: 'Rio de Janeiro', latitude: -22.91, longitude: -43.2 };
const weatherFor = (city: City) => ({ city }) as WeatherData;

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts idle and searches cities before loading the first city weather', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe('idle');
    expect(result.current.cities).toEqual([]);
    expect(result.current).not.toHaveProperty('data');
    expect(result.current).not.toHaveProperty('message');

    let searchPromise: Promise<void>;
    act(() => {
      searchPromise = result.current.search('São Paulo');
    });

    expect(result.current.status).toBe('loading');
    await act(async () => searchPromise);

    expect(searchCities).toHaveBeenCalledExactlyOnceWith('São Paulo');
    expect(getWeather).toHaveBeenCalledExactlyOnceWith(cityA);
    expect(result.current).toMatchObject({
      status: 'success',
      data: weatherFor(cityA),
      cities: [cityA, cityB],
    });
  });

  it('returns to idle without searching for a blank query', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('   ');
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.cities).toEqual([]);
    expect(result.current).not.toHaveProperty('data');
    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('sets empty and does not request weather when no city matches', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Atlantis');
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.cities).toEqual([]);
    expect(result.current).not.toHaveProperty('data');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('keeps search results available when loading their weather fails', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather).mockRejectedValue(
      new WeatherServiceError('Falha de rede.', 'network'),
    );
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('São Paulo');
    });

    expect(result.current).toMatchObject({
      status: 'error',
      cities: [cityA, cityB],
      kind: 'network',
      message:
        'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
    });
  });

  it('exposes search errors and retries the last search', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.', 'network'))
      .mockResolvedValueOnce([cityA]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('São Paulo');
    });

    expect(result.current).toMatchObject({
      status: 'error',
      kind: 'network',
      message:
        'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
    });

    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(result.current.status).toBe('success');
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityA) });
  });

  it('selects a city, loads its weather, and retries the selection on failure', async () => {
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.', 'network'))
      .mockResolvedValueOnce(weatherFor(cityB));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(cityB);
    });

    expect(result.current).toMatchObject({
      status: 'error',
      kind: 'network',
      message:
        'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
    });
    expect(getWeather).toHaveBeenLastCalledWith(cityB);

    await act(async () => {
      await result.current.retry();
    });

    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getWeather).toHaveBeenNthCalledWith(2, cityB);
    expect(searchCities).not.toHaveBeenCalled();
    expect(result.current.status).toBe('success');
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityB) });
  });

  it('ignores a stale weather response after a newer city selection', async () => {
    let resolveA: (weather: WeatherData) => void = () => {};
    let resolveB: (weather: WeatherData) => void = () => {};
    vi.mocked(getWeather)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveA = resolve)))
      .mockImplementationOnce(() => new Promise((resolve) => (resolveB = resolve)));
    const { result } = renderHook(() => useWeather());

    act(() => {
      void result.current.selectCity(cityA);
      void result.current.selectCity(cityB);
    });

    await act(async () => {
      resolveB(weatherFor(cityB));
    });
    await waitFor(() =>
      expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityB) }),
    );

    await act(async () => {
      resolveA(weatherFor(cityA));
    });

    expect(result.current.status).toBe('success');
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityB) });
  });

  it('clears weather data when a later search has no results', async () => {
    vi.mocked(searchCities).mockResolvedValueOnce([cityA]).mockResolvedValueOnce([]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityA) });

    await act(async () => result.current.search('Atlantis'));

    expect(result.current).toMatchObject({ status: 'empty', cities: [] });
    expect(result.current).not.toHaveProperty('data');
  });

  it('hides old weather immediately when starting a new search', async () => {
    let resolveSearch: (cities: City[]) => void = () => {};
    vi.mocked(searchCities)
      .mockResolvedValueOnce([cityA])
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSearch = resolve)));
    vi.mocked(getWeather).mockResolvedValue(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    act(() => {
      void result.current.search('Rio de Janeiro');
    });

    expect(result.current.status).toBe('loading');
    expect(result.current).not.toHaveProperty('data');
    await act(async () => resolveSearch([]));
    expect(result.current.status).toBe('empty');
  });

  it('uses a generic message for unexpected failures', async () => {
    vi.mocked(searchCities).mockRejectedValueOnce(new Error('Internal detail'));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));

    expect(result.current).toMatchObject({
      status: 'error',
      kind: 'unknown',
      message: 'Não foi possível consultar os dados meteorológicos. Tente novamente.',
    });
  });

  it.each([
    ['timeout', 'A consulta demorou mais de 10 segundos. Tente novamente.'],
    ['api', 'O serviço de clima está indisponível no momento. Tente novamente em instantes.'],
    [
      'invalid-response',
      'Não foi possível ler os dados enviados pelo serviço de clima. Tente novamente.',
    ],
  ] as const)('expõe uma mensagem amigável para %s sem detalhes internos', async (kind, message) => {
    vi.mocked(searchCities).mockRejectedValueOnce(
      new WeatherServiceError('Internal provider detail', kind),
    );
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));

    expect(result.current).toMatchObject({ status: 'error', kind, message });
    expect(result.current).not.toHaveProperty('data');
  });

  it('refaz a busca completa quando o forecast da primeira cidade falha', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new WeatherServiceError('Offline', 'network'))
      .mockResolvedValueOnce(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    await act(async () => result.current.retry());

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenNthCalledWith(2, 'São Paulo');
    expect(getWeather).toHaveBeenNthCalledWith(2, cityA);
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityA) });
  });

  it('ignora uma falha obsoleta e retry mantém a seleção mais recente', async () => {
    let rejectA: (error: Error) => void = () => {};
    vi.mocked(getWeather)
      .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectA = reject)))
      .mockRejectedValueOnce(new WeatherServiceError('Offline', 'network'))
      .mockResolvedValueOnce(weatherFor(cityB));
    const { result } = renderHook(() => useWeather());
    let pendingA: Promise<void>;

    act(() => {
      pendingA = result.current.selectCity(cityA);
    });
    await act(async () => result.current.selectCity(cityB));
    await act(async () => {
      rejectA(new WeatherServiceError('Late timeout', 'timeout'));
      await pendingA;
    });

    expect(result.current).toMatchObject({ status: 'error', kind: 'network' });
    await act(async () => result.current.retry());
    expect(getWeather).toHaveBeenLastCalledWith(cityB);
    expect(result.current).toMatchObject({ status: 'success', data: weatherFor(cityB) });
  });
});
