const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export function formatValue(value: number | null | undefined, suffix: string): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${numberFormatter.format(value)} ${suffix}`
    : '—';
}

export function isValidDayDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  // Datas diárias já representam o calendário local da cidade, não um instante.
  const parsedDate = new Date(`${date}T00:00:00Z`);
  return (
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

export function formatDayLabel(date: string | null | undefined): string {
  if (!isValidDayDate(date)) return '—';
  return dayFormatter.format(new Date(`${date}T00:00:00Z`));
}
