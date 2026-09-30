# Cookie Empire — Foundation 2.8.3 Menu Report

Date: 2026-09-30  
Baseline: Foundation 2.8.2 Mobile  
Save schema: v7 unchanged

## Reported defect

A user-provided Android screenshot clarified that the top-right `…` menu was the actual hidden-control problem. When opened, the sticky resource HUD could paint above the menu and obscure or intercept:
- `Exporter les données`;
- `Importer une partie`;
- `Nouvelle partie`.

The relevant stacking values were:
- `.settings-menu`: `z-index: 5`;
- `.resource-hud`: `z-index: 10`.

Foundation 2.8.2 fixed a separate bottom-navigation clearance issue and remains valid, but it did not address this dropdown layering defect.

## Red reproduction

The regression was added before the repair on commit `f0a8acb7a06b9f3655adecf908d361da85081511`.

Under the Pixel 5 Playwright project:
- the `…` menu opened;
- all three buttons were visible in DOM/layout terms;
- browser hit-testing at the center of `#exportSaveButton` returned `.wallet` as the topmost element;
- the new test failed while the historical scenarios remained green.

This proves the defect was not merely visual: the HUD could own the pointer-hit area above the menu action.

## Fix

The runtime change is one stacking-order correction:
- `.settings-menu`: `z-index: 5` → `z-index: 40`.

No menu JavaScript, persistence logic, save/import/export behavior, GameState field, economy formula, timing rule or content value changed.

## Pre-packaging verification

On commit `b36387604ef68d148e75fd9fc0ef30e1329369bb`:

Foundation:
- **220/220 PASS**;
- cadence: **20 renders / 1 autosave over 5 s**;
- deterministic properties: PASS;
- targeted interface checks: PASS;
- Constellation: **56/56 DOM checks PASS**.

Browser:
- 22 cases declared across desktop Chromium + Pixel 5 emulation;
- **20 PASS**;
- **2 expected desktop skips**, because Foundation 2.8.2 and 2.8.3 regressions are mobile-only;
- the new menu regression passes on Pixel 5 emulation;
- previous timing, accessibility, feedback, prestige and bottom-navigation regressions remain green.

## Scope audit

Unchanged:
- GameState;
- HugeNumber;
- Economy and balance constants;
- GameEngine/time semantics;
- persistence schema v7 and storage keys;
- generator/research/synergy/prestige content;
- Formspree feedback;
- autosave/render cadence.

## Final merge/deployment acceptance

PR #23 was squash-merged to `main` as `29dfe1d8a409961101e17510533212b9c67d24fb`.

On that exact merged commit:
- Foundation workflow **SUCCESS** with **220/220** rules/persistence, cadence **20 renders / 1 autosave over 5 s**, properties PASS, targeted interface PASS and **56/56** Constellation DOM checks;
- Browser workflow **SUCCESS** with **20 PASS + 2 expected desktop skips in 45.9 s**;
- GitHub Pages build/deployment **SUCCESS**.

Remaining acceptance is now limited to physical Android validation of the public deployment. Pixel 5 is browser emulation and is not reported as a real-device result.
