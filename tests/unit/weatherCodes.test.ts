import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it('retorna a condição correspondente a um código conhecido', () => {
    expect(getWeatherCondition(61)).toEqual({ label: 'Chuva leve', icon: '🌧️' });
  });

  it('usa fallback para um código desconhecido', () => {
    expect(getWeatherCondition(999)).toEqual({
      label: 'Condição desconhecida',
      icon: '❔',
    });
  });

  it('indica condição indisponível quando o código é null', () => {
    expect(getWeatherCondition(null)).toEqual({ label: '—', icon: '❔' });
  });

  it('usa ícone noturno para céu limpo durante a noite', () => {
    expect(getWeatherCondition(0, false)).toEqual({ label: 'Céu limpo', icon: '🌙' });
  });
});
