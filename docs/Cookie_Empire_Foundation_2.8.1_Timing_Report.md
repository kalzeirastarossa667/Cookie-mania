# Cookie Empire — Foundation 2.8.1 Timing Report

Date: 2026-09-30  
Baseline: Foundation 2.8 Quality  
Save schema: v7 unchanged

## Reported defect

A real tester reported that while clicking manually, generator production appeared to stop.

## Reproduction

The active loop used to compute `min(0.5, elapsedVisibleSeconds)` and then advance its frame timestamp. If the browser main thread was occupied for longer than 0.5 s — for example during a heavy burst of input/UI work — the excess visible time was discarded permanently.

A red deterministic test on the unmodified Foundation 2.8 runtime passed all 220 historical Foundation cases and then failed with:

`Temps visible perdu après blocage du thread : {"seconds":0.5,"ticks":1}`

for 1.5 s of visible elapsed time.

## Fix

The active visible loop now credits the complete finite non-negative monotonic elapsed duration. No economic formula changes: automatic production remains exactly `CPS × elapsed seconds`.

Hidden/background handling is unchanged and remains separate through the existing wall-clock offline path. The 30-day offline cap remains.

## Verification

Foundation:
- **220/220 PASS**;
- property suite PASS;
- targeted interface PASS;
- **56/56 Constellation/Horizons DOM PASS**;
- 5-second cadence unchanged at 20 renders / 1 autosave;
- 1.5-second visible-stall regression now simulates exactly 1.5 seconds.

Browser:
- **18/18 Playwright PASS in 44.7 s**;
- 9 desktop Chromium;
- 9 Pixel 5 emulation;
- new scenario creates 1 CPS, performs a ~1.2 s manual-click burst that occupies the main thread, then verifies automatic production is still credited.

Two earlier browser attempts failed only because the newly written test tried to use the internal `/?test=1` path, where the Playwright-hosted app did not initialize. All 16 historical browser scenarios remained green in those runs. The final test uses the normal route and passes.

## Scope audit

Unchanged:
- GameState;
- HugeNumber arithmetic;
- Economy formulas and balance constants;
- generator/research/synergy/prestige content;
- save schema v7 and storage key;
- import/export/recovery;
- background/offline lifecycle;
- Formspree feedback.

## Remaining acceptance

Automated browser coverage includes desktop Chromium and Pixel 5 emulation. The tester who originally reported the issue should retest the public deployment on the physical device/browser that exposed it.
