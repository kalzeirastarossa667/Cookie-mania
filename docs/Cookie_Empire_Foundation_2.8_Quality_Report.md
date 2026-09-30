# Cookie Empire — Foundation 2.8 Quality Report

Date: 2026-09-30  
Baseline: Foundation 2.7.2 Feedback, user-validated on public GitHub Pages  
Development branch: `feature/foundation-2.8-quality`  
Pull request: #19  
Save schema: **v7 unchanged**

## Purpose

Foundation 2.8 is a quality hardening milestone. It deliberately adds no generator, research, synergy, prestige node, economy multiplier, new currency or progression threshold.

The milestone integrates selected GitHub-sourced development practices:
- property-based testing with `fast-check`;
- automated browser accessibility checks with `@axe-core/playwright`;
- numerical adversarial testing inspired by mature incremental-number libraries;
- explicit documentation of sources and license boundaries.

The playable runtime remains self-contained HTML/CSS/Vanilla JavaScript. The new packages are development-only.

## Reproduced numerical defect and fix

A targeted regression was added before touching the numerical implementation.

On untouched Foundation 2.7.2:
- the existing Foundation suite still passed **220/220**;
- the new assertion then failed for `0.001e1000`;
- mathematically this value is `1e997`, but the fallback parser placed the exponent incorrectly when native JavaScript `Number(raw)` overflowed and the scientific coefficient was below 1.

Red commit: `99333b532ef34aa8fd91eabfb2237d742f170106`.

The fix changes only the overflow scientific-string parsing path:
- find the first significant digit across integer and fraction parts;
- derive the decimal exponent from that significant position plus the explicit exponent;
- keep at most 17 significant digits before HugeNumber's established 15-digit normalization.

It preserves accepted syntax, zero handling, arithmetic representation, `toJSON/fromJSON`, save schema and persisted fields.

Fix commit: `30120e0bcc006f554b5d155a8c69921f9be9e9cc`.

Additional regression cases cover:
- `.001e1000`;
- leading-zero scientific strings;
- huge scientific zero.

## Property-based verification

Pinned development dependency: `fast-check 4.9.0`.

`scripts/check-properties.mjs` loads the real game implementation from `index.html`, rather than duplicating production arithmetic.

Deterministic seeded properties cover:
- canonical HugeNumber normalization;
- comparison antisymmetry;
- addition commutativity under the documented precision model;
- multiplication commutativity;
- multiply/divide round-trip with explicit logarithmic tolerance;
- generator geometric batch cost versus sequential summation;
- exact max-affordable behavior on bounded generated cases.

The suite is bounded for routine CI and reports deterministic seeds for replayability.

Final result: **PASS**.

## Accessibility red/green

Pinned development dependency: `@axe-core/playwright 4.13.0` using `axe-core 4.13.0`.

The initial axe gate kept all **12 historical Playwright scenarios green** but added two failing accessibility scenarios, one desktop and one Pixel 5 emulation. Both reproduced the same serious `color-contrast` issue in the Parcours prestige tree: the click/production branch badges used light-theme foreground colors against the dark card.

The repair centralizes those branch colors as theme tokens:
- light click: `#6f4b9d`;
- light production: `#8b5c20`;
- dark click: `#d8b9ff`;
- dark production: `#f3cc91`.

Approximate contrast ratios against the corresponding prestige card backgrounds are comfortably above the 4.5:1 normal-text threshold:
- light: about **6.5:1** and **5.7:1**;
- dark: about **9.4:1** and **10.6:1**.

A second accessibility scenario explicitly switches to the light theme so future theme changes cannot silently reintroduce the issue.

The automated gate scans Empire, Atelier, Recherche, Parcours and the feedback form and fails on axe `serious` or `critical` violations.

Final browser result:
- **16/16 Playwright PASS in 41.4 s**;
- 8 desktop Chromium scenarios;
- 8 Pixel 5 Chromium emulation scenarios;
- dark-theme axe checks PASS;
- light-theme axe checks PASS.

This is real automated Chromium browser evidence, not a physical-device screen-reader or full WCAG certification.

## Final Foundation verification

On release-candidate runtime before the final version-marker packaging:
- `npm ci`: **44 packages installed, 0 vulnerabilities reported**;
- Foundation regression: **220/220 PASS**;
- deterministic loop: **20 renders / 1 autosave over 5 simulated seconds**;
- property tests: **PASS**;
- targeted interface simulation: **PASS**;
- Constellation/Horizons DOM: **56/56 PASS**;
- Playwright: **16/16 PASS**.

The release-marker commit must rerun both Foundation and Browser workflows before merge.

## Architecture audit

Compared with Foundation 2.7.2, the playable runtime changes are intentionally limited to:
1. HugeNumber's overflow scientific-string parser;
2. prestige branch presentation color tokens;
3. Foundation 2.8 version/feedback metadata.

Confirmed unchanged by diff review:
- GameState authoritative fields;
- save schema v7 and storage keys;
- generator catalogue/prices/growth/CPS;
- research catalogue and effects;
- synergy factors;
- prestige prices, prerequisites and effects;
- prestige threshold/reward;
- offline cap;
- render and autosave cadence;
- Formspree endpoint and gameplay isolation.

No balance observatory rerun is required because no economy formula or constant changed.

## Remaining limits

- HugeNumber remains a 15-significant-digit mantissa/exponent model; Foundation 2.8 does not claim arbitrary precision.
- Property testing is bounded and cannot prove all possible numeric states.
- axe automated rules cannot replace manual keyboard, screen-reader, zoom, contrast-perception or physical-device testing.
- Chromium desktop and Pixel 5 emulation do not establish Firefox/WebKit or every Android/iOS behavior.
- break_eternity.js remains a test/reference source, not a runtime dependency.
- IndexedDB, Workbox/PWA, save compression and Lighthouse budgets remain deliberately deferred.

## Next logical step

After merge and post-merge CI, Foundation 2.8 becomes the quality baseline. The next gameplay milestone should be specified separately and should use player feedback plus measured pacing before adding another broad multiplier or prestige tier. External incremental-game repositories remain design references, not code templates.
