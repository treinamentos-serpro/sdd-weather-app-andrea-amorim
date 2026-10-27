import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../../src/services/weatherService';

describe('searchCities', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it.each(['', '   '])('não busca com o termo vazio %j', async (name) => {
    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('busca e mapeia cidades com os atributos do geocoding', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 3448439,
              name: 'São Paulo',
              latitude: -23.55,
              longitude: -46.63,
              country: 'Brasil',
              admin1: 'São Paulo',
              timezone: 'America/Sao_Paulo',
            },
            { name: 'Sao Paulo', latitude: 0, longitude: 0 },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(searchCities('São Paulo')).resolves.toEqual([
      {
        id: 3448439,
        name: 'São Paulo',
        latitude: -23.55,
        longitude: -46.63,
        country: 'Brasil',
        region: 'São Paulo',
        timezone: 'America/Sao_Paulo',
      },
      { name: 'Sao Paulo', latitude: 0, longitude: 0 },
    ]);

    const [url, options] = fetchMock.mock.calls[0];
    const requestUrl = new URL(String(url));
    expect(requestUrl.hostname).toBe('geocoding-api.open-meteo.com');
    expect(requestUrl.pathname).toBe('/v1/search');
    expect(url).toContain('name=S%C3%A3o%20Paulo');
    expect(requestUrl.searchParams.get('name')).toBe('São Paulo');
    expect(requestUrl.searchParams.get('count')).toBe('10');
    expect(requestUrl.searchParams.get('language')).toBe('pt');
    expect(requestUrl.searchParams.get('format')).toBe('json');
    expect(options).toBeUndefined();
  });

  it('retorna lista vazia quando não há resultados', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));

    await expect(searchCities('cidade inexistente')).resolves.toEqual([]);
  });

  it('lança WeatherServiceError quando a resposta HTTP não é bem-sucedida', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(searchCities('Lisboa')).rejects.toBeInstanceOf(WeatherServiceError);
  });
});
