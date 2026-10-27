const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export function formatValue(value: number | null, suffix: string): string {
  return value === null ? '—' : `${numberFormatter.format(value)} ${suffix}`;
}

export function formatDayLabel(date: string): string {
  // Datas diárias já representam o calendário local da cidade, não um instante.
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError(`Data de previsão inválida: ${date}`);
  }
  return dayFormatter.format(parsedDate);
}
