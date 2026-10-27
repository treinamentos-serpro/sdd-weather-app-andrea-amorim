import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weather';
import type { ForecastDay } from '../../src/types/weather';

afterEach(cleanup);

const day: ForecastDay = {
  date: '2026-10-27',
  maximumTemperatureC: 100,
  minimumTemperatureC: 0,
  weatherCode: 61,
  precipitationProbabilityMaxPercent: 80,
  precipitationSumMm: 4.5,
};

describe('ForecastList', () => {
  it('renderiza exatamente as cinco datas recebidas, uma vez e na mesma ordem', () => {
    render(<ForecastList days={mockWeatherData.forecastDays} unit="celsius" />);

    expect(screen.getByRole('region', { name: 'Previsão diária' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveClass(
      'grid',
      'grid-cols-2',
      'sm:grid-cols-3',
      'lg:grid-cols-5',
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(
      items.map(
        (item) => within(item).getByRole('heading', { level: 3 }).querySelector('time')?.dateTime,
      ),
    ).toEqual(['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']);
  });

  it('mostra estado vazio sem cards', () => {
    render(<ForecastList days={[]} unit="celsius" />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma previsão disponível.');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('atualiza todos os cards quando a unidade muda', () => {
    const days = [day, { ...day, date: '2026-10-28' }];
    const { rerender } = render(<ForecastList days={days} unit="celsius" />);
    expect(screen.getAllByText('100 °C')).toHaveLength(2);
    expect(screen.getAllByText('0 °C')).toHaveLength(2);

    rerender(<ForecastList days={days} unit="fahrenheit" />);
    expect(screen.getAllByText('212 °F')).toHaveLength(2);
    expect(screen.getAllByText('32 °F')).toHaveLength(2);
    expect(screen.queryByText(/°C/)).not.toBeInTheDocument();
  });
});

describe('ForecastCard', () => {
  it('exibe dia, condição, ícone decorativo e métricas rotuladas', () => {
    render(<ForecastCard day={day} unit="celsius" />);

    expect(screen.getByRole('article', { name: 'terça-feira, 27/10' })).toBeInTheDocument();
    expect(screen.getByText('🌧️')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Chuva leve')).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((item) => item.textContent)).toEqual([
      'Máxima',
      'Mínima',
      'Probabilidade de chuva',
    ]);
    expect(screen.getAllByRole('definition').map((item) => item.textContent)).toEqual([
      '100 °C',
      '0 °C',
      '80 %',
    ]);
  });

  it.each([
    'maximumTemperatureC',
    'minimumTemperatureC',
    'precipitationProbabilityMaxPercent',
    'weatherCode',
  ] as const)('mostra traço para %s ausente sem perder os demais valores', (field) => {
    render(<ForecastCard day={{ ...day, [field]: null }} unit="fahrenheit" />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(
      screen.getByText(field === 'maximumTemperatureC' ? '32 °F' : '212 °F'),
    ).toBeInTheDocument();
  });

  it('preserva probabilidade zero e formata temperaturas decimais em pt-BR', () => {
    render(
      <ForecastCard
        day={{
          ...day,
          maximumTemperatureC: 25.5,
          minimumTemperatureC: -2.5,
          precipitationProbabilityMaxPercent: 0,
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('25,5 °C')).toBeInTheDocument();
    expect(screen.getByText('-2,5 °C')).toBeInTheDocument();
    expect(screen.getByText('0 %')).toBeInTheDocument();
  });

  it.each(['celsius', 'fahrenheit'] as const)(
    'protege todas as métricas não finitas em %s',
    (unit) => {
      render(
        <ForecastCard
          day={{
            ...day,
            maximumTemperatureC: Number.NaN,
            minimumTemperatureC: Infinity,
            precipitationProbabilityMaxPercent: -Infinity,
            weatherCode: Number.NaN,
          }}
          unit={unit}
        />,
      );
      expect(screen.getAllByRole('definition').map((item) => item.textContent)).toEqual([
        '—', '—', '—',
      ]);
      expect(screen.getByRole('article')).not.toHaveTextContent(/NaN|undefined|Infinity|∞/);
    },
  );

  it.each(['', '2026-02-30', 'inválida'])(
    'não quebra a renderização nem gera time inválido para %j',
    (date) => {
      render(<ForecastCard day={{ ...day, date }} unit="celsius" />);
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('—');
      expect(screen.getByRole('heading', { level: 3 }).querySelector('time')).toBeNull();
      expect(screen.getByText('100 °C')).toBeInTheDocument();
    },
  );
});
