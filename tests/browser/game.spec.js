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



test('Foundation 2.9 A3 : les cartes expliquent leur production sans reconstruire la boutique', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="workshop"]').click();

  const cards = page.locator('#generatorList .generator');
  await expect(cards).toHaveCount(16);
  const cursor = page.locator('#generatorList .generator[data-generator-id="cursor"]');
  await expect(cursor.locator('.generator-description')).toContainText('Automatise les premiers gestes');
  const details = cursor.locator('details.generator-details');
  await expect(details).not.toHaveAttribute('open', '');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');

  const originalCard = await cursor.evaluate(element => {
    window.__a3CursorCard = element;
    return element.dataset.generatorId;
  });
  expect(originalCard).toBe('cursor');

  await page.evaluate(() => {
    const state = window.cookieEmpire.state;
    for (const id of Object.keys(state.generators)) state.generators[id] = 0;
    state.generators.cursor = 10;
    state.generators.grandma = 1;
    state.ownedUpgrades = [];
    state.ownedPrestigeUpgrades = [];
    state.prestigePoints = state.prestigePoints.constructor.zero();
    state.prestigeCurrency = state.prestigeCurrency.constructor.zero();
    window.eval('Economy.refreshDerived(window.cookieEmpire.state)');
    window.cookieEmpire.ui.render();
  });

  await expect(cursor.locator('[data-role="stack-cps"]')).toHaveText('1 cookie/s');
  await expect(cursor.locator('[data-role="stack-click"]')).toHaveText('1 cookie/clic');
  await expect(cursor.locator('[data-role="cps-share"]')).toHaveText('50 %');
  await expect(cursor.locator('[data-role="next-unit"]')).toContainText('+0.1 cookie/s');
  await expect(cursor.locator('[data-role="specialization"]')).toContainText('Gestes experts · 10 / 10 unités');
  await expect(cursor.locator('[data-buy-mode="1"]')).toBeVisible();
  await expect(cursor.locator('[data-buy-mode="10"]')).toBeVisible();
  await expect(cursor.locator('[data-buy-mode="max"]')).toBeVisible();
  expect(await page.evaluate(() => window.__a3CursorCard === document.querySelector('#generatorList .generator[data-generator-id="cursor"]'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});



test('Foundation 2.9 A3 : métriques avancées restent finies à CPS nul et HugeNumber extrême', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-nav="workshop"]').click();

  const cursor = page.locator('#generatorList .generator[data-generator-id="cursor"]');
  await cursor.locator('details.generator-details summary').click();

  await page.evaluate(() => {
    const state = window.cookieEmpire.state;
    for (const id of Object.keys(state.generators)) state.generators[id] = 0;
    state.ownedUpgrades = [];
    state.ownedPrestigeUpgrades = [];
    state.prestigePoints = state.prestigePoints.constructor.zero();
    state.prestigeCurrency = state.prestigeCurrency.constructor.zero();
    window.eval('Economy.refreshDerived(window.cookieEmpire.state)');
    window.cookieEmpire.ui.render();
  });

  await expect(cursor.locator('[data-role="cps-share"]')).toHaveText('0 %');
  const zeroTexts = await cursor.locator('.generator-metric').allTextContents();
  expect(zeroTexts.join(' ')).not.toMatch(/NaN|Infinity/);

  await page.evaluate(() => {
    const state = window.cookieEmpire.state;
    state.generators.cursor = 1;
    state.prestigePoints = window.eval("HugeNumber.from('1e1000')");
    state.prestigeCurrency = window.eval("HugeNumber.from('1e1000')");
    window.eval('Economy.refreshDerived(window.cookieEmpire.state)');
    window.cookieEmpire.ui.render();
  });

  await expect(cursor.locator('[data-role="cps-share"]')).toHaveText('100 %');
  const extremeTexts = await cursor.locator('.generator-metric').allTextContents();
  expect(extremeTexts.join(' ')).not.toMatch(/NaN|Infinity/);
});



test('Foundation 2.9 B : le jeu explique les blocages, le prestige et la prochaine action', async ({ page }) => {
  await page.goto('/');

  await page.locator('[data-nav="research"]').click();
  await expect(page.locator('#research-precision_click [data-role="research-state"]')).toContainText('Clic cosmique');

  await page.locator('[data-nav="journey"]').click();
  await expect(page.locator('[data-prestige-impact="lost"]')).toContainText('PERDU');
  await expect(page.locator('[data-prestige-impact="lost"]')).toContainText('générateurs');
  await expect(page.locator('[data-prestige-impact="kept"]')).toContainText('CONSERVÉ');
  await expect(page.locator('[data-prestige-impact="kept"]')).toContainText('Rayonnement');
  await expect(page.locator('[data-prestige-impact="gained"]')).toContainText('GAGNÉ');
  await expect(page.locator('[data-prestige-impact="gained"]')).toContainText('Aucun Éclat');

  await expect(page.locator('#nextActionHint')).toContainText('cookie');
  await expect(page.locator('#nextActionHint')).toContainText('atelier');

  await page.evaluate(() => {
    const state=window.cookieEmpire.state;
    state.totalProduced.m=1;state.totalProduced.e=12;
    window.cookieEmpire.ui.render();
  });
  await expect(page.locator('[data-prestige-impact="gained"]')).toContainText('+1 Éclat');
  await expect(page.locator('[data-prestige-impact="gained"]')).toContainText('×1.1');
});



