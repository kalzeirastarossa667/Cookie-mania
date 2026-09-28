# Foundation 2.0 Constellation verification

Date: 2026-09-28 UTC. Baseline: Foundation 1.1, latest supplied player video.

## Delivered scope

- Persistent resource HUD; four views; fixed phone navigation; secondary click action.
- Research branches with explicit prerequisites, filters and prerequisite navigation.
- Eight generators total, fourteen permanent upgrades, twenty-eight informational goals.
- Three space destinations; evolving chapter labels; actual per-unit click gains.
- Resource-only refresh per click, full UI every 250 ms; autosave every 5 s.
- Save schema v4 and existing storage/recovery/import paths retained.

## Automated results

`npm test` runs the three checked-in scripts.

- `check-foundation.mjs`: **175/175** embedded rules, economy, persistence and regression cases.
- `check-interface.mjs`: existing executable DOM assertions pass with updated catalogue-size and navigation expectations.
- `check-constellation.mjs`: **40** new DOM assertions pass.
- Deterministic loop: **20 renders / one save / 5 seconds**; no simulation while hidden.
- Burst: **100 clicks credited / zero full-shop renders** during direct click handlers.

New engine coverage: gated nonmutating rejection, exact cost and duplicate prevention, full click chain ×72, retention of already-owned research, invalid dependency graph rejection, all three generators, exact bulk purchase, legacy v4 missing fields, full new-content roundtrip, CPS/click separation, twenty-eight goals, compact large numbers.

UI coverage: exclusive views, accessible navigation/current item, arrows/End, stable mounted nodes, synthetic late-game state, next objective, exact secondary click reward, live unlock after research purchase, effective generator click labels, branch/owned filters, prerequisite jump, huge balance, unique IDs, themes, self-contained assets and reset.

## Interpretation and limitations

These are Node/jsdom simulations, not real mobile browser rendering. No measured GPU performance, screen-reader certification or visual-layout pass is claimed. The earlier browser access policy block was respected. The supplied 80-second video validates ordinary play of **1.1**, not the new 2.0 layout.

Original tests using “all upgrades” to mean the historical six were restricted to those six IDs, preserving their expected economic values. Catalogue count and terminal progression assertions were extended intentionally. New tests explicitly exercise the full fourteen-item catalogue.

No user's real save was accessed or modified. Forward old-save loading is tested; downgrading after buying new content is unsupported. Local downloaded HTML files can have different storage origins: use JSON export/import to transfer. Original multi-tab, local-clock and roughly fifteen-digit precision limitations remain.
