import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatValue } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it.each([
    ['2026-10-27', 'terça-feira, 27/10'],
    ['2026-11-01', 'domingo, 01/11'],
    ['2027-01-01', 'sexta-feira, 01/01'],
    ['2028-02-29', 'terça-feira, 29/02'],
  ])('formata a data local %s sem deslocar o dia', (date, label) => {
    expect(formatDayLabel(date)).toBe(label);
  });

  it.each([
    '',
    'inválida',
    '2026-02-30',
    '2026-13-01',
    '2026-1-01',
    '2026-10-27T00:00:00Z',
  ])('rejeita data inválida %j explicitamente', (date) => {
    expect(() => formatDayLabel(date)).toThrow(RangeError);
  });
});

describe('formatValue', () => {
  it('formata números em pt-BR, preserva zero e indica ausência', () => {
    expect(formatValue(25.5, '°C')).toBe('25,5 °C');
    expect(formatValue(0, '%')).toBe('0 %');
    expect(formatValue(null, '°F')).toBe('—');
  });
});
