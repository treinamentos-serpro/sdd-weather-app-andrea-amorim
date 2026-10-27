export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  region?: string;
  timezone?: string;
}

export interface CurrentWeather {
  observedAt: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  relativeHumidityPercent: number | null;
  weatherCode: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  windDirectionDegrees: number | null;
  pressureMslHpa: number | null;
  isDay: boolean | null;
}

export interface ForecastDay {
  date: string;
  minimumTemperatureC: number | null;
  maximumTemperatureC: number | null;
  weatherCode: number | null;
  precipitationSumMm: number | null;
  precipitationProbabilityMaxPercent: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string;
  fetchedAt: string;
  current: CurrentWeather;
  forecastDays: ForecastDay[];
}

export type QueryErrorKind = 'network' | 'api' | 'timeout' | 'invalid-response';

export type QueryState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; kind: QueryErrorKind; message: string };
