import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { createEconomicDiagnostics, validateEconomicWindows } from './economic-diagnostics.mjs';

const context = createContext({ console: { table() {}, error() {} }, document: { getElementById() { return null; } },
  window: { addEventListener() {} }, requestAnimationFrame() {},
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, setTimeout, clearTimeout });
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]).runInContext(context);
new Script('globalThis.api={HugeNumber,Economy,GENERATORS,UPGRADES,GENERATOR_ERAS,GameState,GameEngine};').runInContext(context);
const { HugeNumber: H, Economy: E, GameState, GameEngine, GENERATORS, GENERATOR_ERAS } = context.api;
const diagnostics = createEconomicDiagnostics(context.api);
const pair = n => diagnostics.pair(n);
const number = p => H.fromJSON(p);
const plain = value => JSON.parse(JSON.stringify(value));
function equalNumber(actual, expected) { assert.equal(E.compare(number(actual), expected), 0); }
function fresh(funds = '1e12') {
  const state = GameState.create(); state.cookies = H.from(funds); state.totalProduced = state.cookies.clone();
  return { state, engine: new GameEngine(state) };
}
function buy(observed, state, engine, seconds, id, mode = 'single') {
  const before = observed.capture(state), kind = mode === 'research' ? 'upgrade' : 'generator';
  const action = { kind, id, mode };
  const quantity = mode === 'single' ? Number(engine.buyGenerator(id)) : mode === 'x10' ? engine.buyGenerators(id, 10)
    : mode === 'max' ? engine.buyMaxGenerator(id) : Number(engine.buyUpgrade(id));
  assert.ok(quantity > 0, 'fixture must perform a real successful purchase');
  const result = { ok: true, quantity, cost: E.subtract(number(before.cookies), state.cookies) };
  observed.observePurchase({ seconds, action, result, before, state });
  return { before, result };
}
const run = (seconds, purchases, waits = 0, stopReason = 'horizon') => ({ seconds, purchases, steps: purchases + waits + (stopReason === 'no-income' ? 1 : 0), stopReason });
const emptyPurchases = cycle => ({ cycle, generatorUnits: 0, researchPurchases: 0 });

test('real x1/x10/Max purchases preserve actual cost, quantity and separate CPS/click gains', () => {
  for (const mode of ['single', 'x10', 'max']) {
    const { state, engine } = fresh('1000'), observed = diagnostics.createWindow(state, 2);
    const { result } = buy(observed, state, engine, 0, 'cursor', mode);
    const report = observed.finish(run(0, 1)), group = report.purchaseContribution[0], sample = group.first;
    assert.equal(group.units, result.quantity); assert.equal(group.transactions, 1);
    if (mode === 'x10') assert.equal(group.units, 10);
    if (mode === 'max') assert.ok(group.units > 10);
    equalNumber(group.totalCost, result.cost);
    equalNumber(sample.after.cps, state.cps);
    equalNumber(sample.after.clickReward, state.clickReward);
    equalNumber(sample.changes.cps.magnitude, state.cps);
    equalNumber(sample.changes.clickReward.magnitude, E.subtract(state.clickReward, 1));
    equalNumber(sample.changes.modeledIncome.magnitude, E.add(state.cps, E.multiply(E.subtract(state.clickReward, 1), 2)));
    equalNumber(sample.paybackSeconds, E.divide(result.cost, number(sample.changes.modeledIncome.magnitude)));
  }
});

test('research measures whole real transaction including synergy activation and click-only effects', () => {
  const { state, engine } = fresh();
  engine.buyGenerators('cursor', 10); engine.buyGenerators('grandma', 10); engine.buyUpgrade('expert_cursor');
  const observed = diagnostics.createWindow(state, 2);
  const before = { cps: state.cps.clone(), click: state.clickReward.clone() };
  buy(observed, state, engine, 0, 'expert_grandma', 'research');
  const afterSynergy = { cps: state.cps.clone(), click: state.clickReward.clone() };
  assert.equal(E.deriveActiveSynergies(state).length, 1);
  buy(observed, state, engine, 0, 'reinforced_click', 'research');
  const [synergy, click] = observed.finish(run(0, 2)).purchaseContribution;
  equalNumber(synergy.first.changes.cps.magnitude, E.subtract(afterSynergy.cps, before.cps));
  equalNumber(synergy.first.changes.clickReward.magnitude, E.subtract(afterSynergy.click, before.click));
  assert.equal(click.first.changes.cps.sign, 0);
  equalNumber(click.first.changes.clickReward.magnitude, afterSynergy.click);
  assert.equal(click.units, 1);
});

