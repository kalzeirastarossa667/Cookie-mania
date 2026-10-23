// Development-only, read-only diagnostics using injected real runtime APIs.
export function createEconomicDiagnostics({ HugeNumber, Economy: E, GENERATORS, UPGRADES, GENERATOR_ERAS }) {
  const fields = ['cookies', 'totalProduced', 'cps', 'clickReward', 'modeledIncome', 'prestigePoints', 'prestigeCurrency'];
  const rates = ['cps', 'clickReward', 'modeledIncome'];
  const zero = () => ({ m: 0, e: 0 });
  const check = (condition, message) => { if (!condition) throw new Error('O2 economics: ' + message); };
  function pair(value) {
    check(value && Number.isFinite(value.m) && Number.isSafeInteger(value.e) &&
      (value.m === 0 ? value.e === 0 : value.m >= 1 && value.m < 10), 'noncanonical number');
    return { m: value.m, e: value.e };
  }
  const number = value => HugeNumber.fromJSON(pair(value));
  const compare = (a, b) => E.compare(number(a), number(b));
  const add = (a, b) => pair(E.add(number(a), number(b)));
  function ratio(a, b) { return b.m === 0 ? null : pair(E.divide(number(a), number(b))); }
  function delta(before, after) {
    const sign = compare(after, before);
    return { sign, magnitude: pair(sign < 0 ? E.subtract(number(before), number(after)) : E.subtract(number(after), number(before))) };
  }
  function time(seconds, minimum = 0) {
    check(Number.isSafeInteger(seconds) && seconds >= minimum, 'invalid observation time');
  }
  function capture(state, clickRate) {
    check(Number.isFinite(clickRate) && clickRate >= 0, 'invalid click rate');
    const derived = E.deriveValues(state);
    return Object.fromEntries(fields.map(key => [key, pair(key === 'modeledIncome'
      ? E.add(derived.cps, E.multiply(derived.clickReward, clickRate)) : derived[key] ?? state[key])]));
  }
  function relevance(state, clickRate) {
    const values = capture(state, clickRate), multipliers = E.deriveMultipliers(state);
    const rows = Object.keys(GENERATORS).map(id => {
      const owned = state.generators[id];
      check(Number.isSafeInteger(owned) && owned >= 0, 'invalid ownership');
      const stackCps = pair(E.generatorStackCps(state, id, multipliers));
      const stackClick = pair(E.generatorStackClick(state, id, multipliers));
      const stackIncome = pair(E.add(number(stackCps), E.multiply(number(stackClick), clickRate)));
      const unitCps = pair(E.generatorUnitCps(id, multipliers));
      const unitClick = pair(E.generatorUnitClick(id, multipliers));
      const unitIncome = pair(E.add(number(unitCps), E.multiply(number(unitClick), clickRate)));
      const cost = owned < Number.MAX_SAFE_INTEGER ? pair(E.generatorCost(GENERATORS[id], owned)) : null;
      const status = cost === null ? 'quantity-limit' : compare(values.cookies, cost) >= 0 ? 'available' : 'insufficient';
      return { id, owned, stackCps, stackClick, stackIncome,
        cpsShare: ratio(stackCps, values.cps), clickShare: ratio(stackClick, values.clickReward),
        incomeShare: ratio(stackIncome, values.modeledIncome),
        nextUnit: { status, cost, cps: unitCps, clickReward: unitClick, modeledIncome: unitIncome,
          relativeIncomeGain: ratio(unitIncome, values.modeledIncome), incomePerCost: cost === null ? null : ratio(unitIncome, cost) } };
    });
    for (const row of rows) {
      row.dominatedBy = row.nextUnit.status !== 'available' ? [] : rows.filter(other => other.id !== row.id &&
        other.nextUnit.status === 'available' && compare(other.nextUnit.cost, row.nextUnit.cost) <= 0 &&
        compare(other.nextUnit.modeledIncome, row.nextUnit.modeledIncome) >= 0 &&
        (compare(other.nextUnit.cost, row.nextUnit.cost) < 0 || compare(other.nextUnit.modeledIncome, row.nextUnit.modeledIncome) > 0))
        .map(other => other.id);
      row.signal = row.owned === 0 ? 'unowned' : row.nextUnit.status !== 'available' ? 'not-assessed-unavailable'
        : row.dominatedBy.length ? 'potential-next-unit-obsolescence' : 'no-local-dominance';
    }
    return rows;
  }
  function createWindow(state, clickRate) {
    let closed = false, lastSeconds = 0, transactions = 0, waits = 0, lastValues;
    const groups = new Map(), samples = [], generatorSnapshots = [], maxima = {};
    const acquiredEras = new Set(GENERATOR_ERAS.filter(era => era.ids.some(id => state.generators[id] > 0)).map(era => era.id));
    const ensureOpen = () => check(!closed, 'observer closed');
    function track(values, seconds, phase) {
      for (const key of fields) {
        if (!maxima[key] || compare(values[key], maxima[key].value) > 0)
          maxima[key] = { value: values[key], seconds, phase };
      }
      lastSeconds = seconds;
      lastValues = values;
    }
    function checkpoint(current, values, seconds, phase) {
      samples.push({ seconds, phase, values });
      generatorSnapshots.push({ seconds, phase, generators: relevance(current, clickRate) });
    }
    const start = capture(state, clickRate);
    track(start, 0, 'window-start');
    checkpoint(state, start, 0, 'window-start');
    return {
      capture: current => capture(current, clickRate),
      observeWait(current, seconds) {
        ensureOpen(); time(seconds, lastSeconds);
        track(capture(current, clickRate), seconds, 'wait-end');
        waits++;
      },
      observePurchase({ seconds, action, result, before, state: current }) {
        ensureOpen(); time(seconds, lastSeconds);
        check(result.ok === true && Number.isSafeInteger(result.quantity) && result.quantity > 0, 'unsuccessful purchase');
        const catalogue = action.kind === 'generator' ? GENERATORS : action.kind === 'upgrade' ? UPGRADES : {};
        check(Object.hasOwn(catalogue, action.id) &&
          (action.kind === 'generator' ? ['single', 'x10', 'max'] : ['research']).includes(action.mode), 'invalid action');
        check(action.mode === 'max' || result.quantity === (action.mode === 'x10' ? 10 : 1), 'mode/quantity mismatch');
        const beforeValues = Object.fromEntries(fields.map(key => [key, pair(before[key])]));
        check(fields.every(key => compare(beforeValues[key], lastValues[key]) === 0), 'stale pre-purchase state');
        const after = capture(current, clickRate), cost = pair(result.cost);
        check(compare(beforeValues.cookies, after.cookies) >= 0 &&
          compare(delta(after.cookies, beforeValues.cookies).magnitude, cost) === 0, 'paid cost mismatch');
        const changes = Object.fromEntries(rates.map(key => [key, delta(beforeValues[key], after[key])]));
        const incomeChange = changes.modeledIncome;
        const sample = { seconds, quantity: result.quantity, cost,
          before: Object.fromEntries(rates.map(key => [key, beforeValues[key]])),
          after: Object.fromEntries(rates.map(key => [key, after[key]])), changes,
          relativeIncomeChange: { sign: incomeChange.sign, magnitude: ratio(incomeChange.magnitude, beforeValues.modeledIncome) },
          paybackSeconds: incomeChange.sign > 0 ? ratio(cost, incomeChange.magnitude) : null };
        const key = [action.kind, action.id, action.mode].join(':');
        const group = groups.get(key) ?? { kind: action.kind, id: action.id, mode: action.mode, transactions: 0, units: 0,
          totalCost: zero(), changes: Object.fromEntries(rates.map(rate => [rate, { increases: zero(), decreases: zero() }])), first: sample, last: sample };
        check(Number.isSafeInteger(group.units + result.quantity), 'unsafe aggregate units');
        group.transactions++; group.units += result.quantity; group.totalCost = add(group.totalCost, cost); group.last = sample;
        for (const rate of rates) {
          const change = changes[rate], side = change.sign < 0 ? 'decreases' : 'increases';
          group.changes[rate][side] = add(group.changes[rate][side], change.magnitude);
        }
        groups.set(key, group); transactions++;
        track(after, seconds, 'purchase');
        for (const era of GENERATOR_ERAS) {
          if (!acquiredEras.has(era.id) && era.ids.some(id => current.generators[id] > 0)) {
            checkpoint(current, after, seconds, 'era:' + era.id);
            acquiredEras.add(era.id);
          }
        }
      },
      finish(run) {
        ensureOpen(); time(run.seconds, lastSeconds);
        check(run.purchases === transactions, 'purchase count mismatch');
        check(['target-reached', 'no-income', 'horizon', 'step-limit'].includes(run.stopReason), 'invalid stop reason');
        check(Number.isSafeInteger(run.steps) && run.steps === transactions + waits + (run.stopReason === 'no-income' ? 1 : 0), 'wait coverage');
        const end = capture(state, clickRate);
        track(end, run.seconds, 'window-end');
        checkpoint(state, end, run.seconds, 'window-end');
        closed = true;
        return { observedSeconds: run.seconds, stopReason: run.stopReason, transactions, waits,
          purchaseContribution: [...groups.values()], generatorRelevance: generatorSnapshots,
          numericGrowth: { samples, maxima, resetAfter: null } };
      }
    };
  }
  return { capture, relevance, createWindow, delta, pair };
}

