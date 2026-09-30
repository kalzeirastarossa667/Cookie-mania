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

const cards = [...document.querySelectorAll('#generatorList .generator')];
assert.equal(cards.length, 16, 'seize générateurs affichés');
assert.match(cards[2].querySelector('.click-bonus').textContent, /8 cookie\/clic/, 'contribution du four lisible');
assert.match(cards[3].querySelector('.click-bonus').textContent, /47 cookie\/clic/, 'contribution de la mine lisible');
const themeButton = document.getElementById('themeButton');
assert.equal(document.documentElement.dataset.theme, 'dark', 'galaxie par défaut');
assert.equal(themeButton.getAttribute('aria-pressed'), 'true', 'thème annoncé');
themeButton.click();
assert.equal(document.documentElement.dataset.theme, 'light', 'mode clair activable');
assert.equal(app.saveSystem.readTheme(), 'light', 'préférence conservée');
assert.equal(themeButton.getAttribute('aria-label'), 'Activer le mode nuit', 'action accessible');
themeButton.click();
assert.equal(app.saveSystem.readTheme(), 'dark', 'retour au mode nuit');
assert.equal(app.saveSystem.writeTheme('invalid'), false, 'thème inconnu rejeté');
assert.match(document.querySelector('.tap-hint').textContent, /générateur.*clics/, 'règle indiquée dans le jeu');
const oven = document.querySelector('[data-generator-id="oven"][data-buy-mode="1"]');
const ovenTen = document.querySelector('[data-generator-id="oven"][data-buy-mode="10"]');
assert.ok(oven && ovenTen, 'contrôles du four présents');
assert.equal(oven.disabled, true, 'four non achetable au départ');
const initialBatch = ovenTen.querySelector('[data-role="batch-cost"]').textContent;
assert.ok(initialBatch && initialBatch !== '0', 'prix ×10 visible');
assert.match(ovenTen.getAttribute('aria-label'), /Acheter 10 Four artisanal pour/);
const quoteCounter = window.eval(`(()=>{const original=Economy.generatorBatchCost;let calls=0;Economy.generatorBatchCost=function(...args){calls++;return original.apply(this,args)};return {get calls(){return calls},restore(){Economy.generatorBatchCost=original}}})()`);
for(let i=0;i<20;i++) app.ui.render();
assert.equal(quoteCounter.calls, 0, 'pas de recalcul des lots sans changement de possession');
const cursorBuy = document.querySelector('[data-generator-id="cursor"][data-buy-mode="1"]');
app.state.cookies = window.eval('HugeNumber.from(15)');
app.ui.render();
assert.equal(cursorBuy.disabled, false, 'disponibilité recalculée quand les cookies changent');
assert.equal(quoteCounter.calls, 0, 'disponibilité sans recalcul géométrique du prix');
app.state.cookies = window.eval('HugeNumber.zero()');
app.ui.render();
assert.equal(cursorBuy.disabled, true, 'achat de nouveau désactivé si la réserve baisse');
quoteCounter.restore();