test('zero gain and zero denominators are explicit; negative deltas never clamp to zero', () => {
  const { state, engine } = fresh('1000'), observed = diagnostics.createWindow(state, 0);
  buy(observed, state, engine, 0, 'efficient_cursor', 'research'); // No cursor owned.
  const sample = observed.finish(run(0, 1)).purchaseContribution[0].first;
  assert.equal(sample.changes.modeledIncome.sign, 0); assert.equal(sample.paybackSeconds, null);
  assert.equal(sample.relativeIncomeChange.magnitude, null);
  assert.deepEqual(diagnostics.delta(pair(H.from(10)), pair(H.from(2))), { sign: -1, magnitude: { m: 8, e: 0 } });
  const zero = fresh('0').state, relevance = diagnostics.relevance(zero, 0);
  assert.equal(relevance[0].cpsShare, null); assert.equal(relevance[0].incomeShare, null);
  assert.equal(relevance[0].clickShare.m, 0); // Base click still exists at zero modeled clicks.
  const empty = diagnostics.createWindow(zero, 0).finish(run(0, 0, 0, 'no-income'));
  assert.equal(empty.purchaseContribution.length, 0);
  assert.equal(empty.numericGrowth.samples.length, 2);
});

test('generator shares and next-unit metrics agree with real engine; local dominance is conditional', () => {
  const { state, engine } = fresh('1000000');
  engine.buyGenerators('cursor', 50); engine.buyGenerator('grandma');
  const original = JSON.stringify(state), rows = diagnostics.relevance(state, 2);
  assert.equal(JSON.stringify(state), original, 'relevance must not mutate the live state');
  const cursor = rows.find(row => row.id === 'cursor');
  assert.ok(cursor.dominatedBy.includes('grandma'));
  assert.equal(cursor.signal, 'potential-next-unit-obsolescence');
  assert.equal(rows.find(row => row.id === 'oven').signal, 'unowned');
  const before = state.cps.clone(), click = state.clickReward.clone();
  engine.buyGenerator('cursor');
  // Addition avoids cancellation in subtraction of near-equal 15-digit values.
  assert.equal(E.compare(E.add(before, number(cursor.nextUnit.cps)), state.cps), 0);
  assert.equal(E.compare(E.add(click, number(cursor.nextUnit.clickReward)), state.clickReward), 0);
  state.cookies = H.zero();
  const unavailable = diagnostics.relevance(state, 2).find(row => row.id === 'cursor');
  assert.equal(unavailable.signal, 'not-assessed-unavailable'); assert.deepEqual(unavailable.dominatedBy, []);
  const totalCps = rows.reduce((sum, row) => E.add(sum, number(row.stackCps)), H.zero());
  equalNumber(pair(totalCps), before);
  // The base manual click is deliberately not attributed to any generator.
  const totalClick = rows.reduce((sum, row) => E.add(sum, number(row.stackClick)), H.zero());
  assert.equal(E.compare(totalClick, click), -1);
});

test('numeric endpoints retain pre-spend peaks, earliest ties and extreme HugeNumber pairs', () => {
  const { state, engine } = fresh('0'), observed = diagnostics.createWindow(state, 2);
  state.cookies = H.from(100); state.totalProduced = H.from(100);
  observed.observeWait(state, 5);
  buy(observed, state, engine, 5, 'cursor');
  const report = observed.finish(run(5, 1, 1));
  equalNumber(report.numericGrowth.maxima.cookies.value, 100);
  assert.equal(report.numericGrowth.maxima.cookies.phase, 'wait-end');
  assert.equal(report.numericGrowth.maxima.totalProduced.phase, 'wait-end');
  assert.equal(report.numericGrowth.maxima.cookies.seconds, 5);
  assert.ok(E.compare(number(report.numericGrowth.samples.at(-1).values.cookies), 100) < 0);
  for (const value of [new H(1, 1000), new H(1, -1000)]) {
    const extreme = fresh('0').state; extreme.cookies = value; extreme.totalProduced = value.clone();
    extreme.clickPower = value.clone(); E.refreshDerived(extreme);
    const original = JSON.stringify(extreme), snapshot = diagnostics.capture(extreme, 2);
    equalNumber(snapshot.cookies, value); equalNumber(snapshot.clickReward, value);
    assert.equal(JSON.stringify(extreme), original);
    const tinyShare = diagnostics.relevance(extreme, 2)[0].nextUnit.relativeIncomeGain;
    assert.ok(Number.isSafeInteger(tinyShare.e));
  }
  for (const bad of [{ m: NaN, e: 0 }, { m: 1, e: Infinity }, { m: 0, e: 2 }, { m: 1, e: 0.5 }])
    assert.throws(() => diagnostics.pair(bad), /noncanonical/);
});

test('retention is bounded by catalogue and eras, with complete aggregate transaction coverage', () => {
  const { state, engine } = fresh('1e30'), observed = diagnostics.createWindow(state, 2);
  for (let i = 0; i < 200; i++) buy(observed, state, engine, i, 'cursor');
  const report = observed.finish(run(200, 200));
  assert.equal(report.purchaseContribution.length, 1);
  const group = report.purchaseContribution[0];
  assert.equal(group.transactions, 200); assert.equal(group.units, 200);
  assert.equal(group.first.seconds, 0); assert.equal(group.last.seconds, 199);
  assert.equal(report.generatorRelevance.length, 3); // start, first Workshop acquisition, end
  assert.ok(report.generatorRelevance.length <= GENERATOR_ERAS.length + 2);
  assert.ok(report.generatorRelevance.every(row => row.generators.length === Object.keys(GENERATORS).length));
  assert.throws(() => observed.finish(run(200, 200)), /closed/);
});

