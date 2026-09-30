# Cookie Empire — Foundation 2.7.1 Stability Report

Date: 2026-09-30 UTC

## Baseline

Foundation 2.7.1 stabilizes the validated Foundation 2.7 branch system. The starting `main` commit was `86b0a899f17a56bd99c3ba37d06e888d3b8d2833`. Save schema remains **v7**. Generator, research, milestone, prestige costs and permanent multipliers are unchanged.

## Confirmed defect and correction

A second UI multiplier-cache defect was reproduced on the current baseline. `Economy.deriveMultipliers()` depends on normal research ownership, permanent prestige ownership and lifetime `prestigePoints`, but the presentation cache key did not include lifetime Rayonnement.

Red proof: commit `c337ad518cfbd5ab5cd13b3bfeb65ec5afb9ac08` added only the regression assertion. Foundation rules reached **220/220**, then the interface check failed exactly on `Rayonnement total invalide le cache des taux générateurs`.

Fix: commit `ce7ad59f3ff62fbe05e2af37e16221339fa03edf` extends the UI cache key with the normalized HugeNumber mantissa/exponent of `prestigePoints`. No Economy formula, GameState authority, persistence field, save migration or balance value changed.

## Playability improvement

The five permanent prestige nodes now carry explicit data-driven branch metadata: common, click, production and convergence. The Journey prestige shop renders visible French labels — **Voie commune**, **Voie clic**, **Voie production**, **Convergence** — so the non-exclusive branch structure is understandable without inferring it only from prerequisites.

A new Playwright scenario verifies the player-facing path: root initially available, both branches unlock together, buying the click branch does not lock production, convergence stays locked until the required paths are owned, the purchase succeeds, lifetime Rayonnement remains 20 and the wallet reaches the exact expected 6 Éclats.

## Verification

Final tested runtime/documentation HEAD before the report commit: `b47a39d8efd3fe4de27e3da0f0c457b6862b1d8e`.

- Foundation rules/persistence: **220/220 passed**.
- Targeted jsdom interface checks: **passed**.
- Constellation/Horizons DOM checks: **56/56 passed**.
- Playwright: **10/10 passed** in 18.5 s.
- Desktop Chromium: **5/5 passed**.
- Pixel 5 emulation in Chromium: **5/5 passed**.
- New Foundation 2.7.1 branch-convergence scenario: passed on desktop and Pixel 5 emulation.
- Physical-phone testing: **not performed**.

## Stability status

Foundation 2.7.1 is a stabilization patch, not an economy expansion. It preserves save schema v7 and all Foundation 2.7 economic values. PR #17 was squash-merged as `5d20d9b5eb4ddfcb156b2a763a4179f77cb66477`; Foundation checks and Browser checks both passed again after the merge on `main`. The archived playable snapshot has the same Git blob SHA (`195aafec98021b40a2bdb0ca4dfaf8151d605311`) as `index.html`, so the delivered HTML is byte-identical to the tested runtime. Human long-play balance and testing on a physical phone remain separate evidence requirements.
