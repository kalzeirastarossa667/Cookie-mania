import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const browser = new JSDOM(html, {
  url: 'https://cookie-empire.example/?test=1',
  runScripts: 'dangerously',
  virtualConsole: new VirtualConsole(),
});
const { window } = browser;
await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
const app = window.cookieEmpire;
const document = window.document;
assert.ok(app, 'application démarrée');
assert.equal(window.cookieEmpireFoundationTests?.total, 151, 'suite intégrée lancée dans un DOM');
assert.equal(window.cookieEmpireFoundationTests?.passed, true, 'suite intégrée réussie dans un DOM');

const cards = [...document.querySelectorAll('#generatorList .generator')];
assert.equal(cards.length, 3, 'trois générateurs affichés');
const oven = document.querySelector('[data-generator-id="oven"][data-buy-mode="1"]');
const ovenTen = document.querySelector('[data-generator-id="oven"][data-buy-mode="10"]');
assert.ok(oven && ovenTen, 'contrôles du four présents');
assert.equal(oven.disabled, true, 'four non achetable au départ');
const initialBatch = ovenTen.querySelector('[data-role="batch-cost"]').textContent;
assert.ok(initialBatch && initialBatch !== '0', 'prix ×10 visible');
assert.match(ovenTen.getAttribute('aria-label'), /Acheter 10 Four artisanal pour/);

const state = app.state;
state.cookies = state.totalProduced = app.engine.getGeneratorCost('oven');
app.ui.render();
assert.equal(oven.disabled, false, 'achat accessible à coût exact');
oven.click();
assert.equal(state.generators.oven, 1, 'achat depuis le bouton');
assert.equal(state.cookies.m, 0, 'coût prélevé');
assert.equal(state.cps.m, 8, 'CPS mis à jour');
assert.equal(ovenTen.disabled, true, 'lot désactivé si insuffisant');
assert.notEqual(ovenTen.querySelector('[data-role="batch-cost"]').textContent, initialBatch, 'prix ×10 actualisé après achat');

const batch = app.engine.getGeneratorCost('oven');
state.cookies = state.totalProduced = batch;
app.ui.render();
assert.ok(oven.getAttribute('aria-label').includes(oven.querySelector('[data-role="cost"]').textContent), 'prix accessible actualisé');
state.cookies = state.totalProduced = window.eval("HugeNumber.from(1000000)");
app.ui.render();
assert.equal(ovenTen.disabled, false, 'lot de fours achetable');
ovenTen.click();
assert.equal(state.generators.oven, 11, 'achat ×10 depuis le bouton');
assert.equal(state.cps.m, 8.8, 'production de onze fours');
assert.notEqual(ovenTen.querySelector('[data-role="batch-cost"]').textContent, initialBatch, 'prix du lot recalculé');

const saved = JSON.parse(app.saveSystem.encode(state));
delete saved.state.generators.oven;
assert.equal(app.saveSystem.decode(JSON.stringify(saved))?.generators.oven, 0, 'ancienne sauvegarde compatible');

assert.equal(document.querySelectorAll('#milestoneList .milestone-row').length, 8, 'progression conservée');
assert.equal(document.getElementById('diagnosticResults').textContent.includes('151/151'), true, 'diagnostic affiché');
app.saveAccumulator = 1;
window.dispatchEvent(new window.Event('pagehide'));
assert.equal(app.saveAccumulator, 0, 'sortie de page vide le compteur de sauvegarde');
assert.equal(app.saveSystem.load()?.generators.oven, 11, 'sortie de page conserve les fours');
app.saveAccumulator = 1;
const originalSave = app.saveSystem.save.bind(app.saveSystem);
app.saveSystem.save = () => false;
window.dispatchEvent(new window.Event('pagehide'));
assert.equal(app.saveAccumulator, 1, 'échec de sauvegarde laisse la tentative en attente');
app.saveSystem.save = originalSave;
Object.defineProperty(document, 'hidden', { configurable: true, value: true });
document.dispatchEvent(new window.Event('visibilitychange'));
assert.equal(app.saveAccumulator, 0, 'mise en arrière-plan réessaie la sauvegarde');
window.close();
console.log('Interface simulée : 21/21 vérifications réussies');
