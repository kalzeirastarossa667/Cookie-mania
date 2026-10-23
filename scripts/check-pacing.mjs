import assert from 'node:assert/strict';
import { test } from 'node:test';
import fc from 'fast-check';
import { createPurchaseObserver, diagnosePacing } from './pacing-diagnostics.mjs';

const action = (seconds, quantity = 1, mode = 'single') => ({
  seconds, action: { kind: 'generator', id: 'cursor', mode }, result: { ok: quantity > 0, quantity }
});
const run = (seconds, purchases, stopReason = 'target-reached') => ({ seconds, purchases, stopReason });

// All successful transactions count, even repeated purchases without new O1 events.
const observer = createPurchaseObserver();
observer.observe(action(2));
observer.observe(action(2, 10, 'x10'));
observer.observe(action(3, 0));
observer.observe(action(7, 4, 'max'));
observer.observe({ seconds: 9, action: { kind: 'upgrade', id: 'expert_cursor', mode: 'research' }, result: { ok: true, quantity: 1 } });
const activity = observer.finish(run(12, 4, 'horizon'));
assert.equal(activity.transactions, 4);
assert.equal(activity.generatorUnits, 15);
assert.equal(activity.researchPurchases, 1);
assert.equal(activity.sameSecondPurchases, 1);
assert.equal(activity.totalObservedSeconds, 12);
assert.equal(activity.positiveIntervalCount, 4);
assert.deepEqual(activity.longestIntervals.map(x => x.durationSeconds), [5, 3, 2, 2]);
assert.deepEqual(activity.longestIntervals.map(x => x.fromSeconds), [2, 9, 0, 7]);
assert.equal(activity.longestIntervals[0].toAction.mode, 'max');
assert.equal(activity.longestIntervals[1].endedBy, 'window-end');
assert.equal(activity.longestIntervals[1].toAction, null);
assert.equal(activity.stopReason, 'horizon');
assert.throws(() => observer.observe(action(13)), /closed/);
assert.throws(() => observer.finish(run(12, 4)), /closed/);

for (const stopReason of ['no-income', 'horizon', 'step-limit']) {
  const seconds = stopReason === 'no-income' ? 0 : 10;
  const empty = createPurchaseObserver().finish(run(seconds, 0, stopReason));
  assert.equal(empty.maxIntervalSeconds, seconds === 0 ? null : seconds);
  assert.equal(empty.totalObservedSeconds, seconds);
  assert.equal(empty.transactions, 0);
}
const bounded = createPurchaseObserver();
for (let i = 1; i <= 10; i++) bounded.observe(action(i));
assert.deepEqual(bounded.finish(run(10, 10)).longestIntervals.map(x => x.fromSeconds), [0, 1, 2, 3, 4]);
for (const seconds of [NaN, Infinity, -1]) {
  assert.throws(() => createPurchaseObserver().observe(action(seconds)), /time/);
  assert.throws(() => createPurchaseObserver().finish(run(seconds, 0)), /time/);
}
assert.throws(() => createPurchaseObserver().observe(action(1, 1.5)), /quantity/);
const backwards = createPurchaseObserver();
backwards.observe(action(2));
assert.throws(() => backwards.observe(action(1)), /time/);
assert.throws(() => backwards.finish(run(1, 1)), /time/);
assert.throws(() => backwards.finish(run(2, 2)), /count/);
const immediate = createPurchaseObserver();
immediate.observe(action(0));
const instant = immediate.finish(run(0, 1));
assert.equal(instant.transactions, 1);
assert.equal(instant.sameSecondPurchases, 0);
assert.equal(instant.maxIntervalSeconds, null);
assert.throws(() => createPurchaseObserver().observe(action(0, Infinity)), /quantity/);

