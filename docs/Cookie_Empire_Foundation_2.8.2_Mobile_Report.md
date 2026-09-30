# Cookie Empire — Foundation 2.8.2 Mobile Report

Date: 2026-09-30  
Baseline: Foundation 2.8.1 Timing  
Save schema: v7 unchanged

## Reported interface defect

A user-supplied Android screen recording showed the fixed bottom navigation overlapping lower game content while scrolling the Empire view.

The layout audit found two relevant facts:
- the bottom navigation is fixed and includes the device safe-area inset;
- browser scroll/focus positioning had no equivalent bottom clearance for that overlay.

A historical feedback-only `margin-bottom: 76px` existed, but it did not define a shared viewport contract.

## Red reproduction

A Pixel 5 Playwright regression was added before the CSS fix.

On the unmodified 2.8.1 layout:
- target bottom: **711 px**;
- fixed navigation top: **656 px**;
- measured overlap: **55 px**.

The red run kept all historical browser scenarios green and failed only the new mobile navigation-clearance assertion.

## Fix

The final CSS change:
- defines `--bottom-nav-clearance: calc(82px + env(safe-area-inset-bottom))`;
- uses it for the floating quick-click offset;
- sets mobile viewport `scroll-padding-bottom` to that clearance plus 8 px;
- removes the feedback-only 76 px workaround;
- preserves the existing Constellation 2.0 page-end padding.

An intermediate redundant `.app` padding change was removed during audit before acceptance.

## Verification

Foundation:
- **220/220 PASS**;
- deterministic 5-second cadence PASS;
- Foundation 2.8 property suite PASS;
- targeted interface PASS;
- **56/56 Constellation/Horizons DOM PASS**.

Browser:
- 20 tests declared;
- **19 PASS**;
- **1 expected skip** on desktop because the 2.8.2 regression is mobile-only;
- final branch run: **46.1 s**;
- mobile clearance verified on Empire, Atelier, Recherche and Parcours;
- existing accessibility, feedback, prestige and 2.8.1 timing regressions remain green.

## Scope audit

Unchanged:
- GameState;
- HugeNumber;
- Economy and all balance constants;
- GameEngine/time semantics;
- save schema v7 and storage keys;
- generator/research/synergy/prestige content;
- Formspree feedback behavior;
- autosave/render cadence.

## Remaining acceptance

Pixel 5 is browser emulation. The public deployment should be retested on the physical Android browser that produced the original recording.
