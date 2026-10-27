import { useId } from 'react';
import { formatValue } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const condition = getWeatherCondition(current.weatherCode, current.isDay);
  const temperatureUnit = unit === 'celsius' ? '°C' : '°F';
  const metrics = [
    { label: 'Umidade', value: current.relativeHumidityPercent, suffix: '%' },
    { label: 'Vento', value: current.windSpeedKmh, suffix: 'km/h' },
    { label: 'Precipitação', value: current.precipitationMm, suffix: 'mm' },
    { label: 'Pressão', value: current.pressureMslHpa, suffix: 'hPa' },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md sm:p-6"
    >
      <p className="text-sm text-slate-300">Clima atual</p>
      <h2 id={headingId} className="break-words text-2xl font-semibold">
        {city.name}
      </h2>
      {(city.region || city.country) && (
        <p className="break-words text-slate-300">
          {[city.region, city.country].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="my-6 flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="text-6xl">
          {condition.icon}
        </span>
        <div className="min-w-0 max-w-full">
          <output
            aria-label="Temperatura atual"
            className="block break-words text-5xl font-semibold tracking-tight sm:text-7xl"
          >
            {formatValue(convertTemperature(current.temperatureC, unit), temperatureUnit)}
          </output>
          <p className="mt-2 break-words text-lg text-slate-200">{condition.label}</p>
          <p className="mt-1 text-sm text-slate-300">
            Sensação térmica:{' '}
            {formatValue(convertTemperature(current.apparentTemperatureC, unit), temperatureUnit)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, suffix }) => (
          <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1 break-words text-lg font-semibold">{formatValue(value, suffix)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
