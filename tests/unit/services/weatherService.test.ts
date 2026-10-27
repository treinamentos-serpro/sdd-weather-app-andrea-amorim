import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City } from '../../../src/types/weather';

const city: City = {
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};

describe('weatherService', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  describe('getWeather', () => {
    const fetchMock = vi.fn<typeof fetch>();
    const daily = {
      time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
      weather_code: [3, 2, 61, 3, 1],
      temperature_2m_min: [16, 17, 18, 16, 15],
      temperature_2m_max: [25, 26, 23, 24, 25],
      precipitation_sum: [0, 0, 4.2, 0, 0],
      precipitation_probability_max: [5, 10, 70, 15, 5],
    };
    const current = {
      time: '2026-10-27T09:00',
      temperature_2m: 18.4,
      apparent_temperature: 18.1,
      relative_humidity_2m: 72,
      weather_code: 3,
      precipitation: 0,
      wind_speed_10m: 8.2,
      wind_direction_10m: 140,
      pressure_msl: 1015.2,
      is_day: 1,
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      fetchMock.mockReset();
    });

    it('consulta forecast e mapeia clima atual e cinco dias', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ timezone: 'America/Sao_Paulo', current, daily }), {
          status: 200,
        }),
      );

      await expect(getWeather(city)).resolves.toMatchObject({
        city,
        timezone: 'America/Sao_Paulo',
        current: {
          observedAt: current.time,
          temperatureC: 18.4,
          apparentTemperatureC: 18.1,
          relativeHumidityPercent: 72,
          weatherCode: 3,
          precipitationMm: 0,
          windSpeedKmh: 8.2,
          windDirectionDegrees: 140,
          pressureMslHpa: 1015.2,
          isDay: true,
        },
        forecastDays: [
          {
            date: daily.time[0],
            minimumTemperatureC: 16,
            maximumTemperatureC: 25,
            weatherCode: 3,
            precipitationSumMm: 0,
            precipitationProbabilityMaxPercent: 5,
          },
          {
            date: daily.time[1],
            minimumTemperatureC: 17,
            maximumTemperatureC: 26,
            weatherCode: 2,
            precipitationSumMm: 0,
            precipitationProbabilityMaxPercent: 10,
          },
          {
            date: daily.time[2],
            minimumTemperatureC: 18,
            maximumTemperatureC: 23,
            weatherCode: 61,
            precipitationSumMm: 4.2,
            precipitationProbabilityMaxPercent: 70,
          },
          {
            date: daily.time[3],
            minimumTemperatureC: 16,
            maximumTemperatureC: 24,
            weatherCode: 3,
            precipitationSumMm: 0,
            precipitationProbabilityMaxPercent: 15,
          },
          {
            date: daily.time[4],
            minimumTemperatureC: 15,
            maximumTemperatureC: 25,
            weatherCode: 1,
            precipitationSumMm: 0,
            precipitationProbabilityMaxPercent: 5,
          },
        ],
      });

      const [request] = fetchMock.mock.calls[0];
      const requestUrl = new URL(String(request));
      expect(requestUrl.hostname).toBe('api.open-meteo.com');
      expect(requestUrl.pathname).toBe('/v1/forecast');
      expect(requestUrl.searchParams.get('latitude')).toBe('-23.55');
      expect(requestUrl.searchParams.get('longitude')).toBe('-46.63');
      expect(requestUrl.searchParams.get('current')).toBe(
        'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,pressure_msl,is_day',
      );
      expect(requestUrl.searchParams.get('daily')).toBe(
        'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max',
      );
      expect(requestUrl.searchParams.get('timezone')).toBe('auto');
      expect(requestUrl.searchParams.get('forecast_days')).toBe('5');
      expect(requestUrl.searchParams.get('temperature_unit')).toBe('celsius');
      expect(requestUrl.searchParams.get('wind_speed_unit')).toBe('kmh');
      expect(requestUrl.searchParams.get('precipitation_unit')).toBe('mm');
    });

    it('normaliza campos ausentes e nulos como null', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: { time: current.time, temperature_2m: null, is_day: 5 },
            daily: { time: daily.time },
          }),
          { status: 200 },
        ),
      );

      const result = await getWeather(city);
      expect(result.current).toMatchObject({
        observedAt: current.time,
        temperatureC: null,
        apparentTemperatureC: null,
        isDay: null,
      });
      expect(result.forecastDays).toHaveLength(5);
      expect(result.forecastDays[0]).toMatchObject({
        date: daily.time[0],
        minimumTemperatureC: null,
        maximumTemperatureC: null,
        weatherCode: null,
        precipitationSumMm: null,
        precipitationProbabilityMaxPercent: null,
      });
    });

    it('mantém os campos recebidos e normaliza campos ausentes em uma resposta parcial', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            timezone: 'America/Sao_Paulo',
            current: {
              time: current.time,
              temperature_2m: 18,
              relative_humidity_2m: null,
              weather_code: 61,
              is_day: 1,
            },
            daily: {
              time: daily.time,
              temperature_2m_min: [null, -2],
              temperature_2m_max: [25],
              weather_code: [61, null, 3],
              precipitation_sum: [4.5],
              precipitation_probability_max: [80, 0],
            },
          }),
          { status: 200 },
        ),
      );

      const result = await getWeather(city);

      expect(result.current).toMatchObject({
        temperatureC: 18,
        apparentTemperatureC: null,
        relativeHumidityPercent: null,
        weatherCode: 61,
        precipitationMm: null,
        isDay: true,
      });
      expect(result.forecastDays[0]).toMatchObject({
        date: daily.time[0],
        minimumTemperatureC: null,
        maximumTemperatureC: 25,
        weatherCode: 61,
        precipitationSumMm: 4.5,
        precipitationProbabilityMaxPercent: 80,
      });
      expect(result.forecastDays[1]).toMatchObject({
        date: daily.time[1],
        minimumTemperatureC: -2,
        maximumTemperatureC: null,
        weatherCode: null,
        precipitationSumMm: null,
        precipitationProbabilityMaxPercent: 0,
      });
      expect(result.forecastDays).toHaveLength(5);
    });

    it.each([undefined, null, 'inválido', Number.NaN, Infinity, -Infinity, 0])(
      'normaliza todos os campos numéricos com valor %s sem perder zero',
      async (value) => {
        const currentFields = [
          'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
          'weather_code', 'precipitation', 'wind_speed_10m', 'wind_direction_10m',
          'pressure_msl',
        ];
        const dailyFields = [
          'temperature_2m_min', 'temperature_2m_max', 'weather_code',
          'precipitation_sum', 'precipitation_probability_max',
        ];
        const response = new Response();
        vi.spyOn(response, 'json').mockResolvedValue({
          timezone: 'America/Sao_Paulo',
          current: {
            time: current.time,
            ...Object.fromEntries(currentFields.map((field) => [field, value])),
          },
          daily: {
            time: daily.time,
            ...Object.fromEntries(dailyFields.map((field) => [field, [value]])),
          },
        });
        fetchMock.mockResolvedValueOnce(response);

        const result = await getWeather(city);
        const expected = value === 0 ? 0 : null;
        expect(result.current).toEqual({
          observedAt: current.time,
          temperatureC: expected,
          apparentTemperatureC: expected,
          relativeHumidityPercent: expected,
          weatherCode: expected,
          precipitationMm: expected,
          windSpeedKmh: expected,
          windDirectionDegrees: expected,
          pressureMslHpa: expected,
          isDay: null,
        });
        for (const [index, day] of result.forecastDays.entries()) {
          const dailyExpected = index === 0 ? expected : null;
          expect(day).toEqual({
            date: daily.time[index],
            minimumTemperatureC: dailyExpected,
            maximumTemperatureC: dailyExpected,
            weatherCode: dailyExpected,
            precipitationSumMm: dailyExpected,
            precipitationProbabilityMaxPercent: dailyExpected,
          });
        }
      },
    );

    it.each([null, undefined, {}, 'inválido'])(
      'normaliza arrays de métricas inválidos %j sem perder as datas',
      async (value) => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current,
          daily: {
            time: daily.time,
            weather_code: value,
            temperature_2m_min: value,
            temperature_2m_max: value,
            precipitation_sum: value,
            precipitation_probability_max: value,
          },
        })));
        const result = await getWeather(city);
        expect(result.forecastDays).toHaveLength(5);
        for (const day of result.forecastDays) {
          expect(Object.values(day).slice(1)).toEqual([null, null, null, null, null]);
        }
      },
    );

    it.each([
      [undefined, null], [null, null], ['0', null], [2, null], [0, false], [1, true],
    ])('mapeia is_day %j para %j', async (value, expected) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
        timezone: 'America/Sao_Paulo',
        current: { ...current, is_day: value },
        daily,
      })));
      expect((await getWeather(city)).current.isDay).toBe(expected);
    });

    it.each([undefined, null, '', '2026-02-30', '2026-13-01'])(
      'rejeita data diária inválida %j antes de renderizar',
      async (value) => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current,
          daily: { ...daily, time: [value, ...daily.time.slice(1)] },
        })));
        await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
      },
    );

    it.each([undefined, null, '', ' ', '2026-02-30T09:00', '2026-10-27T25:00'])(
      'rejeita horário atual inválido %j',
      async (value) => {
        fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
          timezone: 'America/Sao_Paulo',
          current: { ...current, time: value },
          daily,
        })));
        await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
      },
    );

    it.each([undefined, null, '', ' '])('rejeita fuso ausente/vazio %j', async (value) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
        timezone: value, current, daily,
      })));
      await expect(getWeather(city)).rejects.toMatchObject({ kind: 'invalid-response' });
    });

    it.each([
      { timezone: 'America/Sao_Paulo', daily },
      { timezone: 'America/Sao_Paulo', current },
    ])('rejeita resposta sem current ou daily', async (payload) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

      await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it.each([
      undefined, null, [], daily.time.slice(0, 4), '2026-10-27',
    ])('rejeita forecast com daily.time incompleto %j', async (time) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
        timezone: 'America/Sao_Paulo',
        current,
        daily: { ...daily, time },
      })));

      await expect(getWeather(city)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        kind: 'invalid-response',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('lança WeatherServiceError quando a resposta HTTP não é bem-sucedida', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

      await expect(getWeather(city)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        kind: 'api',
      });
    });
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
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.signal?.aborted).toBe(false);
  });

  it('retorna lista vazia quando não há resultados', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }));

    await expect(searchCities('cidade inexistente')).resolves.toEqual([]);
  });

  it.each(["  São João d'Aliança  ", 'A&B + C/#?=100%', '  München 東京  '])(
    'codifica %j sem perder caracteres nem criar parâmetros extras',
    async (name) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results: [] })));

      await expect(searchCities(name)).resolves.toEqual([]);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = new URL(String(fetchMock.mock.calls[0][0]));
      expect(url.searchParams.get('name')).toBe(name.trim());
      expect([...url.searchParams.keys()]).toEqual(['name', 'count', 'language', 'format']);
      expect(url.hash).toBe('');
      expect(url.searchParams.get('count')).toBe('10');
    },
  );

  it('retorna lista vazia quando results está ausente', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await expect(searchCities('cidade inexistente')).resolves.toEqual([]);
  });

  it.each([undefined, null, '', ' ', 42])(
    'omite textos opcionais e ID inválidos %j no geocoding',
    async (value) => {
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{
          ...city, name: ' São Paulo ', id: null,
          country: value, admin1: value, timezone: value,
        }],
      })));
      await expect(searchCities('São Paulo')).resolves.toEqual([city]);
    },
  );

  it.each([
    { ...city, name: null },
    { ...city, name: ' ' },
    { ...city, latitude: null },
    { ...city, longitude: undefined },
    { ...city, latitude: 91 },
    { ...city, longitude: -181 },
  ])('rejeita lista sem cidade válida %j', async (result) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results: [result] })));
    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });

  it.each([null, {}, 42])('rejeita results inválido %j', async (results) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ results })));
    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });

  it('lança WeatherServiceError quando a resposta HTTP não é bem-sucedida', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(searchCities('Lisboa')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      kind: 'api',
      message: 'Falha na consulta ao serviço de clima (HTTP 503).',
    });
  });

  describe.each([
    ['geocodificação', () => searchCities('Lisboa')],
    ['forecast', () => getWeather(city)],
  ] as const)('timeout e rede — %s', (_name, request) => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('aborta somente ao atingir 10 segundos e limpa o timer', async () => {
      let signal: AbortSignal | null | undefined;
      fetchMock.mockImplementationOnce(
        (_url, options) =>
          new Promise<Response>((_resolve, reject) => {
            signal = options?.signal;
            signal?.addEventListener('abort', () => reject(signal?.reason), { once: true });
          }),
      );

      const result = request();
      const assertion = expect(result).rejects.toEqual(
        new WeatherServiceError(
          'A consulta demorou mais de 10 segundos. Tente novamente.',
          'timeout',
        ),
      );

      expect(signal).toBeInstanceOf(AbortSignal);
      await vi.advanceTimersByTimeAsync(9_999);
      expect(signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(signal?.aborted).toBe(true);
      await assertion;
      expect(vi.getTimerCount()).toBe(0);
    });

    it.each([
      [
        new DOMException('Aborted', 'AbortError'),
        'A consulta demorou mais de 10 segundos. Tente novamente.',
        'timeout',
      ],
      [
        new TypeError('Failed to fetch'),
        'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
        'network',
      ],
    ] as const)('normaliza a rejeição %s e limpa o timer', async (error, message, kind) => {
      fetchMock.mockRejectedValueOnce(error);

      await expect(request()).rejects.toEqual(new WeatherServiceError(message, kind));
      expect(vi.getTimerCount()).toBe(0);
    });

    it('limpa o timer após sucesso do fetch sem abortar a requisição', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [],
            timezone: 'Europe/Lisbon',
            current: { time: '2026-10-27T09:00' },
            daily: {
              time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
            },
          }),
          { status: 200 },
        ),
      );

      await expect(request()).resolves.toBeDefined();
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(10_000);
      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
    });

    it('preserva erros HTTP e limpa o timer', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

      await expect(request()).rejects.toThrow('HTTP 503');
      expect(vi.getTimerCount()).toBe(0);
    });

    it('mantém o limite de 10 segundos durante a leitura do corpo', async () => {
      let signal: AbortSignal | null | undefined;
      fetchMock.mockImplementationOnce(async (_url, options) => {
        signal = options?.signal;
        return new Response(
          new ReadableStream({
            start(controller) {
              signal?.addEventListener('abort', () => controller.error(signal?.reason), {
                once: true,
              });
            },
          }),
        );
      });

      const assertion = expect(request()).rejects.toMatchObject({
        kind: 'timeout',
        message: 'A consulta demorou mais de 10 segundos. Tente novamente.',
      });

      await vi.advanceTimersByTimeAsync(9_999);
      expect(signal?.aborted).toBe(false);
      expect(vi.getTimerCount()).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      await assertion;
      expect(signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('classifica corpo interrompido como falha de rede e limpa o timer', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new TypeError('Connection lost'));
            },
          }),
        ),
      );

      await expect(request()).rejects.toMatchObject({
        kind: 'network',
        message:
          'Não foi possível conectar ao serviço de clima. Verifique sua conexão e tente novamente.',
      });
      expect(vi.getTimerCount()).toBe(0);
    });

    it('distingue JSON inválido de falha de rede e limpa o timer', async () => {
      fetchMock.mockResolvedValueOnce(new Response('{'));

      await expect(request()).rejects.toMatchObject({
        kind: 'invalid-response',
        message: 'Não foi possível ler os dados enviados pelo serviço de clima. Tente novamente.',
      });
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
