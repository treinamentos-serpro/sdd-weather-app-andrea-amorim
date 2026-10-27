import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS =
  'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,pressure_msl,is_day';
const DAILY_FIELDS =
  'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

async function fetchWithTimeout(url: string | URL): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    throw new WeatherServiceError('Falha de rede.');
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

function mapForecastDay(daily: Record<string, unknown[]>, index: number): ForecastDay {
  const date = daily.time[index];
  if (typeof date !== 'string') {
    throw new WeatherServiceError('A resposta de previsão contém uma data inválida.');
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
  if (typeof current.time !== 'string') {
    throw new WeatherServiceError('A resposta de clima atual contém um horário inválido.');
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
    typeof result.name !== 'string' ||
    typeof result.latitude !== 'number' ||
    !Number.isFinite(result.latitude) ||
    typeof result.longitude !== 'number' ||
    !Number.isFinite(result.longitude)
  ) {
    return null;
  }

  return {
    ...(typeof result.id === 'number' && Number.isFinite(result.id) ? { id: result.id } : {}),
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    ...(typeof result.country === 'string' ? { country: result.country } : {}),
    ...(typeof result.admin1 === 'string' ? { region: result.admin1 } : {}),
    ...(typeof result.timezone === 'string' ? { timezone: result.timezone } : {}),
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const searchTerm = name.trim();
  if (!searchTerm) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(searchTerm)}&count=10&language=pt&format=json`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new WeatherServiceError(`Falha na busca de cidades (HTTP ${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('A resposta de geocodificação não contém JSON válido.');
  }

  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new WeatherServiceError('A resposta de geocodificação contém dados inválidos.');
  }

  return payload.results.map(mapCity).filter((city) => city !== null);
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

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new WeatherServiceError(`Falha na consulta meteorológica (HTTP ${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new WeatherServiceError('A resposta meteorológica não contém JSON válido.');
  }

  if (
    !isRecord(payload) ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily) ||
    !Array.isArray(payload.daily.time) ||
    payload.daily.time.length < 5
  ) {
    throw new WeatherServiceError('A resposta meteorológica está incompleta ou inválida.');
  }

  if (typeof payload.timezone !== 'string') {
    throw new WeatherServiceError('A resposta meteorológica não contém um fuso horário válido.');
  }

  const daily: Record<string, unknown[]> = {};
  for (const [field, values] of Object.entries(payload.daily)) {
    if (Array.isArray(values)) daily[field] = values;
  }

  return {
    city,
    timezone: payload.timezone,
    fetchedAt: new Date().toISOString(),
    current: mapCurrent(payload.current),
    forecastDays: Array.from({ length: 5 }, (_, index) => mapForecastDay(daily, index)),
  };
}
