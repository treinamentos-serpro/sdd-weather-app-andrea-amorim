import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const city = {
  id: 3448439,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  country: 'Brasil',
  admin1: 'São Paulo',
  timezone: 'America/Sao_Paulo',
};

const forecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-10-27T09:00',
    temperature_2m: 0,
    apparent_temperature: 0,
    relative_humidity_2m: 70,
    weather_code: 0,
    precipitation: 0,
    wind_speed_10m: 8,
    wind_direction_10m: 180,
    pressure_msl: 1015,
    is_day: 1,
  },
  daily: {
    time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
    weather_code: [0, 1, 2, 3, 61],
    temperature_2m_min: [0, 1, 2, 3, 4],
    temperature_2m_max: [10, 11, 12, 13, 14],
    precipitation_sum: [0, 0, 0, 1, 2],
    precipitation_probability_max: [0, 5, 10, 50, 80],
  },
};

async function mockWeather(page: Page, geocodingPayload: unknown = { results: [city] }) {
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: geocodingPayload }),
  );
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecast }),
  );
}

test('mostra estado vazio quando o geocoding não inclui results', async ({ page }) => {
  await mockWeather(page, {});
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
});

test('busca e mostra o clima corretamente em viewport mobile de 375x812', async ({ page }) => {
  await mockWeather(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('0 °C');
  await expect(page.getByRole('region', { name: 'Previsão diária' }).getByRole('article')).toHaveCount(
    5,
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});

test('busca uma cidade, mostra a previsão e converte a temperatura para Fahrenheit', async ({
  page,
}) => {
  await mockWeather(page);
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão diária' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByLabel('Temperatura atual')).toHaveText('0 °C');

  await page.getByRole('button', { name: '°F — Fahrenheit' }).click();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('32 °F');
});
