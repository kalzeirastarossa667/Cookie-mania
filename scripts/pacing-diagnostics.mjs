// Development-only observations. No economy rules, runtime mutation or policy decisions.
function time(value, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error('O2 invalid observation time');
  return value;
}

export function createPurchaseObserver() {
  let closed = false, previousSeconds = 0, previousAction = null;
  let transactions = 0, generatorUnits = 0, researchPurchases = 0, sameSecondPurchases = 0;
  let positiveIntervalCount = 0, totalObservedSeconds = 0;
  const longestIntervals = [];
  const ensureOpen = () => { if (closed) throw new Error('O2 observer closed'); };
  function interval(seconds, toAction, endedBy) {
    const durationSeconds = seconds - previousSeconds;
    totalObservedSeconds += durationSeconds;
    if (durationSeconds > 0) {
      positiveIntervalCount++;
      longestIntervals.push({ fromSeconds: previousSeconds, toSeconds: seconds, durationSeconds,
        fromAction: previousAction, toAction, endedBy });
      longestIntervals.sort((a, b) => b.durationSeconds - a.durationSeconds || a.fromSeconds - b.fromSeconds);
      longestIntervals.length = Math.min(5, longestIntervals.length);
    }
  }
  return {
    observe({ seconds, action, result }) {
      ensureOpen();
      if (result.ok === false && result.quantity === 0) return;
      time(seconds, previousSeconds);
      if (result.ok !== true || !Number.isSafeInteger(result.quantity) || result.quantity <= 0)
        throw new Error('O2 invalid purchase quantity');
      if (!['generator', 'upgrade'].includes(action.kind) || typeof action.id !== 'string' || !action.id ||
          !(action.kind === 'generator' ? ['single', 'x10', 'max'] : ['research']).includes(action.mode))
        throw new Error('O2 invalid purchase action');
      if ((action.mode === 'x10' && result.quantity !== 10) ||
          (['single', 'research'].includes(action.mode) && result.quantity !== 1))
        throw new Error('O2 purchase mode/quantity mismatch');
      if (action.kind === 'generator' && !Number.isSafeInteger(generatorUnits + result.quantity))
        throw new Error('O2 unsafe aggregate quantity');
      const description = { kind: action.kind, id: action.id, mode: action.mode, quantity: result.quantity };
      interval(seconds, description, 'purchase');
      if (transactions > 0 && seconds === previousSeconds) sameSecondPurchases++;
      transactions++;
      if (action.kind === 'generator') generatorUnits += result.quantity;
      else researchPurchases++;
      previousSeconds = seconds;
      previousAction = description;
    },
    finish(run) {
      ensureOpen();
      time(run.seconds, previousSeconds);
      if (run.purchases !== transactions) throw new Error('O2 observer/runtime purchase count mismatch');
      if (!['target-reached', 'no-income', 'horizon', 'step-limit'].includes(run.stopReason))
        throw new Error('O2 invalid stop reason');
      interval(run.seconds, null, 'window-end');
      if (totalObservedSeconds !== run.seconds) throw new Error('O2 observation duration mismatch');
      closed = true;
      return { transactions, generatorUnits, researchPurchases, sameSecondPurchases,
        totalObservedSeconds, positiveIntervalCount,
        maxIntervalSeconds: longestIntervals[0]?.durationSeconds ?? null,
        longestIntervals, stopReason: run.stopReason };
    }
  };
}

