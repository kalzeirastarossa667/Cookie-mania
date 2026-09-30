import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import * as fc from 'fast-check';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error('Script du jeu introuvable');

const context = createContext({
  console: { table() {}, error() {} },
  document: { hidden: false, createElement: () => ({}), getElementById: () => ({}) },
  window: { addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  requestAnimationFrame() {},
  setTimeout,
  clearTimeout,
});
new Script(match[1], { filename: 'index.html' }).runInContext(context);
new Script('globalThis.__quality={HugeNumber,Economy,GENERATORS};').runInContext(context);
const { HugeNumber, Economy, GENERATORS } = context.__quality;

function log10(value) {
  const n = HugeNumber.from(value);
  return n.isZero() ? -Infinity : Math.log10(n.m) + n.e;
}
function close(a, b, tolerance = 1e-11) {
  const left = HugeNumber.from(a), right = HugeNumber.from(b);
  if (left.isZero() || right.isZero()) return left.isZero() && right.isZero();
  return Math.abs(log10(left) - log10(right)) <= tolerance;
}

// Red gate: this exact case is mathematically 1e997 and fails on Foundation 2.7.2.
const tinyHuge = HugeNumber.from('0.001e1000');
const tinyHugeExpected = HugeNumber.from('1e997');
assert.equal(
  tinyHuge.compare(tinyHugeExpected),
  0,
  '2.8 RED: HugeNumber interprète mal un coefficient scientifique < 1 au-delà de Number.MAX_VALUE',
);

const seed = 20260930;
const scalar = fc.record({
  mantissa: fc.integer({ min: 1, max: 9_999_999 }),
  exponent: fc.integer({ min: -1000, max: 1000 }),
}).map(({ mantissa, exponent }) => new HugeNumber(mantissa / 1_000_000, exponent));

fc.assert(fc.property(scalar, value => {
  if (value.isZero()) return true;
  return value.m >= 1 && value.m < 10 && Number.isInteger(value.e);
}), { seed, numRuns: 250 });

fc.assert(fc.property(scalar, scalar, (a, b) => {
  return a.compare(b) === -b.compare(a);
}), { seed: seed + 1, numRuns: 250 });

fc.assert(fc.property(scalar, scalar, (a, b) => {
  return close(a.add(b), b.add(a));
}), { seed: seed + 2, numRuns: 250 });

fc.assert(fc.property(scalar, scalar, (a, b) => {
  return close(a.multiply(b), b.multiply(a));
}), { seed: seed + 3, numRuns: 250 });

fc.assert(fc.property(scalar, scalar.filter(value => !value.isZero()), (a, b) => {
  return close(a.multiply(b).divide(b), a, 2e-11);
}), { seed: seed + 4, numRuns: 250 });

const generatorIds = Object.keys(GENERATORS);
fc.assert(fc.property(
  fc.constantFrom(...generatorIds),
  fc.integer({ min: 0, max: 40 }),
  fc.integer({ min: 1, max: 12 }),
  (id, owned, quantity) => {
    const definition = GENERATORS[id];
    const batch = Economy.generatorBatchCost(definition, owned, quantity);
    let sequential = HugeNumber.zero();
    for (let i = 0; i < quantity; i++) {
      sequential = sequential.add(Economy.generatorCost(definition, owned + i));
    }
    return close(batch, sequential, 5e-11);
  }),
  { seed: seed + 5, numRuns: 180 },
);

fc.assert(fc.property(
  fc.constantFrom(...generatorIds),
  fc.integer({ min: 0, max: 40 }),
  fc.integer({ min: 1, max: 20 }),
  (id, owned, quantity) => {
    const definition = GENERATORS[id];
    const balance = Economy.generatorBatchCost(definition, owned, quantity);
    const max = Economy.maxAffordableGeneratorCount(definition, owned, balance);
    if (max !== quantity) return false;
    const spent = Economy.generatorBatchCost(definition, owned, max);
    return spent.compare(balance) <= 0;
  }),
  { seed: seed + 6, numRuns: 180 },
);

console.log('Propriétés 2.8 : PASS (HugeNumber + coûts générateurs, seeds déterministes)');
