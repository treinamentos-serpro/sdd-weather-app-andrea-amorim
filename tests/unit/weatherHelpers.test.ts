import { describe, expect, it } from 'vitest';
import { convertTemperature } from '../../src/lib/temperature';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [26, 78.8],
  ])('converte %s Celsius em %s Fahrenheit', (valueC, valueF) => {
    expect(convertTemperature(valueC, 'fahrenheit')).toBeCloseTo(valueF);
    expect(convertTemperature(valueC, 'celsius')).toBe(valueC);
  });

  it('preserva valores indisponíveis em ambas as unidades', () => {
    expect(convertTemperature(null, 'celsius')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit')).toBeNull();
  });
});

describe('getWeatherCondition', () => {
  it.each([
    0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ])('reconhece o código WMO %s', (code) => {
    const condition = getWeatherCondition(code);
    expect(condition.label).not.toBe('Condição desconhecida');
    expect(condition.label).not.toBe('—');
    expect(condition.icon).not.toBe('❔');
  });

  it('distingue códigos ausentes de desconhecidos', () => {
    expect(getWeatherCondition(null)).toEqual({ label: '—', icon: '❔' });
    expect(getWeatherCondition(999)).toEqual({ label: 'Condição desconhecida', icon: '❔' });
  });

  it.each([0, 1])('usa a lua à noite para o código %s', (code) => {
    expect(getWeatherCondition(code, false).icon).toBe('🌙');
    expect(getWeatherCondition(code, true).icon).not.toBe('🌙');
    expect(getWeatherCondition(code, null).icon).not.toBe('🌙');
  });
});
