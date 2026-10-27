import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1280]) {
  test(`layout mock e alternância de estados em ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'WeatherView' })).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Consulte o clima de uma cidade');
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByLabel('Temperatura atual')).toHaveText('26 °C');
    await expect(page.getByRole('article')).toHaveCount(5);

    const unitGroup = page.getByRole('group', { name: 'Unidade de temperatura' });
    await unitGroup.getByRole('button', { name: '°F — Fahrenheit' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');
    await expect(unitGroup.getByRole('button', { name: '°F — Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const columns = await page
      .getByRole('list')
      .evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width < 640 ? 2 : width < 1024 ? 3 : 5);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);

    const demo = page.getByRole('group', { name: 'Estado da demonstração' });
    await demo.getByRole('button', { name: 'Carregando' }).click();
    await expect(page.getByRole('status')).toContainText('Carregando dados meteorológicos');
    await expect(page.getByRole('searchbox')).toBeDisabled();
    await expect(page.getByRole('article')).toHaveCount(0);

    await demo.getByRole('button', { name: 'Sem resultados' }).click();
    await expect(page.getByRole('main')).toContainText('Nenhuma cidade encontrada');
    await demo.getByRole('button', { name: 'Erro', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Falha simulada');
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('main')).toBeFocused();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');
    await expect(page.getByRole('article')).toHaveCount(5);
    expect(errors).toEqual([]);
  });
}

test('fluxo por teclado, alvos de toque e contraste dos controles', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox')).toBeFocused();
  await expect(page.getByRole('searchbox')).toHaveAccessibleDescription(
    'Informe uma cidade para buscar.',
  );
  await page.keyboard.type('São Paulo');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const celsius = page.getByRole('button', { name: '°C — Celsius' });
  await expect(celsius).toBeFocused();
  const focusStyle = await celsius.evaluate((button) => {
    const style = getComputedStyle(button);
    return { shadow: style.boxShadow, offset: style.getPropertyValue('--tw-ring-offset-width') };
  });
  expect(focusStyle.shadow).not.toBe('none');
  expect(focusStyle.offset).toBe('2px');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');
  for (let index = 0; index < 4; index += 1) await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Erro', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await expect(page.getByLabel('Temperatura atual')).toHaveText('78,8 °F');

  for (const button of await page.getByRole('button').all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  const contrast = await page.getByRole('searchbox').evaluate((input) => {
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
  console.log('Contraste medido no navegador:', contrast);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Carregando' }).click();
  const animation = await page
    .getByRole('status')
    .locator('[aria-hidden="true"]')
    .evaluate((spinner) => getComputedStyle(spinner).animationName);
  expect(animation).toBe('none');
});

test('reflow em 320px com texto ampliado e nomes longos', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Sucesso', exact: true }).click();
  await page.getByRole('region', { name: 'São Paulo' }).evaluate((region) => {
    const heading = region.querySelector('h2');
    const location = region.querySelector('h2 + p');
    if (!heading || !location) throw new Error('Identificação da cidade ausente.');
    heading.textContent = 'CidadeComNomeMuitoLongoSemEspacosParaTestarQuebraDeLinha';
    location.textContent = 'RegiaoComNomeMuitoLongoSemEspacosParaTestarQuebraDeLinha';
  });
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