function validatePurchaseWindows(timeline, windows) {
  if (!Array.isArray(timeline.cycles) || !Array.isArray(windows)) throw new Error('O2 missing cycle/window list');
  // These are discrete observations, not economic values or computed ratios.
  function observationNumbers(value) {
    if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0))
      throw new Error('O2 invalid window number');
    if (value && typeof value === 'object') Object.values(value).forEach(observationNumbers);
  }
  let elapsed = 0, windowIndex = 0;
  for (const [index, row] of timeline.cycles.entries()) {
    if (row.cycle !== index + 1 || typeof row.reached !== 'boolean') throw new Error('O2 invalid cycle identity/reached');
    const completedPrestige = timeline.mode === 'prestige-cycles' && row.reached;
    if (completedPrestige ? (!Number.isSafeInteger(row.cycleDurationSeconds) || row.cycleDurationSeconds < 0)
      : row.cycleDurationSeconds !== null) throw new Error('O2 invalid prestige duration');
    time(row.observedSeconds);
    time(row.elapsedSeconds);
    if (row.elapsedSeconds !== elapsed + row.observedSeconds || !Number.isSafeInteger(row.purchases) || row.purchases < 0 ||
        (completedPrestige && row.cycleDurationSeconds !== row.observedSeconds)) throw new Error('O2 inconsistent cycle duration/count');
    if (!['target-reached', 'no-income', 'horizon', 'step-limit', 'not-started'].includes(row.stopReason) ||
        row.reached !== (row.stopReason === 'target-reached')) throw new Error('O2 invalid cycle stop reason');
    if (row.stopReason === 'not-started') {
      if (row.observedSeconds !== 0 || row.purchases !== 0) throw new Error('O2 unstarted cycle has observations');
    } else {
      const window = windows[windowIndex++];
      observationNumbers(window);
      if (!window || window.cycle !== row.cycle || window.startSeconds !== elapsed || window.transactions !== row.purchases ||
          window.totalObservedSeconds !== row.observedSeconds || window.stopReason !== row.stopReason)
        throw new Error('O2 missing or inconsistent purchase window');
      for (const key of ['generatorUnits', 'researchPurchases', 'sameSecondPurchases', 'positiveIntervalCount']) {
        if (!Number.isSafeInteger(window[key]) || window[key] < 0) throw new Error('O2 invalid window count');
      }
      if (window.researchPurchases > window.transactions || window.generatorUnits < window.transactions - window.researchPurchases ||
          window.sameSecondPurchases > Math.max(0, window.transactions - 1) || window.positiveIntervalCount > window.transactions + 1)
        throw new Error('O2 inconsistent window counts');
      const intervals = window.longestIntervals;
      if (!Array.isArray(intervals) || intervals.length !== Math.min(5, window.positiveIntervalCount) ||
          window.maxIntervalSeconds !== (intervals[0]?.durationSeconds ?? null)) throw new Error('O2 invalid window intervals');
      let sum = 0;
      for (const [i, interval] of intervals.entries()) {
        const previous = intervals[i - 1];
        if (!Number.isSafeInteger(interval.fromSeconds) || !Number.isSafeInteger(interval.toSeconds) ||
            interval.durationSeconds <= 0 || interval.toSeconds > row.observedSeconds ||
            interval.durationSeconds !== interval.toSeconds - interval.fromSeconds ||
            !['purchase', 'window-end'].includes(interval.endedBy) ||
            (interval.endedBy === 'window-end' && (interval.toAction !== null || interval.toSeconds !== row.observedSeconds)) ||
            (interval.endedBy === 'purchase' && (!interval.toAction || typeof interval.toAction !== 'object')) ||
            (previous && (previous.durationSeconds < interval.durationSeconds ||
              (previous.durationSeconds === interval.durationSeconds && previous.fromSeconds >= interval.fromSeconds))))
          throw new Error('O2 inconsistent window interval');
        sum += interval.durationSeconds;
      }
      if (sum > row.observedSeconds || (window.positiveIntervalCount <= 5 && sum !== row.observedSeconds))
        throw new Error('O2 inconsistent window interval duration');
    }
    elapsed = row.elapsedSeconds;
  }
  if (windowIndex !== windows.length || timeline.elapsedSeconds !== elapsed) throw new Error('O2 inconsistent window coverage');
}

