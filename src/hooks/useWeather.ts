import { useRef, useState } from 'react';
import { getWeather, searchCities } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

type WeatherOperation =
  | { type: 'search'; name: string }
  | { type: 'selectCity'; city: City };

interface WeatherState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

interface UseWeatherResult extends WeatherState {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

const GENERIC_ERROR = 'Não foi possível consultar os dados meteorológicos.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : GENERIC_ERROR;
}

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
  });
  const requestId = useRef(0);
  const lastOperation = useRef<WeatherOperation | null>(null);

  async function execute(operation: WeatherOperation): Promise<void> {
    const currentRequestId = ++requestId.current;
    const isCurrentRequest = () => currentRequestId === requestId.current;

    if (operation.type === 'search') {
      const { name } = operation;
      setState((current) => ({ ...current, query: name, error: null }));

      if (!name.trim()) {
        setState((current) => ({
          ...current,
          status: 'idle',
          cities: [],
          error: null,
        }));
        return;
      }

      setState((current) => ({ ...current, status: 'loading', error: null }));

      let cities: City[];
      try {
        cities = await searchCities(name);
      } catch (error) {
        if (!isCurrentRequest()) return;
        setState((current) => ({
          ...current,
          status: 'error',
          cities: [],
          error: getErrorMessage(error),
        }));
        return;
      }

      if (!isCurrentRequest()) return;

      if (cities.length === 0) {
        setState((current) => ({
          ...current,
          status: 'empty',
          cities: [],
          error: null,
        }));
        return;
      }

      setState((current) => ({
        ...current,
        status: 'loading',
        cities,
        data: null,
        error: null,
      }));

      try {
        const data = await getWeather(cities[0]);
        if (!isCurrentRequest()) return;

        setState((current) => ({ ...current, status: 'success', data, error: null }));
      } catch (error) {
        if (!isCurrentRequest()) return;
        setState((current) => ({
          ...current,
          status: 'error',
          data: null,
          error: getErrorMessage(error),
        }));
      }

      return;
    }

    setState((current) => ({
      ...current,
      status: 'loading',
      data: null,
      error: null,
    }));

    try {
      const data = await getWeather(operation.city);
      if (!isCurrentRequest()) return;

      setState((current) => ({ ...current, status: 'success', data, error: null }));
    } catch (error) {
      if (!isCurrentRequest()) return;
      setState((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: getErrorMessage(error),
      }));
    }
  }

  function run(operation: WeatherOperation): Promise<void> {
    lastOperation.current = operation;
    return execute(operation);
  }

  function search(name: string): Promise<void> {
    return run({ type: 'search', name });
  }

  function selectCity(city: City): Promise<void> {
    return run({ type: 'selectCity', city });
  }

  function retry(): Promise<void> {
    const operation = lastOperation.current;
    return operation ? execute(operation) : Promise.resolve();
  }

  return { ...state, search, selectCity, retry };
}
