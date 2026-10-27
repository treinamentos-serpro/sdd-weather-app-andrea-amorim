import type { Unit } from '../types/weather';

export function convertTemperature(valueC: number | null, unit: Unit): number | null {
  if (valueC === null) return null;
  return unit === 'fahrenheit' ? (valueC * 9) / 5 + 32 : valueC;
}