export function diagnosePacing(timeline, purchaseWindows) {
  if (timeline.contractVersion !== 1) throw new Error('O2 unsupported O1 contract');
  if (!['prestige-cycles', 'continuous'].includes(timeline.mode)) throw new Error('O2 invalid timeline mode');
  validatePurchaseWindows(timeline, purchaseWindows);
  const byKey = new Map();
  for (const item of timeline.milestones) {
    if (typeof item.key !== 'string' || !item.key) throw new Error('O2 invalid milestone key');
    if (byKey.has(item.key)) throw new Error('O2 duplicate milestone');
    if (typeof item.reached !== 'boolean') throw new Error('O2 invalid milestone reached');
    if (item.reached) time(item.atSeconds);
    else if (item.atSeconds !== null) throw new Error('O2 unobserved milestone time');
    if (item.reached ? (!Number.isSafeInteger(item.cycle) || item.cycle < 1) : item.cycle !== null)
      throw new Error('O2 invalid milestone cycle');
    byKey.set(item.key, item);
  }
  const eras = timeline.milestones.filter(item => item.key.startsWith('era:'));
  const eraTransitions = eras.map((item, index) => {
    const previous = eras[index - 1];
    const comparable = item.reached && previous?.reached && item.cycle === previous.cycle && item.atSeconds >= previous.atSeconds;
    return { key: item.key, reached: item.reached, atSeconds: item.atSeconds,
      cycle: item.cycle, previousEra: previous?.key ?? null,
      secondsFromPreviousEra: comparable ? item.atSeconds - previous.atSeconds : null,
      status: !item.reached ? 'unobserved' : !previous ? 'first-era' : !previous.reached ? 'previous-unobserved'
        : item.cycle !== previous.cycle ? 'different-cycles' : !comparable ? 'reverse-order' : 'measured' };
  });
  const specializations = timeline.milestones
    .filter(item => item.key.startsWith('specialization:') && item.key !== 'specialization:first-access')
    .map(access => {
      const id = access.key.slice('specialization:'.length), purchase = byKey.get('research:' + id);
      const comparable = access.reached && purchase?.reached && access.cycle === purchase.cycle && purchase.atSeconds >= access.atSeconds;
      return { id, accessAtSeconds: access.atSeconds, purchaseAtSeconds: purchase?.atSeconds ?? null,
        accessCycle: access.cycle, purchaseCycle: purchase?.cycle ?? null,
        delaySeconds: comparable ? purchase.atSeconds - access.atSeconds : null,
        status: !access.reached ? 'access-unobserved' : !purchase?.reached ? 'purchase-unobserved'
          : access.cycle !== purchase.cycle ? 'different-cycles' : !comparable ? 'reverse-order' : 'measured' };
    });
  const prestigeCycles = timeline.mode !== 'prestige-cycles' ? [] : timeline.cycles.map((row, index, rows) => {
    const duration = row.cycleDurationSeconds, previous = rows[index - 1];
    if (row.reached ? (!Number.isFinite(duration) || duration < 0) : duration !== null)
      throw new Error('O2 invalid prestige duration');
    const comparable = row.reached && previous?.reached && previous.cycleDurationSeconds > 0;
    const ratio = comparable ? duration / previous.cycleDurationSeconds : null;
    if (ratio !== null && !Number.isFinite(ratio)) throw new Error('O2 invalid prestige duration ratio');
    const reductionPercent = ratio === null ? null : (1 - ratio) * 100;
    if (reductionPercent !== null && !Number.isFinite(reductionPercent)) throw new Error('O2 invalid prestige duration reduction');
    return { cycle: row.cycle, completed: row.reached, durationSeconds: duration,
      stopReason: row.stopReason, ratioToPrevious: ratio,
      reductionPercent };
  });
  return { name: timeline.name, purchaseWindows, eraTransitions, specializations, prestigeCycles,
    unobservedMilestones: timeline.milestones.filter(item => !item.reached).map(item => item.key) };
}
