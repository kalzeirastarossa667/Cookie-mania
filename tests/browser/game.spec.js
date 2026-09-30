import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
  await expect(page.locator('footer')).toContainText('Foundation 2.8 · Quality');
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
  await expect(page.locator('[data-prestige-branch="click"] .prestige-branch')).toHaveText('Voie clic');
  await expect(page.locator('[data-prestige-branch="production"]').first().locator('.prestige-branch')).toHaveText('Voie production');
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


test('Foundation 2.7.2 : le feedback est envoyé sans quitter ni modifier la partie', async ({ page }) => {
  let intercepted = null;
  await page.route('https://formspree.io/f/mdekjdqz', async route => {
    const request = route.request();
    intercepted = { method: request.method(), body: request.postData() || '' };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto('/');
  const form = page.locator('#feedbackForm');
  await expect(form).toBeVisible();
  await expect(form).toHaveAttribute('action', 'https://formspree.io/f/mdekjdqz');

  const before = await page.evaluate(() => ({
    cookies: window.cookieEmpire.state.cookies.toJSON(),
    produced: window.cookieEmpire.state.totalProduced.toJSON(),
    clicks: window.cookieEmpire.state.totalClicks,
  }));
  const urlBefore = page.url();

  await page.locator('#feedbackName').fill('Testeur Playwright');
  await page.locator('#feedbackRating').selectOption('5');
  await page.locator('#feedbackMessage').fill('Le formulaire fonctionne sans toucher à ma partie.');
  await page.locator('#feedbackSubmit').click();

  await expect(page.locator('#feedbackStatus')).toContainText('Merci');
  await expect(page.locator('#feedbackMessage')).toHaveValue('');
  expect(page.url()).toBe(urlBefore);
  expect(intercepted?.method).toBe('POST');
  expect(intercepted?.body).toContain('Le formulaire fonctionne sans toucher');
  expect(intercepted?.body).toContain('Foundation 2.8');
  expect(await page.evaluate(() => ({
    cookies: window.cookieEmpire.state.cookies.toJSON(),
    produced: window.cookieEmpire.state.totalProduced.toJSON(),
    clicks: window.cookieEmpire.state.totalClicks,
  }))).toEqual(before);
});


async function seriousAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter(violation => ['serious', 'critical'].includes(violation.impact))
    .map(violation => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map(node => node.target),
    }));
}

test('Foundation 2.8 : aucune violation axe sérieuse ou critique dans les vues principales', async ({ page }) => {
  await page.goto('/');
  for (const view of ['empire', 'workshop', 'research', 'journey']) {
    await page.locator(`[data-nav="${view}"]`).click();
    await expect(page.locator(`#view-${view}`)).toBeVisible();
    const violations = await seriousAccessibilityViolations(page);
    expect(violations, `${view}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
  }
  await expect(page.locator('#feedbackForm')).toBeVisible();
  const feedbackResults = await new AxeBuilder({ page }).include('#feedbackForm').analyze();
  const feedbackViolations = feedbackResults.violations
    .filter(violation => ['serious', 'critical'].includes(violation.impact))
    .map(violation => ({ id: violation.id, impact: violation.impact, targets: violation.nodes.map(node => node.target) }));
  expect(feedbackViolations, JSON.stringify(feedbackViolations, null, 2)).toEqual([]);
});


test('Foundation 2.8 : le thème clair reste sans violation axe sérieuse ou critique', async ({ page }) => {
  await page.goto('/');
  await page.locator('#themeButton').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const view of ['empire', 'workshop', 'research', 'journey']) {
    await page.locator(`[data-nav="${view}"]`).click();
    await expect(page.locator(`#view-${view}`)).toBeVisible();
    const violations = await seriousAccessibilityViolations(page);
    expect(violations, `light/${view}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
  }
  const feedbackResults = await new AxeBuilder({ page }).include('#feedbackForm').analyze();
  const feedbackViolations = feedbackResults.violations
    .filter(violation => ['serious', 'critical'].includes(violation.impact))
    .map(violation => ({ id: violation.id, impact: violation.impact, targets: violation.nodes.map(node => node.target) }));
  expect(feedbackViolations, `light/feedback: ${JSON.stringify(feedbackViolations, null, 2)}`).toEqual([]);
});


test('Foundation 2.8.1 : clic manuel et production automatique coexistent pendant un retard de frame', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => Boolean(window.cookieEmpire));
  const result = await page.evaluate(() => {
    const app = window.cookieEmpire;
    const state = app.state;
    state.cookies = HugeNumber.zero();
    state.totalProduced = HugeNumber.zero();
    state.totalClicks = 0;
    state.generators.grandma = 1;
    Economy.refreshDerived(state);

    const clickReward = state.clickReward.clone();
    for (let i = 0; i < 10; i++) document.getElementById('cookieButton').click();

    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0;
    app.lastFrame = 1000;
    app.loop(2500);
    window.requestAnimationFrame = originalRaf;

    const manual = clickReward.multiply(state.totalClicks);
    const automatic = Economy.subtract(state.totalProduced, manual);
    return {
      clicks: state.totalClicks,
      cps: state.cps.toJSON(),
      automatic: automatic.toJSON(),
      totalProduced: state.totalProduced.toJSON(),
    };
  });

  expect(result.clicks).toBe(10);
  expect(result.cps).toEqual({ m: 1, e: 0 });
  expect(result.automatic).toEqual({ m: 1.5, e: 0 });
});
