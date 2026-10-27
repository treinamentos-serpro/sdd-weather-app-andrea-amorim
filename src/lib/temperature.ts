import type { Unit } from '../types/weather';

const temperatureFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function convertTemperature(valueC: number | null, unit: Unit): number | null {
  if (valueC === null) return null;
  return unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
}

export function formatTemperature(value: number | null, unit: Unit): string {
  if (value === null) return '—';
  return `${temperatureFormatter.format(value)} ${unitLabel(unit)}`;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}
