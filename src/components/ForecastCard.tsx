import { useId } from 'react';
import { formatDayLabel, formatValue } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const headingId = useId();
  const condition = getWeatherCondition(day.weatherCode);
  const suffix = unit === 'celsius' ? '°C' : '°F';

  return (
    <article
      aria-labelledby={headingId}
      className="h-full min-w-0 rounded-2xl border border-white/10 bg-white/5 p-3 text-white shadow-glass backdrop-blur-md sm:p-4"
    >
      <h3 id={headingId} className="break-words text-sm font-semibold">
        <time dateTime={day.date}>{formatDayLabel(day.date)}</time>
      </h3>
      <span aria-hidden="true" className="my-3 block text-3xl sm:text-4xl">
        {condition.icon}
      </span>
      <p className="mb-3 break-words text-sm text-slate-300">{condition.label}</p>
      <dl className="space-y-2">
        <div>
          <dt className="text-sm text-slate-300">Máxima</dt>
          <dd className="break-words text-lg font-semibold text-sun">
            {formatValue(convertTemperature(day.maximumTemperatureC, unit), suffix)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">Mínima</dt>
          <dd className="break-words text-lg font-semibold">
            {formatValue(convertTemperature(day.minimumTemperatureC, unit), suffix)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-slate-300">Probabilidade de chuva</dt>
          <dd className="font-semibold">
            {formatValue(day.precipitationProbabilityMaxPercent, '%')}
          </dd>
        </div>
      </dl>
    </article>
  );
}
