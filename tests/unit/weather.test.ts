import { describe, expect, expectTypeOf, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weather';
import type {
  City,
  CurrentWeather,
  ForecastDay,
  QueryErrorKind,
  QueryState,
  Unit,
  WeatherData,
} from '../../src/types/weather';

describe('Contratos meteorológicos', () => {
  it('define as unidades e os atributos opcionais da cidade', () => {
    expectTypeOf<Unit>().toEqualTypeOf<'celsius' | 'fahrenheit'>();
    expectTypeOf<{ name: string; latitude: number; longitude: number }>().toExtend<City>();
    expectTypeOf(mockWeatherData).toEqualTypeOf<WeatherData>();
  });

  it('permite null nos campos meteorológicos esperados', () => {
    expectTypeOf<CurrentWeather>().toEqualTypeOf<{
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
    }>();
    expectTypeOf<ForecastDay>().toEqualTypeOf<{
      date: string;
      minimumTemperatureC: number | null;
      maximumTemperatureC: number | null;
      weatherCode: number | null;
      precipitationSumMm: number | null;
      precipitationProbabilityMaxPercent: number | null;
    }>();
  });

  it('discrimina os estados de consulta e seus respectivos dados', () => {
    expectTypeOf<QueryState<WeatherData>['status']>().toEqualTypeOf<
      'idle' | 'loading' | 'success' | 'empty' | 'error'
    >();
    expectTypeOf<Extract<QueryState<WeatherData>, { status: 'success' }>>().toEqualTypeOf<{
      status: 'success';
      data: WeatherData;
    }>();
    expectTypeOf<Extract<QueryState<WeatherData>, { status: 'error' }>>().toEqualTypeOf<{
      status: 'error';
      kind: QueryErrorKind;
      message: string;
    }>();
    expectTypeOf<QueryErrorKind>().toEqualTypeOf<
      'network' | 'api' | 'timeout' | 'invalid-response'
    >();
    expectTypeOf<
      Extract<QueryState<WeatherData>, { status: 'idle' | 'loading' | 'empty' }>
    >().toEqualTypeOf<{ status: 'idle' } | { status: 'loading' } | { status: 'empty' }>();
  });
});

describe('Mock meteorológico', () => {
  it('identifica a cidade e o instante das condições atuais no mesmo fuso', () => {
    expect(mockWeatherData.city.name).toBe('São Paulo');
    expect(mockWeatherData.timezone).toBe('America/Sao_Paulo');
    expect(mockWeatherData.city.timezone).toBe(mockWeatherData.timezone);
    expect(mockWeatherData.current.observedAt).toBe('2026-10-27T14:00:00-03:00');
    expect(mockWeatherData.fetchedAt).toBe(mockWeatherData.current.observedAt);
    expect(mockWeatherData.current.temperatureC).toBe(26);
  });

  it('inclui exatamente o dia da observação e os quatro dias seguintes', () => {
    expect(mockWeatherData.forecastDays.map((day) => day.date)).toEqual([
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
    ]);
  });

  it('fornece temperaturas coerentes e condições variadas para desenvolver a UI', () => {
    for (const day of mockWeatherData.forecastDays) {
      expect(day.minimumTemperatureC).toBeTypeOf('number');
      expect(day.maximumTemperatureC).toBeTypeOf('number');
      if (day.minimumTemperatureC !== null && day.maximumTemperatureC !== null) {
        expect(day.minimumTemperatureC).toBeLessThanOrEqual(day.maximumTemperatureC);
      }
    }

    expect(mockWeatherData.forecastDays.map((day) => day.weatherCode)).toEqual([2, 0, 61, 3, 1]);
  });
});
