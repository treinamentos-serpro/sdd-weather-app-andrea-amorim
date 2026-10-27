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

test('resposta parcial mostra traços em ambas as unidades e preserva zeros reais', async ({
  page,
}) => {
  await mockWeather(page, {
    results: [{ name: city.name, latitude: city.latitude, longitude: city.longitude }],
  });
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: {
      timezone: forecast.timezone,
      current: {
        time: forecast.current.time,
        temperature_2m: null,
        precipitation: 0,
      },
      daily: {
        time: forecast.daily.time,
        temperature_2m_max: [0],
        precipitation_probability_max: null,
      },
    } }),
  );
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByLabel('Temperatura atual')).toHaveText('—');
  await expect(page.getByText('Sensação térmica: —')).toBeVisible();
  await expect(page.getByText('0 mm', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('article').first().getByRole('definition')).toHaveText([
    '0 °C', '—', '—',
  ]);
  await page.getByRole('button', { name: '°F — Fahrenheit' }).click();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('—');
  await expect(page.getByRole('article').first().getByRole('definition')).toHaveText([
    '32 °F', '—', '—',
  ]);
  await expect(page.getByRole('article').nth(1).getByRole('definition')).toHaveText([
    '—', '—', '—',
  ]);
  await expect(page.getByRole('main')).not.toContainText(/NaN|undefined|Infinity|∞/);
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

test('rede offline encerra loading e o botão repete a busca após reconexão', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await context.setOffline(true);
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Verifique sua conexão e tente novamente.');
  await expect(page.getByRole('searchbox')).toBeEnabled();
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(alert).toContainText('Verifique sua conexão e tente novamente.');

  let searchTerm: string | null = null;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    searchTerm = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({ json: { results: [city] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({ json: forecast }),
  );
  await context.setOffline(false);
  // Alterar o campo sem enviar não deve alterar a operação a repetir.
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(searchTerm).toBe('São Paulo');
  await expect(alert).toHaveCount(0);
});

test('retry de seleção consulta a mesma cidade sem repetir geocoding', async ({ page }) => {
  const secondCity = {
    ...city,
    id: 2267057,
    name: 'Lisboa',
    latitude: 38.72,
    longitude: -9.14,
    country: 'Portugal',
    admin1: 'Lisboa',
  };
  let searches = 0;
  const latitudes: string[] = [];
  let offline = true;
  await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
    searches++;
    return route.fulfill({ json: { results: [city, secondCity] } });
  });
  await page.route('https://api.open-meteo.com/**', (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude') ?? '';
    latitudes.push(latitude);
    if (latitude === String(secondCity.latitude) && offline) {
      return route.abort('internetdisconnected');
    }
    return route.fulfill({ json: forecast });
  });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await page.getByRole('button', { name: 'Lisboa, Lisboa, Portugal' }).click();

  await expect(page.getByRole('alert')).toContainText('Verifique sua conexão');
  await expect(page.getByLabel('Temperatura atual')).toHaveCount(0);
  offline = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(page.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
  expect(searches).toBe(1);
  expect(latitudes).toEqual(['-23.55', '38.72', '38.72']);
});
