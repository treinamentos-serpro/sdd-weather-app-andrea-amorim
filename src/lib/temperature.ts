import type { Unit } from '../types/weather';

const temperatureFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function convertTemperature(
  valueC: number | null | undefined,
  unit: Unit,
): number | null {
  if (typeof valueC !== 'number' || !Number.isFinite(valueC)) return null;
  const converted = unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
  return Number.isFinite(converted) ? converted : null;
}

export function formatTemperature(value: number | null | undefined, unit: Unit): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${temperatureFormatter.format(value)} ${unitLabel(unit)}`;
}

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}
