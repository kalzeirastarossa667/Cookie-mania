import { test, expect } from '@playwright/test';

test('clics, achat réel et sauvegarde après rechargement', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#balance')).toHaveText('0');
  for (let i = 0; i < 15; i++) await page.locator('#cookieButton').click();
  await expect(page.locator('#balance')).toHaveText('15');
  await page.locator('[data-nav="workshop"]').click();
  await page.locator('button[data-generator-id="cursor"][data-buy-mode="1"]').click();
  await expect(page.locator('[data-generator-id="cursor"] [data-role="owned"]')).toHaveText('1');
  await expect(page.locator('#cps')).not.toHaveText('0');
  await expect(page.locator('#perClick')).not.toHaveText('1');
  await page.locator('#saveButton').click();
  await page.reload();
  await page.locator('[data-nav="workshop"]').click();
  await expect(page.locator('[data-generator-id="cursor"] [data-role="owned"]')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('navigation, filtres et largeur de l’interface', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const view of ['empire', 'workshop', 'research', 'journey']) {
    await page.locator(`[data-nav="${view}"]`).click();
    await expect(page.locator(`#view-${view}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`${view}.png`), fullPage: true });
  }
  await page.locator('[data-nav="workshop"]').click();
  await page.locator('#shopEra').selectOption('infinity');
  await expect(page.locator('#generatorList > :visible')).toHaveCount(4);
  await page.locator('#shopFilter').selectOption('owned');
  await expect(page.locator('#shopEmpty')).toBeVisible();
  await page.locator('#themeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