const state = app.state;
state.cookies = state.totalProduced = app.engine.getGeneratorCost('oven');
app.ui.render();
assert.equal(oven.disabled, false, 'achat accessible à coût exact');
oven.click();
assert.notEqual(app.ui.generatorElements.oven.priceOwned, 0, 'prix recalculé après achat');
assert.equal(state.generators.oven, 1, 'achat depuis le bouton');
assert.equal(state.cookies.m, 0, 'coût prélevé');
assert.equal(state.cps.m, 8, 'CPS mis à jour');
assert.equal(document.getElementById('perClick').textContent, '9', 'clic renforcé après premier four');
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
assert.equal(document.getElementById('perClick').textContent, '89', 'clic renforcé après lot de fours');
assert.notEqual(ovenTen.querySelector('[data-role="batch-cost"]').textContent, initialBatch, 'prix du lot recalculé');
const beforeManualClick = state.cookies.clone();
document.getElementById('cookieButton').click();
assert.equal(state.cookies.compare(beforeManualClick.add(89)), 0, 'clic manuel crédite le bonus dérivé');
assert.equal(document.querySelector('.click-feedback').textContent, '+89', 'gain affiché près du cookie');
assert.equal(document.querySelectorAll('.click-feedback').length, 1, 'feedback réutilisé');
const clicksBeforeKeyboard = state.totalClicks;
ovenTen.focus();
ovenTen.dispatchEvent(new window.KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
assert.equal(state.totalClicks, clicksBeforeKeyboard, 'raccourci de clic ignoré depuis un bouton de boutique');

const saved = JSON.parse(app.saveSystem.encode(state));
delete saved.state.generators.oven;
assert.equal(app.saveSystem.decode(JSON.stringify(saved))?.generators.oven, 0, 'ancienne sauvegarde compatible');
delete saved.state.generators.cocoa_mine;
assert.equal(app.saveSystem.decode(JSON.stringify(saved))?.generators.cocoa_mine, 0, 'mine initialisée sur ancienne sauvegarde');
assert.equal(app.saveSystem.decode(JSON.stringify(saved))?.generators.chocolate_lab, 0, 'laboratoire initialisé sur ancienne sauvegarde');
const mine = document.querySelector('[data-generator-id="cocoa_mine"][data-buy-mode="1"]');
state.cookies = state.totalProduced = app.engine.getGeneratorCost('cocoa_mine');
app.ui.render();
mine.click();
assert.equal(state.generators.cocoa_mine, 1, 'achat de mine');
assert.equal(state.clickReward.compare(window.eval('HugeNumber.from(136)')), 0, 'mine ajoute 47 aux clics');
assert.equal(state.cps.compare(window.eval('HugeNumber.from(135)')), 0, 'mine produit 47 cookies/s');
const lab = document.querySelector('[data-generator-id="chocolate_lab"][data-buy-mode="1"]');
state.cookies = state.totalProduced = app.engine.getGeneratorCost('chocolate_lab');
app.ui.render();
lab.click();
assert.equal(state.generators.chocolate_lab, 1, 'achat du laboratoire');
assert.equal(state.clickReward.compare(window.eval('HugeNumber.from(366)')), 0, 'laboratoire ajoute 230 aux clics');
assert.equal(state.cps.compare(window.eval('HugeNumber.from(365)')), 0, 'laboratoire ajoute 230 CPS');
const excavators = document.querySelector('[data-upgrade-id="cocoa_excavators"]');
const cosmic = document.querySelector('[data-upgrade-id="cosmic_click"]');
assert.ok(excavators && cosmic, 'nouvelles recettes affichées');
state.cookies = state.totalProduced = window.eval('HugeNumber.from(1000000)');
app.ui.render();
excavators.click();
assert.equal(state.cps.compare(window.eval('HugeNumber.from(412)')), 0, 'achat excavatrices double les CPS de la mine');
assert.equal(state.clickReward.compare(window.eval('HugeNumber.from(366)')), 0, 'achat excavatrices laisse les clics inchangés');
cosmic.click();
assert.equal(state.clickReward.compare(window.eval('HugeNumber.from(1098)')), 0, 'achat cosmique triple les clics');
assert.equal(app.saveSystem.decode(app.saveSystem.encode(state))?.clickReward.compare(window.eval('HugeNumber.from(1098)')), 0, 'clic recalculé après rechargement');
const cursorUnitBeforePrestige=document.querySelector('[data-generator-id="cursor"] [data-role="production"]').textContent;
state.prestigePoints=window.eval('HugeNumber.from(3)');state.prestigeCurrency=window.eval('HugeNumber.from(3)');
assert.equal(app.engine.buyPrestigeUpgrade('radiant_click'),true,'premier achat prestige pour test cache');
assert.equal(app.engine.buyPrestigeUpgrade('radiant_production'),true,'second achat prestige pour test cache');
app.ui.render();
assert.notEqual(document.querySelector('[data-generator-id="cursor"] [data-role="production"]').textContent,cursorUnitBeforePrestige,'achat prestige invalide le cache des taux générateurs');
const cursorUnitBeforeRayonnement=document.querySelector('[data-generator-id="cursor"] [data-role="production"]').textContent;
state.prestigePoints=window.eval('HugeNumber.from(13)');
window.eval('Economy.refreshDerived(window.cookieEmpire.state)');
app.ui.render();
assert.notEqual(document.querySelector('[data-generator-id="cursor"] [data-role="production"]').textContent,cursorUnitBeforeRayonnement,'Rayonnement total invalide le cache des taux générateurs');

assert.equal(document.querySelectorAll('#milestoneList .milestone-row').length, 44, 'progression prolongée');
assert.match(document.getElementById('milestoneCount').textContent, /44 étapes/, 'nouveau total visible');
assert.equal(document.querySelector('[data-milestone-id="ten_mines"]') !== null, true, 'objectif mines présent');
assert.equal(document.querySelector('[data-milestone-id="million_cookies"]') !== null, true, 'objectif million présent');
assert.equal(document.querySelector('[data-milestone-id="all_recipes"]') !== null, true, 'objectif six recettes présent');
assert.equal(document.querySelector('[data-milestone-id="five_labs"]') !== null, true, 'objectif cinq laboratoires présent');
assert.equal(document.querySelector('.journey-shortcut')?.getAttribute('data-open-view'), 'workshop', 'raccourci vers la boutique');
const ownedBeforeMilestoneCheck = state.ownedUpgrades;
state.ownedUpgrades = ['reinforced_click', 'efficient_cursor', 'grandma_recipe', 'warm_ovens'];
state.totalProduced = window.eval('HugeNumber.from(1000000)');
app.ui.render();
assert.equal(document.querySelector('[data-milestone-id="recipe_book"]').classList.contains('is-complete'), true, 'ancienne étape quatre recettes conservée');
assert.equal(document.querySelector('[data-milestone-id="all_recipes"]').classList.contains('is-complete'), false, 'nouvelle étape six recettes attend les achats');
const milestoneFilter = document.getElementById('milestoneFilter');
milestoneFilter.click();
assert.equal(milestoneFilter.getAttribute('aria-pressed'), 'true', 'filtre actif annoncé');
assert.equal(document.querySelector('[data-milestone-id="first_batch"]').hidden, true, 'étape franchie masquée');
assert.equal(document.querySelector('[data-milestone-id="all_recipes"]').hidden, false, 'étape restante visible');
milestoneFilter.click();
assert.equal(document.querySelector('[data-milestone-id="first_batch"]').hidden, false, 'toutes les étapes retrouvées');
const completedBeforeFinalCheck = state.generators.chocolate_lab;
const cursorBeforeFinalCheck = state.generators.cursor;
const grandmaBeforeFinalCheck = state.generators.grandma;
const minesBeforeFinalCheck = state.generators.cocoa_mine;
const producedBeforeFinalCheck = state.totalProduced;
state.ownedUpgrades = window.eval('Object.keys(UPGRADES)');
state.generators.chocolate_lab = 5;
state.generators.cursor = 10;
state.generators.grandma = 1;
state.generators.cocoa_mine = 10;
state.totalProduced = window.eval('HugeNumber.from(1000000000000)');
for(const id of ['nebula_refinery','comet_caravan','quantum_oven','time_confectionery','antimatter_mixer','galactic_foundry','multiverse_kitchen','origin_crucible'])state.generators[id]=10;
state.generators.orbital_bakery=10;state.generators.lunar_harvest=10;state.generators.stellar_forge=10;
app.ui.render();
milestoneFilter.click();
assert.equal(document.querySelector('#milestoneDetails .journey-note').textContent.includes('Toutes les étapes sont franchies'), true, 'liste vide expliquée');
milestoneFilter.click();
state.generators.chocolate_lab = completedBeforeFinalCheck;
state.generators.cursor = cursorBeforeFinalCheck;
state.generators.grandma = grandmaBeforeFinalCheck;
state.generators.cocoa_mine = minesBeforeFinalCheck;
state.totalProduced = producedBeforeFinalCheck;
for(const id of ['nebula_refinery','comet_caravan','quantum_oven','time_confectionery','antimatter_mixer','galactic_foundry','multiverse_kitchen','origin_crucible'])state.generators[id]=0;
state.generators.orbital_bakery=0;state.generators.lunar_harvest=0;state.generators.stellar_forge=0;
state.ownedUpgrades = ownedBeforeMilestoneCheck;
app.ui.render();
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
assert.ok(app.backgroundAt !== null, 'heure de mise en arrière-plan enregistrée');
const firstBackgroundAt = app.backgroundAt;
document.dispatchEvent(new window.Event('visibilitychange'));
assert.equal(app.backgroundAt, firstBackgroundAt, 'double événement caché ne décale pas le départ');
const hiddenBalance = state.cookies.clone();
const hiddenProduced = state.totalProduced.clone();
const priorDateNow = window.Date.now;
const resumedAt = app.backgroundAt + 10000;
window.Date.now = () => resumedAt;
Object.defineProperty(document, 'hidden', { configurable: true, value: false });
document.dispatchEvent(new window.Event('visibilitychange'));
const expectedOffline = state.cps.multiply(10);
assert.equal(state.cookies.compare(hiddenBalance.add(expectedOffline)), 0, 'dix secondes en arrière-plan créditées une fois');
assert.equal(state.totalProduced.compare(hiddenProduced.add(expectedOffline)), 0, 'production totale mise à jour');
assert.equal(app.backgroundAt, null, 'point de départ effacé au retour');
assert.equal(app.saveSystem.load()?.cookies.compare(state.cookies), 0, 'retour en avant-plan sauvegardé');
document.dispatchEvent(new window.Event('visibilitychange'));
assert.equal(state.cookies.compare(hiddenBalance.add(expectedOffline)), 0, 'événement de retour répété sans double crédit');
const beforePageReturn = state.cookies.clone();
window.dispatchEvent(new window.Event('pagehide'));
window.Date.now = () => resumedAt + 4000;
window.dispatchEvent(new window.Event('pageshow'));
assert.equal(state.cookies.compare(beforePageReturn.add(state.cps.multiply(4))), 0, 'retour historique de page crédite quatre secondes');
window.dispatchEvent(new window.Event('pageshow'));
assert.equal(state.cookies.compare(beforePageReturn.add(state.cps.multiply(4))), 0, 'double pageshow sans double crédit');
window.Date.now = priorDateNow;
app.engine.click();
app.saveAccumulator = 0;
window.dispatchEvent(new window.Event('pagehide'));
assert.equal(app.saveSystem.load()?.totalClicks, state.totalClicks, 'clic juste avant fermeture conservé');

// Foundation 2.7.2 — canal de feedback Formspree.
const feedbackForm = document.getElementById('feedbackForm');
assert.ok(feedbackForm, 'section de feedback présente');
assert.equal(feedbackForm.method.toLowerCase(), 'post', 'feedback utilise POST');
assert.equal(feedbackForm.action, 'https://formspree.io/f/mdekjdqz', 'endpoint Formspree exact');
assert.equal(feedbackForm.querySelector('input[name="game_version"]')?.value, 'Foundation 2.8', 'métadonnée version feedback actualisée');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackSubmit = document.getElementById('feedbackSubmit');
const feedbackStatus = document.getElementById('feedbackStatus');
assert.ok(feedbackMessage && feedbackSubmit && feedbackStatus, 'contrôles de feedback présents');
assert.equal(feedbackMessage.required, true, 'commentaire obligatoire');
assert.equal(feedbackStatus.getAttribute('aria-live'), 'polite', 'résultat annoncé sans interruption');

const feedbackStateBefore = {
  cookies: state.cookies.toJSON(),
  produced: state.totalProduced.toJSON(),
  clicks: state.totalClicks,
  upgrades: [...state.ownedUpgrades],
  prestige: [...state.ownedPrestigeUpgrades],
};
let feedbackRequest = null;
window.fetch = async (url, options) => {
  feedbackRequest = { url, options };
  return { ok: true, json: async () => ({ ok: true }) };
};
feedbackMessage.value = 'Très bon jeu, le parcours est clair.';
feedbackForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise(resolve => window.setTimeout(resolve, 0));
assert.equal(feedbackRequest?.url, 'https://formspree.io/f/mdekjdqz', 'AJAX envoie vers Formspree');
assert.equal(feedbackRequest?.options?.method, 'POST', 'AJAX utilise POST');
assert.equal(feedbackRequest?.options?.headers?.Accept, 'application/json', 'réponse JSON demandée');
assert.match(feedbackStatus.textContent, /Merci/i, 'succès visible après envoi');
assert.equal(feedbackMessage.value, '', 'formulaire vidé après succès');

let releaseFeedback;
let feedbackCalls = 0;
window.fetch = () => {
  feedbackCalls++;
  return new Promise(resolve => {
    releaseFeedback = () => resolve({ ok: true, json: async () => ({ ok: true }) });
  });
};
feedbackMessage.value = 'Un seul envoi même avec un double clic.';
feedbackForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
feedbackForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
assert.equal(feedbackCalls, 1, 'double soumission bloquée pendant la requête');
assert.equal(feedbackSubmit.disabled, true, 'bouton désactivé pendant envoi');
releaseFeedback();
await new Promise(resolve => window.setTimeout(resolve, 0));
assert.equal(feedbackSubmit.disabled, false, 'bouton réactivé après envoi');

const retainedFeedback = 'Conserver ce commentaire si le réseau tombe.';
window.fetch = async () => ({ ok: false, status: 503, json: async () => ({ errors: [{ message: 'indisponible' }] }) });
feedbackMessage.value = retainedFeedback;
feedbackForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise(resolve => window.setTimeout(resolve, 0));
assert.match(feedbackStatus.textContent, /impossible/i, 'échec réseau expliqué');
assert.equal(feedbackMessage.value, retainedFeedback, 'commentaire conservé après échec réseau');

assert.deepEqual({
  cookies: state.cookies.toJSON(),
  produced: state.totalProduced.toJSON(),
  clicks: state.totalClicks,
  upgrades: [...state.ownedUpgrades],
  prestige: [...state.ownedPrestigeUpgrades],
}, feedbackStateBefore, 'feedback ne modifie aucun état de jeu');

window.close();
console.log('Interface simulée : vérifications ciblées réussies');
