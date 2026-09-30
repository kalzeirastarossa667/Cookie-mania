# Cookie Empire — GitHub Research for Foundation 2.8

Date: 2026-09-30  
Baseline: Foundation 2.7.2 Feedback on `main` at `a0053b8b105026cd032544e93499a172609cf92c`  
Purpose: select external references and development-only tooling that strengthen Cookie Empire without replacing validated foundations.

## Rules

- Cookie Empire's Master Dev File and current `index.html` remain authoritative.
- External repositories are references or test tools, never a reason to rewrite validated GameState/Economy/Persistence layers.
- No external game assets are copied.
- Third-party code is incorporated only through explicit development dependencies with compatible licenses.
- Runtime remains self-contained HTML/CSS/Vanilla JavaScript unless a later milestone explicitly changes that contract.

## Sources retained

| Source | Inspected revision / file | Useful lesson | Decision |
| --- | --- | --- | --- |
| IvarK/AntimatterDimensionsSourceCode | commit `5409e320cecef96a917cca1dfb68f1f183e499ca`; `src/game.js`, `src/core/storage/storage.js`, `src/core/away-progress.js`, GameDatabase references | Mature offline simulation, save validation/backups, data-driven content | Reference for later simulation/storage/content scaling. Do not transplant architecture wholesale. MIT. |
| Patashu/break_eternity.js | commit `6ccf63b55d5b2c3f148c16e3ff907c6898542b72`; README/package 2.1.3 | Incremental-game numerical oracle far beyond IEEE Number range | Keep as a test/reference candidate. Do not replace HugeNumber in 2.8. MIT. |
| dubzzz/fast-check | commit `85eeab9e87c9d37e66cc7819260e3df1e72305ae`; fast-check package docs | Property-based testing, shrinking, state-machine/race testing | Add as development-only dependency for numerical/economy/persistence properties. MIT. |
| dequelabs/axe-core | commit `72e86242e518f6fd82508d842ce103590393adbd`; README | Browser accessibility automation for WCAG rules; manual review still required | Add browser a11y checks through Playwright. Development-only. MPL-2.0. |
| microsoft/playwright | current project dependency 1.63.0; upstream README | Browser isolation, web-first assertions, tracing, Chromium/Firefox/WebKit | Retain existing browser gate; 2.8 adds a11y to the current Chromium desktop/Pixel 5 matrix before considering more browsers. Apache-2.0. |
| antimatter-dimensions/notations | commit `fd0431986eda32dde09b7320bf969c0bfa39bc46`; README | Formatting large numbers separately from arithmetic | Reference only; current French formatter remains authoritative. MIT. |
| nuclear-unicorn/kittensgame | commit `781e379f79f1e7512d168849cba21ed111502644`; README, `js/buildings.js` | Reuse existing systems, plan late scaling, invalidate caches on meaningful changes | Ideas only. Its WET PAWS license forbids derivative/commercial use of the game code; do not copy code/assets. |
| Acamaeda/The-Modding-Tree | commit `4d8a86cfb3c59ef3ef4c222f21ef4fbee980c621`; README and prior inspected `js/technical/temp.js` | Separate temporary derived values from actions and authoritative state | Reference for derived caches and future progression trees. MIT. |
| pmotschmann/Evolve | commit `3436358dcd03d9f9e071d51ea071e0a78c0322e4`; README/wiki prestige material | Long-form progression and tradeoff-oriented feature design | Reference for late-game design only. MPL-2.0; avoid copying files. |
| GoogleChrome/lighthouse-ci | commit `ebee453dad3f8acacd657a62ccc65e3296afb7d0`; README | Continuous performance/accessibility/SEO budgets | Deferred until runtime assets/UI complexity justify a stable performance budget. |
| GoogleChrome/workbox | v7 README | PWA caching/offline installability | Deferred. Cookie Empire gameplay is already self-contained; service workers would add deployment/cache invalidation complexity. MIT. |
| pieroxy/lz-string | README; MIT | Compact export strings | Deferred until save size is a demonstrated problem. |
| jakearchibald/idb-keyval | commit `17a69a1165bef486d88950cb47d3913744f038ac`; README | Small async IndexedDB key-value store | Deferred. Current protected localStorage v7 is validated and not capacity-bound. |

## Foundation 2.8 decisions

### Adopt now

1. **Property-based tests** with fast-check, outside the playable HTML.
2. **Browser accessibility checks** with axe integrated into the existing Playwright suite.
3. **Numerical adversarial cases** for HugeNumber scientific-string parsing and algebraic invariants.
4. Preserve all 220 existing Foundation cases and existing interface/Constellation/browser scenarios.

### Explicitly do not change

- save schema v7;
- storage key;
- GameState fields;
- generator/research/prestige prices or multipliers;
- offline duration cap;
- render/save cadence;
- Formspree integration;
- runtime dependency model.

### Deferred

- replacing HugeNumber with break_eternity.js;
- IndexedDB;
- save compression;
- PWA/service worker;
- Lighthouse performance budgets;
- Firefox/WebKit release gates;
- new gameplay content.

## Numerical risk identified during review

HugeNumber's fallback string parser is only used when JavaScript `Number(raw)` overflows. The current implementation derives its exponent from the integer part and therefore needs explicit regression coverage for very large scientific strings whose coefficient is below 1, such as `0.001e1000`. Foundation 2.8 must reproduce any discrepancy before changing the parser.

## Acceptance gate

Foundation 2.8 is accepted only if:
- the new numerical test fails on the untouched 2.7.2 baseline when a real defect is reproduced;
- the minimal fix passes the new property/regression suite;
- all previous 220 Foundation cases remain green;
- targeted interface and 56 Constellation/Horizons checks remain green;
- Playwright desktop Chromium and Pixel 5 remain green;
- axe reports no serious/critical accessibility violations on the tested main views;
- save schema remains v7 and gameplay/economic constants are unchanged.

No physical-device accessibility claim is made from axe or browser emulation alone.
