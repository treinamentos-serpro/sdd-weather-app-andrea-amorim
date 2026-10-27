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
    temperature_2m: 26,
    apparent_temperature: 28,
    relative_humidity_2m: 65,
    weather_code: 2,
    precipitation: 0,
    wind_speed_10m: 12,
    wind_direction_10m: 135,
    pressure_msl: 1014,
    is_day: 1,
  },
  daily: {
    time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
    weather_code: [2, 0, 61, 3, 1],
    temperature_2m_min: [18, 19, 20, 17, 16],
    temperature_2m_max: [28, 29, 27, 23, 25],
    precipitation_sum: [0, 0, 4.5, 0, 0],
    precipitation_probability_max: [10, 0, 80, 20, 5],
  },
};

async function mockWeather(page: Page, result = city) {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: [result] } }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
}

for (const width of [320, 768, 1280]) {
  test(`busca e alterna unidade sem overflow em ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await mockWeather(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'WeatherView' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Consulte o clima de uma cidade');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    await expect(page.getByLabel('Temperatura atual')).toHaveText('26 °C');
    const forecastRegion = page.getByRole('region', { name: 'Previsão diária' });
    await expect(forecastRegion.getByRole('article')).toHaveCount(5);

    const unitGroup = page.getByRole('group', { name: 'Unidade de temperatura' });
    await unitGroup.getByRole('button', { name: '°F — Fahrenheit' }).click();
    await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');
    await expect(
      unitGroup.getByRole('button', { name: '°F — Fahrenheit' }),
    ).toHaveAttribute('aria-pressed', 'true');

    const columns = await forecastRegion
      .getByRole('list')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 640 ? 2 : width < 1024 ? 3 : 5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('fluxo por teclado, alvos de toque e contraste dos controles', async ({ page }) => {
  await mockWeather(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const search = page.getByRole('searchbox', { name: 'Cidade' });
  await search.focus();
  await page.keyboard.type('São Paulo');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Temperatura atual')).toHaveText('26 °C');

  const fahrenheit = page.getByRole('button', { name: '°F — Fahrenheit' });
  await fahrenheit.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');

  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  const contrast = await search.evaluate((input) => {
    const rgb = (color: string) => {
      const channels = color.match(/[\d.]+/g);
      if (!channels) throw new Error(`Cor não reconhecida: ${color}`);
      return channels.slice(0, 3).map(Number);
    };
    const luminance = (color: string) =>
      rgb(color)
        .map((channel) => channel / 255)
        .map((channel) =>
          channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
        )
        .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)];
      return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
    };
    const style = getComputedStyle(input);
    const selectedButton = document.querySelector<HTMLButtonElement>(
      '[aria-label="Unidade de temperatura"] button[aria-pressed="true"]',
    );
    if (!selectedButton) throw new Error('Controle de unidade ativo ausente.');
    const selectedStyle = getComputedStyle(selectedButton);
    return {
      border: ratio(style.borderTopColor, style.backgroundColor),
      inputText: ratio(style.color, style.backgroundColor),
      selectedText: ratio(selectedStyle.color, selectedStyle.backgroundColor),
    };
  });
  expect(contrast.border).toBeGreaterThanOrEqual(3);
  expect(contrast.inputText).toBeGreaterThanOrEqual(4.5);
  expect(contrast.selectedText).toBeGreaterThanOrEqual(4.5);
});

test('reflow em 320px com texto ampliado e nomes longos', async ({ page }) => {
  const longName = 'CidadeComNomeMuitoLongoSemEspacosParaTestarQuebraDeLinha';
  await mockWeather(page, {
    ...city,
    name: longName,
    admin1: 'RegiaoComNomeMuitoLongoSemEspacosParaTestarQuebraDeLinha',
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill(longName);
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('heading', { name: longName })).toBeVisible();

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.getByRole('link', { name: 'Pular para o conteúdo' }).focus();
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  for (const card of await page.getByRole('article').all()) {
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  for (const value of await page.getByRole('definition').all()) {
    expect(await value.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
  }
});