const milestone = (key, atSeconds, cycle = 1) => ({ key, reached: atSeconds !== null, atSeconds, cycle: atSeconds === null ? null : cycle });
const cycle = (number, duration, stopReason = 'target-reached') => ({
  cycle: number, reached: duration !== null, cycleDurationSeconds: duration, stopReason
});
const timeline = {
  contractVersion: 1, name: 'fixture', mode: 'prestige-cycles',
  milestones: [milestone('era:workshop', 2), milestone('era:orbit', 20), milestone('era:cosmos', null),
    milestone('specialization:expert_cursor', 3), milestone('research:expert_cursor', 9),
    milestone('specialization:expert_oven', 12), milestone('research:expert_oven', 40, 2),
    milestone('specialization:expert_grandma', 13), milestone('research:expert_grandma', null),
    milestone('specialization:first-access', 3)],
  cycles: [cycle(1, 100), cycle(2, 80), cycle(3, null, 'horizon'), cycle(4, null, 'not-started')]
};
// Complete O1 window metadata, including unfinished/unstarted cycles.
// These fixtures intentionally buy nothing; the observer itself is tested above.
function fixture(source) {
  let elapsedSeconds = 0;
  const purchaseWindows = [];
  const cycles = source.cycles.map(row => {
    const startSeconds = elapsedSeconds;
    const observedSeconds = row.cycleDurationSeconds ?? 0;
    elapsedSeconds += observedSeconds;
    if (row.stopReason !== 'not-started') {
      purchaseWindows.push({ cycle: row.cycle, startSeconds, transactions: 0,
        generatorUnits: 0, researchPurchases: 0, sameSecondPurchases: 0,
        totalObservedSeconds: observedSeconds, positiveIntervalCount: observedSeconds > 0 ? 1 : 0,
        maxIntervalSeconds: observedSeconds > 0 ? observedSeconds : null,
        longestIntervals: observedSeconds > 0 ? [{ fromSeconds: 0, toSeconds: observedSeconds,
          durationSeconds: observedSeconds, fromAction: null, toAction: null, endedBy: 'window-end' }] : [],
        stopReason: row.stopReason });
    }
    return { ...row, observedSeconds, elapsedSeconds, purchases: 0 };
  });
  return { timeline: { ...source, cycles, elapsedSeconds }, purchaseWindows };
}
function diagnoseFixture(source) {
  const { timeline, purchaseWindows } = fixture(source);
  return diagnosePacing(timeline, purchaseWindows);
}
const before = JSON.stringify(timeline);
const result = diagnoseFixture(timeline);
assert.equal(JSON.stringify(timeline), before);
assert.equal(result.eraTransitions[1].secondsFromPreviousEra, 18);
assert.equal(result.eraTransitions[2].secondsFromPreviousEra, null);
assert.equal(result.specializations.length, 3);
assert.equal(result.specializations[0].delaySeconds, 6);
assert.equal(result.specializations[1].status, 'different-cycles');
assert.equal(result.specializations[1].delaySeconds, null);
assert.equal(result.specializations[2].status, 'purchase-unobserved');
assert.equal(result.prestigeCycles[0].ratioToPrevious, null);
assert.equal(result.prestigeCycles[1].ratioToPrevious, 0.8);
assert.ok(Math.abs(result.prestigeCycles[1].reductionPercent - 20) < 1e-12);
assert.equal(result.prestigeCycles[2].ratioToPrevious, null);
assert.equal(result.prestigeCycles[3].stopReason, 'not-started');
assert.deepEqual(result.unobservedMilestones, ['era:cosmos', 'research:expert_grandma']);
assert.equal(diagnoseFixture({ ...timeline, mode: 'continuous', cycles: [{ ...cycle(1, null, 'horizon'), reached: false }] }).prestigeCycles.length, 0);
assert.equal(diagnoseFixture({ ...timeline, cycles: [cycle(1, 0), cycle(2, 5)] }).prestigeCycles[1].ratioToPrevious, null);
assert.throws(() => diagnoseFixture({ ...timeline, contractVersion: 2 }), /contract/);
assert.throws(() => diagnoseFixture({ ...timeline, cycles: [cycle(1, Infinity)] }), /duration/);
assert.throws(() => diagnoseFixture({ ...timeline, milestones: [milestone('era:workshop', NaN)] }), /time/);
const reversed = diagnoseFixture({ ...timeline, milestones: [milestone('era:workshop', 20), milestone('era:orbit', 10)] });
assert.equal(reversed.eraTransitions[1].secondsFromPreviousEra, null);
assert.equal(reversed.eraTransitions[1].status, 'reverse-order');
const slowdown = diagnoseFixture({ ...timeline, cycles: [cycle(1, 100), cycle(2, 150)] });
assert.equal(slowdown.prestigeCycles[1].reductionPercent, -50);
assert.equal(diagnoseFixture({ ...timeline, cycles: [cycle(1, null, 'horizon'), cycle(2, 150)] }).prestigeCycles[1].ratioToPrevious, null);
console.log('Pacing historical assertions O2: PASS (audit tests follow)');

test('purchase labels must agree with runtime quantities, rejection is atomic', () => {
  for (const [kind, mode, quantity] of [['generator', 'x10', 1], ['generator', 'single', 2], ['upgrade', 'research', 2]]) {
    const observed = createPurchaseObserver();
    assert.throws(() => observed.observe({ ...action(1, quantity, mode), action: { kind, id: 'cursor', mode } }), /quantity/);
    assert.equal(observed.finish(run(1, 0)).transactions, 0);
  }
});