test('actual prestige reset stays separate from cycle maxima and matches the next cycle start', () => {
  const { state, engine } = fresh('1e12'); engine.buyGenerator('cursor');
  const initialState = JSON.stringify(state), observed = diagnostics.createWindow(state, 2);
  const first = { cycle: 1, startSeconds: 0, ...observed.finish(run(0, 0, 0, 'target-reached')) };
  assert.equal(JSON.stringify(state), initialState);
  const candidate = engine.prestigeCandidate(); assert.ok(candidate);
  first.numericGrowth.resetAfter = { seconds: 0, phase: 'prestige-reset', values: diagnostics.capture(candidate.state, 2) };
  assert.ok(first.numericGrowth.maxima.cps.value.m > 0);
  assert.equal(first.numericGrowth.resetAfter.values.cps.m, 0);
  equalNumber(first.numericGrowth.resetAfter.values.prestigePoints, candidate.state.prestigePoints);
  const second = { cycle: 2, startSeconds: 0, ...diagnostics.createWindow(candidate.state, 2).finish(run(0, 0)) };
  const timeline = { mode: 'prestige-cycles', purchaseWindows: [emptyPurchases(1), emptyPurchases(2)], cycles: [
    { cycle: 1, observedSeconds: 0, elapsedSeconds: 0, purchases: 0, reached: true, stopReason: 'target-reached' },
    { cycle: 2, observedSeconds: 0, elapsedSeconds: 0, purchases: 0, reached: false, stopReason: 'horizon' },
    { cycle: 3, observedSeconds: 0, elapsedSeconds: 0, purchases: 0, reached: false, stopReason: 'not-started' }
  ] };
  validateEconomicWindows(timeline, [first, second]);
  second.numericGrowth.samples[0].values.prestigePoints = { m: 9, e: 9 };
  assert.throws(() => validateEconomicWindows(timeline, [first, second]), /reset continuity/);
});

test('missing purchases, waits, windows and reset boundaries fail rather than silently disabling diagnostics', () => {
  const { state } = fresh('0');
  assert.throws(() => diagnostics.createWindow(state, 0).finish(run(0, 1)), /purchase count/);
  assert.throws(() => diagnostics.createWindow(state, 0).finish(run(1, 0, 1)), /wait coverage/);
  const window = { cycle: 1, startSeconds: 0, ...diagnostics.createWindow(state, 0).finish(run(0, 0)) };
  const timeline = { mode: 'continuous', purchaseWindows: [emptyPurchases(1)], cycles: [{ cycle: 1, observedSeconds: 0, elapsedSeconds: 0, purchases: 0, reached: false, stopReason: 'horizon' }] };
  validateEconomicWindows(timeline, [window]);
  assert.throws(() => validateEconomicWindows(timeline, []), /coverage/);
  const changed = plain(window); changed.transactions = 1;
  assert.throws(() => validateEconomicWindows(timeline, [changed]), /cycle mismatch/);
  assert.throws(() => validateEconomicWindows({ ...timeline, purchaseWindows: [{ ...emptyPurchases(1), generatorUnits: 1 }] }, [window]), /unit coverage/);
  window.numericGrowth.resetAfter = { seconds: 0, phase: 'prestige-reset', values: diagnostics.capture(state, 0) };
  assert.throws(() => validateEconomicWindows(timeline, [window]), /unexpected reset/);
  const prestige = { ...timeline, mode: 'prestige-cycles', cycles: [{ ...timeline.cycles[0], reached: true }] };
  validateEconomicWindows(prestige, [window]);
  window.numericGrowth.resetAfter = null;
  assert.throws(() => validateEconomicWindows(prestige, [window]), /missing reset/);
});

test('invalid timestamps, refused or mismatched purchase observations do not enter economic aggregates', () => {
  const { state, engine } = fresh('1000'), observed = diagnostics.createWindow(state, 2);
  const before = observed.capture(state);
  const info = { seconds: 0, action: { kind: 'generator', id: 'cursor', mode: 'single' },
    result: { ok: false, quantity: 0, cost: H.zero() }, before, state };
  assert.throws(() => observed.observePurchase(info), /unsuccessful/);
  for (const seconds of [NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => observed.observeWait(state, seconds), /time/);
  engine.buyGenerator('cursor');
  info.result = { ok: true, quantity: 1, cost: H.from(999) };
  assert.throws(() => observed.observePurchase(info), /paid cost/);
  info.result.cost = E.subtract(number(before.cookies), state.cookies);
  observed.observePurchase(info);
  const report = observed.finish(run(0, 1));
  assert.equal(report.transactions, 1); assert.equal(report.purchaseContribution[0].units, 1);
});
