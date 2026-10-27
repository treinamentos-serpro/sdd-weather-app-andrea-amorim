import { isValidDayDate } from '../lib/format';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  QueryErrorKind,
  WeatherData,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS =
  'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,pressure_msl,is_day';
const DAILY_FIELDS =
  'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max';

export const WEATHER_ERROR_MESSAGES: Record<QueryErrorKind, string> = {
  timeout: 'A consulta demorou mais de 10 segundos. Tente novamente.',
  network:
    'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
  api: 'O serviço de clima está indisponível no momento. Tente novamente em instantes.',
  'invalid-response':
    'Não foi possível ler os dados enviados pelo serviço de clima. Tente novamente.',
  unknown: 'Não foi possível consultar os dados meteorológicos. Tente novamente.',
};

export class WeatherServiceError extends Error {
  constructor(message: string, kind: QueryErrorKind) {
    super(message);
    this.name = 'WeatherServiceError';
    this.kind = kind;
  }

  readonly kind: QueryErrorKind;
}

async function fetchJsonWithTimeout(url: string | URL): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError(
        `Falha na consulta ao serviço de clima (HTTP ${response.status}).`,
        'api',
      );
    }

    return await response.json();
  } catch (error) {
    if (controller.signal.aborted || (isRecord(error) && error.name === 'AbortError')) {
      throw new WeatherServiceError(WEATHER_ERROR_MESSAGES.timeout, 'timeout');
    }
    if (error instanceof WeatherServiceError) throw error;
    if (error instanceof SyntaxError) {
      throw new WeatherServiceError(
        WEATHER_ERROR_MESSAGES['invalid-response'],
        'invalid-response',
      );
    }
    throw new WeatherServiceError(WEATHER_ERROR_MESSAGES.network, 'network');
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function mapForecastDay(daily: Record<string, unknown[]>, index: number): ForecastDay {
  const date = daily.time[index];
  if (!isValidDayDate(date)) {
    throw new WeatherServiceError(
      'A resposta de previsão contém uma data inválida.',
      'invalid-response',
    );
  }

  return {
    date,
    minimumTemperatureC: nullableNumber(daily.temperature_2m_min?.[index]),
    maximumTemperatureC: nullableNumber(daily.temperature_2m_max?.[index]),
    weatherCode: nullableNumber(daily.weather_code?.[index]),
    precipitationSumMm: nullableNumber(daily.precipitation_sum?.[index]),
    precipitationProbabilityMaxPercent: nullableNumber(
      daily.precipitation_probability_max?.[index],
    ),
  };
}

function mapCurrent(current: Record<string, unknown>): CurrentWeather {
  if (
    typeof current.time !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(current.time) ||
    !isValidDayDate(current.time.slice(0, 10))
  ) {
    throw new WeatherServiceError(
      'A resposta de clima atual contém um horário inválido.',
      'invalid-response',
    );
  }

  return {
    observedAt: current.time,
    temperatureC: nullableNumber(current.temperature_2m),
    apparentTemperatureC: nullableNumber(current.apparent_temperature),
    relativeHumidityPercent: nullableNumber(current.relative_humidity_2m),
    weatherCode: nullableNumber(current.weather_code),
    precipitationMm: nullableNumber(current.precipitation),
    windSpeedKmh: nullableNumber(current.wind_speed_10m),
    windDirectionDegrees: nullableNumber(current.wind_direction_10m),
    pressureMslHpa: nullableNumber(current.pressure_msl),
    isDay: current.is_day === 0 ? false : current.is_day === 1 ? true : null,
  };
}

function mapCity(result: unknown): City | null {
  if (
    !isRecord(result) ||
    typeof result.latitude !== 'number' ||
    !Number.isFinite(result.latitude) ||
    Math.abs(result.latitude) > 90 ||
    typeof result.longitude !== 'number' ||
    !Number.isFinite(result.longitude) ||
    Math.abs(result.longitude) > 180
  ) {
    return null;
  }

  const name = nonEmptyString(result.name);
  if (!name) return null;
  const country = nonEmptyString(result.country);
  const region = nonEmptyString(result.admin1);
  const timezone = nonEmptyString(result.timezone);

  return {
    ...(typeof result.id === 'number' && Number.isFinite(result.id) ? { id: result.id } : {}),
    name,
    latitude: result.latitude,
    longitude: result.longitude,
    ...(country ? { country } : {}),
    ...(region ? { region } : {}),
    ...(timezone ? { timezone } : {}),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const searchTerm = name.trim();
  if (!searchTerm) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(searchTerm)}&count=10&language=pt&format=json`;
  const payload = await fetchJsonWithTimeout(url);

  if (!isRecord(payload)) {
    throw new WeatherServiceError(
      'A resposta de geocodificação contém dados inválidos.',
      'invalid-response',
    );
  }

  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError(
      'A resposta de geocodificação contém dados inválidos.',
      'invalid-response',
    );
  }

  const cities = payload.results.map(mapCity).filter((city) => city !== null);
  if (payload.results.length > 0 && cities.length === 0) {
    throw new WeatherServiceError(
      'A resposta de geocodificação não contém cidades válidas.',
      'invalid-response',
    );
  }
  return cities;
}

export async function getWeather(city: City): Promise<WeatherData> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(city.latitude));
  url.searchParams.set('longitude', String(city.longitude));
  url.searchParams.set('current', CURRENT_FIELDS);
  url.searchParams.set('daily', DAILY_FIELDS);
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '5');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');

  const payload = await fetchJsonWithTimeout(url);

  if (
    !isRecord(payload) ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily) ||
    !Array.isArray(payload.daily.time) ||
    payload.daily.time.length < 5
  ) {
    throw new WeatherServiceError(
      'A resposta meteorológica está incompleta ou inválida.',
      'invalid-response',
    );
  }

  const timezone = nonEmptyString(payload.timezone);
  if (!timezone) {
    throw new WeatherServiceError(
      'A resposta meteorológica não contém um fuso horário válido.',
      'invalid-response',
    );
  }

  const daily: Record<string, unknown[]> = {};
  for (const [field, values] of Object.entries(payload.daily)) {
    if (Array.isArray(values)) daily[field] = values;
  }

  return {
    city,
    timezone,
    fetchedAt: new Date().toISOString(),
    current: mapCurrent(payload.current),
    forecastDays: Array.from({ length: 5 }, (_, index) => mapForecastDay(daily, index)),
  };
}