// Fail if the integration is missing, incomplete or detached from O1.
export function validateEconomicWindows(timeline, windows) {
  const fail = message => { throw new Error('O2 economics: ' + message); };
  if (!Array.isArray(windows)) fail('missing windows');
  const started = timeline.cycles.filter(cycle => cycle.stopReason !== 'not-started');
  if (windows.length !== started.length) fail('window coverage');
  for (const [i, cycle] of started.entries()) {
    const row = windows[i];
    if (row.cycle !== cycle.cycle || row.startSeconds !== cycle.elapsedSeconds - cycle.observedSeconds ||
        row.observedSeconds !== cycle.observedSeconds || row.stopReason !== cycle.stopReason || row.transactions !== cycle.purchases)
      fail('cycle mismatch');
    if (row.purchaseContribution.reduce((sum, group) => sum + group.transactions, 0) !== row.transactions) fail('purchase coverage');
    const purchases = timeline.purchaseWindows?.find(window => window.cycle === cycle.cycle);
    if (!purchases || row.purchaseContribution.filter(group => group.kind === 'generator').reduce((sum, group) => sum + group.units, 0) !== purchases.generatorUnits ||
        row.purchaseContribution.filter(group => group.kind === 'upgrade').reduce((sum, group) => sum + group.transactions, 0) !== purchases.researchPurchases)
      fail('purchase unit coverage');
    const samples = row.numericGrowth.samples;
    if (samples[0]?.phase !== 'window-start' || samples[0].seconds !== 0 ||
        samples.at(-1)?.phase !== 'window-end' || samples.at(-1).seconds !== row.observedSeconds) fail('sample coverage');
    const reset = row.numericGrowth.resetAfter;
    if (timeline.mode === 'prestige-cycles' && cycle.reached) {
      if (!reset || reset.seconds !== row.observedSeconds || reset.phase !== 'prestige-reset') fail('missing reset');
      if (windows[i + 1] && JSON.stringify(reset.values) !== JSON.stringify(windows[i + 1].numericGrowth.samples[0].values)) fail('reset continuity');
    } else if (reset !== null) fail('unexpected reset');
  }
}
