# Cookie Empire — Foundation 2.4 Synergies — Test Report

Date: 2026-09-30 UTC
Baseline: Foundation 2.3 Rayonnement (`0b76abeed4d91d8286f779be392047f60ebd8c70`).

## Scope

Foundation 2.4 adds four derived research synergies across the eight existing generator specializations. Synergies are immutable content, activate automatically from `ownedUpgrades`, affect CPS and click reward only through Economy, and add no saved state. Save schema remains v6.

Initial factors:
- Atelier complice: expert Cursor + expert Grand-mère → CPS ×1.10, click ×1.10.
- Four & cacao: expert Four + expert Mine → CPS ×1.15, click ×1.05.
- Science orbitale: expert Laboratoire + expert Boulangerie orbitale → CPS ×1.20, click ×1.10.
- Cycle astral: expert Moisson lunaire + expert Forge stellaire → CPS ×1.25, click ×1.15.

## Red → green evidence

The first dedicated synergy tests were committed before implementation at `49cfc13a01fae848cebcdb7c7d39aa70e929e9e0`; Foundation checks failed as expected because the synergy API/content did not exist. The first implementation commit also exposed an intentionally incorrect comparison in the initial red assertion, so the final tests were tightened to exact economic expectations rather than weakening the feature. Final Foundation suite: **203/203 PASS**.

Coverage added: fresh inactivity, exact paired activation, partial pair inactivity, multi-synergy stacking, repeated-refresh idempotence, v6 reconstruction with no persisted synergy cache, and invalid content rejection.

Existing checks remain green: targeted interface simulation PASS; **56/56 Constellation/Horizons DOM assertions PASS**; cadence remains 20 renders and one save per five simulated seconds.

## Balance observatory

The observatory was temporarily added to the Foundation workflow for one measured run, then removed from routine CI again.

Compared with Foundation 2.3 under the same deterministic greedy policy:
- fresh 2 clicks/s: 31,388 s → **25,141 s** (about 19.9% faster);
- fresh 5 clicks/s: 13,587 s → **10,969 s**;
- one Rayonnement + 2 clicks/s: 28,538 s → **22,821 s**;
- cycle 10 at 2 clicks/s: 16,427 s → **13,148 s**.

All active scenarios still reach the threshold, zero-click fresh play still does not self-start, and the ten-cycle sequence remains monotonically faster without an observed runaway. Purchase count remains 719 in the measured policy. These results are diagnostic, not human-play balance proof.

## Browser verification

GitHub Actions Browser checks exercise Chromium desktop and Pixel 5 emulation. The feature keeps the existing browser interaction paths and adds generated synergy cards in Research. A physical-phone validation is still separate and has not been claimed.

## Remaining limits

The four synergy factors materially accelerate progression and should be observed in a real long play session before further balance amplification. No prestige shop or Éclat spending is introduced. Save v6 is unchanged. Multi-tab coordination, physical-device coverage and human long-session balance remain outside this milestone.
