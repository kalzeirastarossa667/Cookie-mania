import assert from 'node:assert/strict';
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
const before = JSON.stringify(timeline);
const result = diagnosePacing(timeline, []);
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
assert.equal(diagnosePacing({ ...timeline, mode: 'continuous' }, []).prestigeCycles.length, 0);
assert.equal(diagnosePacing({ ...timeline, cycles: [cycle(1, 0), cycle(2, 5)] }, []).prestigeCycles[1].ratioToPrevious, null);
assert.throws(() => diagnosePacing({ ...timeline, contractVersion: 2 }, []), /contract/);
assert.throws(() => diagnosePacing({ ...timeline, cycles: [cycle(1, Infinity)] }, []), /duration/);
assert.throws(() => diagnosePacing({ ...timeline, milestones: [milestone('era:workshop', NaN)] }, []), /time/);
const reversed = diagnosePacing({ ...timeline, milestones: [milestone('era:workshop', 20), milestone('era:orbit', 10)] }, []);
assert.equal(reversed.eraTransitions[1].secondsFromPreviousEra, null);
assert.equal(reversed.eraTransitions[1].status, 'reverse-order');
const slowdown = diagnosePacing({ ...timeline, cycles: [cycle(1, 100), cycle(2, 150)] }, []);
assert.equal(slowdown.prestigeCycles[1].reductionPercent, -50);
assert.equal(diagnosePacing({ ...timeline, cycles: [cycle(1, null, 'horizon'), cycle(2, 150)] }, []).prestigeCycles[1].ratioToPrevious, null);
console.log('Pacing contracts O2: PASS');
