import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

function getCityKey(city: City): string {
  return String(city.id ?? `${city.name}-${city.latitude}-${city.longitude}`);
}

function getCityLabel(city: City): string {
  return [city.name, city.region, city.country].filter(Boolean).join(', ');
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  return (
    <section
      aria-label="Cidades encontradas"
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <h2 className="mb-3 text-lg font-semibold">Cidades encontradas</h2>
      <ul className="space-y-2">
        {cities.map((city) => (
          <li key={getCityKey(city)}>
            <button
              type="button"
              onClick={() => onSelect(city)}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              {getCityLabel(city)}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
