import { describe, expect, it } from 'vitest';
import { convertTemperature, formatTemperature, unitLabel } from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it.each([
    [0, 0],
    [100, 100],
    [-40, -40],
  ])('mantém %s °C quando a unidade selecionada é Celsius', (celsius, expected) => {
    expect(convertTemperature(celsius, 'celsius')).toBe(expected);
  });

  it('mantém valores indisponíveis como null', () => {
    expect(convertTemperature(null, 'celsius')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit')).toBeNull();
  });
});

describe('formatTemperature', () => {
  it.each([
    [21.6, 'celsius', '22 °C'],
    [21.6, 'fahrenheit', '22 °F'],
  ] as const)('arredonda e inclui o símbolo da unidade', (value, unit, expected) => {
    expect(formatTemperature(value, unit)).toBe(expected);
  });

  it('indica temperatura indisponível', () => {
    expect(formatTemperature(null, 'celsius')).toBe('—');
  });
});

describe('unitLabel', () => {
  it.each([
    ['celsius', '°C'],
    ['fahrenheit', '°F'],
  ] as const)('retorna o símbolo da unidade %s', (unit, label) => {
    expect(unitLabel(unit)).toBe(label);
  });
});
