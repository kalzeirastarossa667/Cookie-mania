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


test('prestige confirmé conserve les éclats et réinitialise la partie', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="journey"]').click();
  await expect(page.locator('#prestigeButton')).toBeDisabled();
  await page.evaluate(() => {
    const state=window.cookieEmpire.state;
    state.totalProduced.m=1; state.totalProduced.e=12;
    window.cookieEmpire.ui.render();
  });
  await expect(page.locator('#prestigeButton')).toBeEnabled();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#prestigeButton').click();
  await expect(page.locator('#prestigePoints')).toHaveText('1');
  await expect(page.locator('#prestigeMultiplier')).toHaveText('×1.1');
  await page.locator('[data-nav="empire"]').click();
  await expect(page.locator('#balance')).toHaveText('0');
  await page.reload();
  await page.locator('[data-nav="journey"]').click();
  await expect(page.locator('#prestigePoints')).toHaveText('1');
});