test('Foundation 2.9 C : la couche visuelle reste sûre et distingue les quatre ères', async ({ page }) => {
  await page.goto('/');

  const safety = await page.evaluate(() => ({
    cookieAnimation: getComputedStyle(document.getElementById('cookieButton')).animationName,
    topbarBackdrop: getComputedStyle(document.querySelector('.topbar')).backdropFilter,
    webkitTopbarBackdrop: getComputedStyle(document.querySelector('.topbar')).webkitBackdropFilter,
    heroAmbient: getComputedStyle(document.querySelector('.hero'), '::after').animationName,
  }));
  expect(safety.cookieAnimation).toBe('none');
  expect([safety.topbarBackdrop, safety.webkitTopbarBackdrop].filter(Boolean).every(value => value === 'none')).toBe(true);
  expect(safety.heroAmbient).not.toBe('none');

  await page.locator('[data-nav="workshop"]').click();
  const eraVisuals = await page.locator('#generatorList .generator').evaluateAll(cards => {
    const entries = [];
    for (const era of [...new Set(cards.map(card => card.dataset.era))]) {
      const card = cards.find(item => item.dataset.era === era);
      entries.push([era, getComputedStyle(card).getPropertyValue('--era-accent').trim()]);
    }
    return Object.fromEntries(entries);
  });
  expect(Object.keys(eraVisuals)).toHaveLength(4);
  expect(new Set(Object.values(eraVisuals).filter(Boolean)).size).toBe(4);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.hero'), '::after').animationName)).toBe('none');
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
  await expect(page.locator('footer')).toContainText('Foundation 2.9 · Visual');
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
  expect(intercepted?.body).toContain('Foundation 2.9');
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
  await page.goto('/');
  await expect(page.locator('#balance')).toHaveText('0');

  const burst = await page.evaluate(() => {
    const app = window.cookieEmpire;
    const state = app.state;
    const zero = state.cookies.constructor.zero();
    state.cookies = zero.clone();
    state.totalProduced = zero.clone();
    state.totalClicks = 0;
    for (const id of Object.keys(state.generators)) state.generators[id] = 0;
    state.generators.grandma = 1;
    app.engine.tick(0);
    app.lastFrame = performance.now();

    const button = document.getElementById('cookieButton');
    const started = performance.now();
    let nextClickAt = 0;
    while (performance.now() - started < 1200) {
      const elapsed = performance.now() - started;
      if (elapsed >= nextClickAt) {
        button.click();
        nextClickAt += 10;
      }
    }
    return { clicks: state.totalClicks, clickReward: state.clickReward.toJSON() };
  });

  expect(burst.clicks).toBeGreaterThan(50);
  await page.waitForTimeout(150);

  const result = await page.evaluate(() => {
    const state = window.cookieEmpire.state;
    const manual = state.clickReward.multiply(state.totalClicks);
    const automatic = state.totalProduced.subtract(manual);
    return {
      clicks: state.totalClicks,
      cps: state.cps.toJSON(),
      automatic: automatic.toJSON(),
    };
  });

  expect(result.cps).toEqual({ m: 1, e: 0 });
  expect(result.automatic.e).toBe(0);
  expect(result.automatic.m).toBeGreaterThan(1.1);
});


test('Foundation 2.8.2 : la navigation basse ne recouvre pas le contenu mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Régression spécifique au viewport mobile');
  await page.goto('/');

  async function expectAboveNav(selector) {
    const target = page.locator(selector).last();
    await target.evaluate(element => element.scrollIntoView({ block: 'end', behavior: 'instant' }));
    const clearance = await target.evaluate(element => {
      const nav = document.querySelector('.game-nav').getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return {
        targetBottom: rect.bottom,
        navTop: nav.top,
        viewportHeight: innerHeight,
        scrollY,
      };
    });
    expect(clearance.targetBottom, selector + ' ' + JSON.stringify(clearance)).toBeLessThanOrEqual(clearance.navTop - 8);
  }

  await expect(page.locator('#view-empire')).toBeVisible();
  await expectAboveNav('#objectiveShortcut');

  await page.locator('[data-nav="workshop"]').click();
  await expectAboveNav('#generatorList .generator');

  await page.locator('[data-nav="research"]').click();
  await expectAboveNav('#upgradeList .upgrade-card');

  await page.locator('[data-nav="journey"]').click();
  await expectAboveNav('#milestoneDetails');
});


test('Foundation 2.8.3 : le menu options reste au-dessus du HUD de ressources', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Régression spécifique au viewport mobile');
  await page.goto('/');

  const settings = page.locator('details.settings');
  await settings.locator('summary').click();
  await expect(settings).toHaveAttribute('open', '');

  for (const selector of ['#exportSaveButton', '#importButton', '#resetButton']) {
    const action = page.locator(selector);
    await expect(action).toBeVisible();
    const hitTest = await action.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topmost = document.elementFromPoint(x, y);
      return {
        selector: element.id,
        topmostId: topmost?.id || '',
        topmostClass: topmost?.className || '',
        isTopmost: topmost === element || element.contains(topmost),
        x,
        y,
      };
    });
    expect(hitTest.isTopmost, JSON.stringify(hitTest)).toBe(true);
  }
});