test('integer-second observations reject fractional and unsafe times before mutation', () => {
  for (const seconds of [0.1, Number.MAX_SAFE_INTEGER + 1]) {
    const observed = createPurchaseObserver();
    assert.throws(() => observed.observe(action(seconds)), /time/);
    assert.throws(() => observed.finish(run(seconds, 0)), /time/);
    assert.equal(observed.finish(run(1, 0)).totalObservedSeconds, 1);
  }
});

test('unidentified cycles cannot produce measured milestone delays', () => {
  for (const invalid of [null, undefined, 0, 1.5, NaN]) {
    const source = { ...timeline, milestones: [milestone('era:workshop', 1, invalid), milestone('era:orbit', 10, invalid)] };
    // Passing undefined to the helper invokes its default; assign it explicitly.
    source.milestones.forEach(item => { item.cycle = invalid; });
    assert.throws(() => diagnoseFixture(source), /cycle/);
  }
  assert.throws(() => diagnoseFixture({ ...timeline, milestones: [{ ...milestone('era:workshop', 1), reached: 'yes' }] }), /reached/);
  assert.throws(() => diagnoseFixture({ ...timeline, milestones: [{ ...milestone('era:workshop', null), cycle: 1 }] }), /cycle/);
});

test('prestige comparison requires a complete consecutively numbered O1 cycle list', () => {
  for (const cycles of [[cycle(1, 100), cycle(3, 50)], [cycle(1, 100), cycle(1, 50)]]) {
    assert.throws(() => diagnoseFixture({ ...timeline, cycles }), /cycle/);
  }
  assert.throws(() => diagnoseFixture({ ...timeline, mode: 'unknown' }), /mode/);
});

test('missing or mismatched purchase windows fail instead of silently disabling O2', () => {
  const data = fixture(timeline);
  assert.throws(() => diagnosePacing(data.timeline, []), /window/);
  const mutations = [
    windows => { windows.pop(); },
    windows => { windows.push(structuredClone(windows[0])); },
    windows => { windows[0].cycle = 2; },
    windows => { windows[0].startSeconds = 10; },
    windows => { windows[0].transactions = 1; },
    windows => { windows[0].totalObservedSeconds = 99; },
    windows => { windows[0].stopReason = 'no-income'; },
    windows => { windows[0].maxIntervalSeconds = NaN; },
    windows => { windows[0].longestIntervals[0].durationSeconds = Infinity; }
  ];
  for (const mutate of mutations) {
    const windows = structuredClone(data.purchaseWindows);
    mutate(windows);
    assert.throws(() => diagnosePacing(data.timeline, windows), /window/);
  }
});

test('bounded interval collector agrees with an independent full chronological trace', () => {
  fc.assert(fc.property(fc.array(fc.record({ wait: fc.integer({ min: 0, max: 30 }),
    mode: fc.constantFrom('single', 'x10', 'max', 'research'), quantity: fc.integer({ min: 1, max: 20 }) }), { maxLength: 80 }),
  fc.integer({ min: 0, max: 30 }), (steps, tail) => {
    const observed = createPurchaseObserver(), events = [];
    let seconds = 0, units = 0, researches = 0;
    for (const step of steps) {
      seconds += step.wait;
      const quantity = step.mode === 'x10' ? 10 : step.mode === 'max' ? step.quantity : 1;
      const kind = step.mode === 'research' ? 'upgrade' : 'generator';
      observed.observe({ seconds, action: { kind, id: 'fixture', mode: step.mode }, result: { ok: true, quantity } });
      events.push(seconds);
      if (kind === 'generator') units += quantity; else researches++;
    }
    const end = seconds + tail;
    const actual = observed.finish(run(end, events.length, 'horizon'));
    const boundaries = [0, ...events, end];
    const intervals = boundaries.slice(1).map((to, i) => ({ from: boundaries[i], to, duration: to - boundaries[i] })).filter(row => row.duration > 0);
    const expected = [...intervals].sort((a, b) => b.duration - a.duration || a.from - b.from).slice(0, 5);
    assert.deepEqual(actual.longestIntervals.map(row => ({ from: row.fromSeconds, to: row.toSeconds, duration: row.durationSeconds })), expected);
    assert.equal(actual.totalObservedSeconds, end);
    assert.equal(actual.positiveIntervalCount, intervals.length);
    assert.equal(actual.generatorUnits, units);
    assert.equal(actual.researchPurchases, researches);
    assert.equal(actual.sameSecondPurchases, events.filter((at, i) => i > 0 && at === events[i - 1]).length);
  }), { seed: 22022026, numRuns: 200 });
});
