import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities } from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';
import { useWeather } from '../../../src/hooks/useWeather';

vi.mock('../../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

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
    expect(result.current.data).toBeNull();
    expect(result.current.cities).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.query).toBe('');

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
      error: null,
      query: 'São Paulo',
    });
  });

  it('returns to idle without searching for a blank query', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('   ');
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.query).toBe('   ');
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
    expect(result.current.data).toBeNull();
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('keeps search results available when loading their weather fails', async () => {
    vi.mocked(searchCities).mockResolvedValue([cityA, cityB]);
    vi.mocked(getWeather).mockRejectedValue(new Error('Falha de rede.'));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('São Paulo');
    });

    expect(result.current).toMatchObject({
      status: 'error',
      data: null,
      cities: [cityA, cityB],
      error: 'Falha de rede.',
    });
  });

  it('exposes search errors and retries the last search', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new Error('Falha de rede.'))
      .mockResolvedValueOnce([cityA]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(cityA));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('São Paulo');
    });

    expect(result.current).toMatchObject({ status: 'error', error: 'Falha de rede.' });

    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weatherFor(cityA));
  });

  it('selects a city, loads its weather, and retries the selection on failure', async () => {
    vi.mocked(getWeather)
      .mockRejectedValueOnce(new Error('Falha de rede.'))
      .mockResolvedValueOnce(weatherFor(cityB));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.selectCity(cityB);
    });

    expect(result.current).toMatchObject({
      status: 'error',
      data: null,
      error: 'Falha de rede.',
    });
    expect(getWeather).toHaveBeenLastCalledWith(cityB);

    await act(async () => {
      await result.current.retry();
    });

    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weatherFor(cityB));
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
    await waitFor(() => expect(result.current.data).toEqual(weatherFor(cityB)));

    await act(async () => {
      resolveA(weatherFor(cityA));
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weatherFor(cityB));
  });
});
