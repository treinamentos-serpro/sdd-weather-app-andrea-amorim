import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weather';
import type { CurrentWeather as CurrentWeatherData, Unit } from '../../src/types/weather';

afterEach(cleanup);

function renderWeather(current: CurrentWeatherData = mockWeatherData.current) {
  return render(<CurrentWeather city={mockWeatherData.city} current={current} unit="celsius" />);
}

function WeatherWithUnitToggle() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const current = {
    ...mockWeatherData.current,
    temperatureC: 0,
    apparentTemperatureC: 0,
  };

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
    </>
  );
}

describe('CurrentWeather', () => {
  it('converte 0 °C para 32 °F ao selecionar Fahrenheit no controle de unidade', async () => {
    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);

    await user.click(screen.getByRole('button', { name: '°F — Fahrenheit' }));

    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('32 °F');
  });

  it('apresenta cidade, condição, ícone e métricas com suas unidades', () => {
    renderWeather();

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText('São Paulo, Brasil')).toBeInTheDocument();
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('26 °C');
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Sensação térmica: 28 °C')).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Umidade',
      'Vento',
      'Precipitação',
      'Pressão',
    ]);
    expect(screen.getAllByRole('definition').map((value) => value.textContent)).toEqual([
      '65 %',
      '12 km/h',
      '0 mm',
      '1.014 hPa',
    ]);
  });

  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s °C para %s °F e atualiza ao mudar a unidade', (valueC, valueF) => {
    const current = {
      ...mockWeatherData.current,
      temperatureC: valueC,
      apparentTemperatureC: valueC,
    };
    const { rerender } = renderWeather(current);
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(`${valueC} °C`);

    rerender(<CurrentWeather city={mockWeatherData.city} current={current} unit="fahrenheit" />);
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent(`${valueF} °F`);
    expect(screen.getByText(`Sensação térmica: ${valueF} °F`)).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
  });

  it.each([
    'temperatureC',
    'apparentTemperatureC',
    'relativeHumidityPercent',
    'weatherCode',
    'precipitationMm',
    'windSpeedKmh',
    'pressureMslHpa',
  ] as const)('mostra um traço para %s indisponível sem perder os demais dados', (field) => {
    renderWeather({ ...mockWeatherData.current, [field]: null });

    expect(
      screen.getByText(field === 'apparentTemperatureC' ? 'Sensação térmica: —' : '—'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(screen.getByText(field === 'windSpeedKmh' ? '65 %' : '12 km/h')).toBeInTheDocument();
  });

  it('preserva valores zero e formata decimais em pt-BR', () => {
    renderWeather({
      ...mockWeatherData.current,
      relativeHumidityPercent: 0,
      windSpeedKmh: 0,
      precipitationMm: 1.5,
      pressureMslHpa: 0,
      temperatureC: 0,
      apparentTemperatureC: 0,
    });

    for (const text of ['0 %', '0 km/h', '1,5 mm', '0 hPa', 'Sensação térmica: 0 °C']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Temperatura atual')).toHaveTextContent('0 °C');
  });

  it('mostra condição desconhecida sem inventar uma condição meteorológica', () => {
    renderWeather({ ...mockWeatherData.current, weatherCode: 999 });
    expect(screen.getByText('Condição desconhecida')).toBeInTheDocument();
  });

  it('mostra o ícone noturno para céu limpo', () => {
    renderWeather({ ...mockWeatherData.current, weatherCode: 0, isDay: false });
    expect(screen.getByText('🌙')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
  });

  it('aceita cidade sem atributos opcionais', () => {
    render(
      <CurrentWeather
        city={{ name: 'Recife', latitude: -8.05, longitude: -34.88 }}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );
    expect(screen.getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });
});
