import type { City } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
  const response = await fetch(url);

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
