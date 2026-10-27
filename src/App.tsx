import { useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import { mockWeatherData } from './mocks/weather';
import type { QueryState, Unit, WeatherData } from './types/weather';

const demoStates: { status: QueryState<WeatherData>['status']; label: string }[] = [
  { status: 'idle', label: 'Inicial' },
  { status: 'loading', label: 'Carregando' },
  { status: 'empty', label: 'Sem resultados' },
  { status: 'error', label: 'Erro' },
  { status: 'success', label: 'Sucesso' },
];

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [query, setQuery] = useState<QueryState<WeatherData>>({ status: 'idle' });
  const mainRef = useRef<HTMLElement>(null);

  function showMockWeather() {
    setQuery({ status: 'success', data: mockWeatherData });
  }

  function selectDemoState(status: QueryState<WeatherData>['status']) {
    switch (status) {
      case 'success':
        showMockWeather();
        break;
      case 'error':
        setQuery({
          status: 'error',
          kind: 'network',
          message: 'Falha simulada na consulta. Tente novamente para exibir os dados de exemplo.',
        });
        break;
      default:
        setQuery({ status });
    }
  }

  function renderContent() {
    switch (query.status) {
      case 'idle':
        return (
          <EmptyState
            title="Consulte o clima de uma cidade"
            hint="Use a busca para visualizar o exemplo de São Paulo ou escolha um estado no painel de demonstração."
          />
        );
      case 'loading':
        return <LoadingState />;
      case 'empty':
        return <EmptyState />;
      case 'error':
        return (
          <ErrorState
            message={query.message}
            onRetry={() => {
              showMockWeather();
              mainRef.current?.focus();
            }}
          />
        );
      case 'success':
        return (
          <>
            <CurrentWeather city={query.data.city} current={query.data.current} unit={unit} />
            <ForecastList days={query.data.forecastDays} unit={unit} />
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
            <SearchBar onSearch={showMockWeather} disabled={query.status === 'loading'} />
          </div>
          <div className="self-start lg:self-center">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <aside
          aria-label="Demonstração com dados fictícios"
          className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
        >
          <h2 className="font-semibold text-accent-400">Modo de demonstração · sem API</h2>
          <p className="mt-2 text-sm text-slate-300">
            Qualquer busca exibe o mock de São Paulo. Dados fictícios de 27 a 31 de outubro de 2026,
            não o clima de hoje. Escolha um estado para testar a interface; o carregamento é mantido
            até escolher outro estado.
          </p>
          <div
            role="group"
            aria-label="Estado da demonstração"
            className="mt-4 flex flex-wrap gap-2"
          >
            {demoStates.map(({ status, label }) => (
              <button
                key={status}
                type="button"
                aria-pressed={query.status === status}
                onClick={() => selectDemoState(status)}
                className="min-h-11 min-w-0 max-w-full rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 aria-pressed:bg-accent-500 aria-pressed:font-semibold aria-pressed:text-night-900"
              >
                {label}
              </button>
            ))}
          </div>
        </aside>
        <main
          ref={mainRef}
          id="main-content"
          aria-label="Previsão do tempo"
          tabIndex={-1}
          className="space-y-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-4 focus:ring-offset-night-900"
        >
          {renderContent()}
        </main>
      </div>
      <footer className="mx-auto max-w-6xl px-4 pb-6 text-sm text-slate-400">
        WeatherView · Interface de demonstração com dados locais.
      </footer>
    </div>
  );
}
