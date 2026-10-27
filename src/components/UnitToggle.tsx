import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="°C — Celsius"
        aria-pressed={unit === 'celsius'}
        onClick={() => onChange('celsius')}
        className="min-h-11 min-w-11 rounded-lg border border-slate-500 px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 aria-pressed:bg-accent-500 aria-pressed:text-night-900 aria-pressed:hover:bg-accent-400"
      >
        °C
      </button>
      <button
        type="button"
        aria-label="°F — Fahrenheit"
        aria-pressed={unit === 'fahrenheit'}
        onClick={() => onChange('fahrenheit')}
        className="min-h-11 min-w-11 rounded-lg border border-slate-500 px-3 py-2 font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 aria-pressed:bg-accent-500 aria-pressed:text-night-900 aria-pressed:hover:bg-accent-400"
      >
        °F
      </button>
    </div>
  );
}
