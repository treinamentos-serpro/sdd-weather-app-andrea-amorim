import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import CityResults from './components/CityResults';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const weather = useWeather();
  const mainRef = useRef<HTMLElement>(null);
  const previousStatus = useRef(weather.status);

  useEffect(() => {
    if (previousStatus.current === 'loading' && weather.status !== 'loading') {
      const activeElement = document.activeElement;
      if (
        activeElement === document.body ||
        activeElement === mainRef.current ||
        activeElement?.closest('[role="search"]')
      ) {
        mainRef.current?.focus();
      }
    }
    previousStatus.current = weather.status;
  }, [weather.status]);

  function renderContent() {
    switch (weather.status) {
      case 'idle':
        return (
          <EmptyState
            title="Consulte o clima de uma cidade"
            hint="Use a busca para encontrar uma cidade e consultar a previsão do tempo."
          />
        );
      case 'loading':
        return <LoadingState />;
      case 'empty':
        return <EmptyState />;
      case 'error':
        return (
          <>
            <ErrorState
              message={weather.message}
              onRetry={() => {
                void weather.retry();
                mainRef.current?.focus();
              }}
            />
            {weather.cities.length > 0 && (
              <CityResults cities={weather.cities} onSelect={weather.selectCity} />
            )}
          </>
        );
      case 'success':
        return (
          <>
            <p role="status" className="sr-only">
              Previsão carregada para {weather.data.city.name}.
            </p>
            {weather.cities.length > 0 && (
              <CityResults cities={weather.cities} onSelect={weather.selectCity} />
            )}
            <CurrentWeather
              city={weather.data.city}
              current={weather.data.current}
              unit={unit}
            />
            <ForecastList days={weather.data.forecastDays} unit={unit} />
          </>
        );
    }
  }

  return (
    <div className="min-h-screen bg-night-900 font-sans text-white [overflow-wrap:anywhere]">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-night-800 p-3 text-white focus:not-sr-only focus:absolute focus:left-4 focus:right-4 focus:top-4 focus:z-10 focus:whitespace-normal focus:outline-none focus:ring-2 focus:ring-accent-400"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-night-800/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 lg:flex-row lg:items-center">
          <div className="shrink-0">
            <h1 className="text-2xl font-bold tracking-tight">
              <span aria-hidden="true" className="mr-2 text-sun">
                ☀
              </span>
              WeatherView
            </h1>
            <p className="mt-1 text-sm text-slate-300">O clima, de um jeito simples.</p>
          </div>
          <div className="min-w-0 flex-1">
            <SearchBar onSearch={weather.search} disabled={weather.status === 'loading'} />
          </div>
          <div className="self-start lg:self-center">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <main
          ref={mainRef}
          id="main-content"
          aria-label="Previsão do tempo"
          aria-busy={weather.status === 'loading'}
          tabIndex={-1}
          className="space-y-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-4 focus:ring-offset-night-900"
        >
          {renderContent()}
        </main>
      </div>
      <footer className="mx-auto max-w-6xl px-4 pb-6 text-sm text-slate-400">
        WeatherView · Dados meteorológicos fornecidos pela Open-Meteo.
      </footer>
    </div>
  );
}
