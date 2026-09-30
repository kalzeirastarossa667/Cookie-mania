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


test('Foundation 2.5 : prestige conserve Rayonnement et portefeuille après reload', async ({ page }) => {
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
  await expect(page.locator('#prestigeCurrency')).toHaveText('1');
  await expect(page.locator('#prestigeMultiplier')).toHaveText('×1.1');
  await page.locator('[data-nav="empire"]').click();
  await expect(page.locator('#balance')).toHaveText('0');
  await page.reload();
  await page.locator('[data-nav="journey"]').click();
  await expect(page.locator('#prestigePoints')).toHaveText('1');
  await expect(page.locator('#prestigeCurrency')).toHaveText('1');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-empire-foundation-v2')).version)).toBe(7);
});


test('Foundation 2.5 : achat permanent dépense le portefeuille et survit au reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const state=window.cookieEmpire.state;
    state.prestigePoints.m=3;state.prestigePoints.e=0;
    state.prestigeCurrency.m=3;state.prestigeCurrency.e=0;
    window.cookieEmpire.ui.render();
  });
  await page.locator('[data-nav="journey"]').click();
  const first=page.locator('button[data-prestige-upgrade-id="radiant_click"]');
  await expect(first).toBeEnabled();
  await first.click();
  await expect(page.locator('#prestigePoints')).toHaveText('3');
  await expect(page.locator('#prestigeCurrency')).toHaveText('2');
  await expect(page.locator('#perClick')).toHaveText('1.1');
  await expect(first).toHaveText('Acquis');
  await page.reload();await page.locator('[data-nav="journey"]').click();
  await expect(page.locator('#prestigePoints')).toHaveText('3');
  await expect(page.locator('#prestigeCurrency')).toHaveText('2');
  await expect(page.locator('button[data-prestige-upgrade-id="radiant_click"]')).toHaveText('Acquis');
  const saved=await page.evaluate(() => JSON.parse(localStorage.getItem('cookie-empire-foundation-v2')));
  expect(saved.version).toBe(7);expect(saved.state.ownedPrestigeUpgrades).toEqual(['radiant_click']);
});


test('Foundation 2.7.1 : les deux branches de Rayonnement restent jouables jusqu’à la convergence', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const state=window.cookieEmpire.state;
    state.prestigePoints.m=2;state.prestigePoints.e=1;
    state.prestigeCurrency.m=2;state.prestigeCurrency.e=1;
    window.cookieEmpire.ui.render();
  });
  await page.locator('[data-nav="journey"]').click();

  const root=page.locator('button[data-prestige-upgrade-id="radiant_click"]');
  const production=page.locator('button[data-prestige-upgrade-id="radiant_production"]');
  const clickBranch=page.locator('button[data-prestige-upgrade-id="radiant_precision"]');
  const resonance=page.locator('button[data-prestige-upgrade-id="harmonic_resonance"]');
  const convergence=page.locator('button[data-prestige-upgrade-id="radiant_convergence"]');

  await expect(root).toBeEnabled();
  await expect(production).toBeDisabled();
  await expect(clickBranch).toBeDisabled();
  await root.click();

  await expect(production).toBeEnabled();
  await expect(clickBranch).toBeEnabled();
  await clickBranch.click();
  await expect(production).toBeEnabled();
  await expect(convergence).toBeDisabled();

  await production.click();
  await expect(resonance).toBeEnabled();
  await resonance.click();
  await expect(convergence).toBeEnabled();
  await convergence.click();
  await expect(convergence).toHaveText('Acquis');
  await expect(page.locator('#prestigePoints')).toHaveText('20');
  await expect(page.locator('#prestigeCurrency')).toHaveText('6');
});
