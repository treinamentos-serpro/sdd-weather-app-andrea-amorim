import { useRef, useState } from 'react';
import {
  getWeather,
  searchCities,
  WEATHER_ERROR_MESSAGES,
  WeatherServiceError,
} from '../services/weatherService';
import type { City, QueryErrorKind, QueryState, WeatherData } from '../types/weather';

type WeatherState = QueryState<WeatherData> & { cities: City[] };

type WeatherOperation =
  | { type: 'search'; name: string }
  | { type: 'selectCity'; city: City };

type UseWeatherResult = WeatherState & {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
};

function getQueryError(error: unknown): { kind: QueryErrorKind; message: string } {
  const kind = error instanceof WeatherServiceError ? error.kind : 'unknown';
  return { kind, message: WEATHER_ERROR_MESSAGES[kind] };
}

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    status: 'idle',
    cities: [],
  });
  const requestId = useRef(0);
  const lastOperation = useRef<WeatherOperation | null>(null);

  async function execute(operation: WeatherOperation): Promise<void> {
    const currentRequestId = ++requestId.current;
    const isCurrentRequest = () => currentRequestId === requestId.current;

    if (operation.type === 'search') {
      const { name } = operation;

      if (!name.trim()) {
        setState({ status: 'idle', cities: [] });
        return;
      }

      setState({ status: 'loading', cities: [] });

      let cities: City[];
      try {
        cities = await searchCities(name);
      } catch (error) {
        if (!isCurrentRequest()) return;
        setState({
          status: 'error',
          cities: [],
          ...getQueryError(error),
        });
        return;
      }

      if (!isCurrentRequest()) return;

      if (cities.length === 0) {
        setState({
          status: 'empty',
          cities: [],
        });
        return;
      }

      setState({
        status: 'loading',
        cities,
      });

      try {
        const data = await getWeather(cities[0]);
        if (!isCurrentRequest()) return;

        setState({ status: 'success', data, cities });
      } catch (error) {
        if (!isCurrentRequest()) return;
        setState({
          status: 'error',
          cities,
          ...getQueryError(error),
        });
      }

      return;
    }

    setState((current) => ({
      status: 'loading',
      cities: current.cities,
    }));

    try {
      const data = await getWeather(operation.city);
      if (!isCurrentRequest()) return;

      setState((current) => ({ status: 'success', data, cities: current.cities }));
    } catch (error) {
      if (!isCurrentRequest()) return;
      setState((current) => ({
        status: 'error',
        cities: current.cities,
        ...getQueryError(error),
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
