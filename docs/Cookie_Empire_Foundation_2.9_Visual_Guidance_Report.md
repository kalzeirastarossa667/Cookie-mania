# Cookie Empire — Foundation 2.9 Visual & Guidance — Release Candidate Report

Date: 2026-09-30  
Baseline: Foundation 2.8.3 Menu (`29dfe1d8a409961101e17510533212b9c67d24fb`)  
Release-candidate branch: `release/foundation-2.9-rc`

## 1. Scope

Foundation 2.9 improves presentation and player comprehension without changing the intended economy, timing model or save schema.

Delivered in the staged order required by the Master specification:

1. **A1 — Content contract**: canonical descriptions for all 16 generators.
2. **A2 — Economy-derived display metrics**: HugeNumber-safe stack metrics and CPS share.
3. **A3 — Generator UI**: visible descriptions, progressive details, cached DOM references and derived metrics.
4. **B — Player guidance**: exact research lock reasons, actionable next objective, explicit prestige **PERDU / CONSERVÉ / GAGNÉ** contract.
5. **C — Presentation polish**: safer cosmic depth, era identity, hierarchy and reduced-motion-aware ambient effects.

The original monolithic visual prototype remains PR #25 and is not the merge candidate.

## 2. Preserved invariants

- Save schema remains **v7**.
- The existing storage key remains unchanged.
- Generator prices and base production values are unchanged.
- Upgrade and prestige economic rules are unchanged.
- Foundation 2.8.1 active-session timing behavior is preserved.
- Foundation 2.8.2 mobile bottom-navigation clearance is preserved.
- Foundation 2.8.3 settings-menu hit-testing above the resource HUD is preserved.
- Generator cards are constructed once and cached rather than rebuilt on every render.
- No authoritative HugeNumber operand is converted to ordinary Number before the new CPS-share division.

## 3. Phase evidence

### A1 — PR #26

Green head: `a31f02c84ec332a0d59d903b58037da29fb32d63`

- Foundation workflow `36766462458`: SUCCESS.
- Foundation rules: **221/221 PASS**.
- Properties: PASS.
- Interface simulation: PASS.
- Constellation: **56 checks PASS**.
- Browser workflow `36766462564`: SUCCESS.
- Browser suite: **20 PASS** with expected project-specific skips.

### A2 — PR #27

Green head: `0016594d467b98c9b9ea48879f55f9fc49b1ab73`

- Foundation workflow `36766809783`: SUCCESS.
- Foundation rules: **224/224 PASS**.
- HugeNumber/generator-cost properties: PASS.
- Interface simulation: PASS.
- Constellation: **56 checks PASS**.
- Browser workflow `36766809914`: SUCCESS.
- Browser suite: **20 PASS** with expected viewport skips.

Edge cases added for CPS-share computation include zero total, zero generator contribution, extremely large exponents, ratios near zero and one, bounding, and invalid generator counts.

### A3 — PR #28

Green head after correcting a test-selector ambiguity: `8be3def3f854ea109d6e9541bdfcf1b08af9280f`

- Foundation workflow `36767659968`: SUCCESS.
- Foundation rules: **224/224 PASS**.
- Interface simulation: PASS.
- Constellation: **169 checks PASS**.
- Browser workflow `36767659937`: SUCCESS.
- Playwright: **22 PASS** from 24 declared cases, with 2 expected viewport skips.

The intermediate Browser failure was caused by the new test selecting the generator card and its three purchase buttons with the same broad selector. The runtime was not changed for that failure; the test was corrected to target the generator card explicitly.

### B — PR #29

Green head: `65be7c5406e93ee5129bf97abef8b4d272adab4b`

- Foundation workflow `36768054591`: SUCCESS.
- Foundation rules: **224/224 PASS**.
- Interface simulation: PASS.
- Constellation: **169 checks PASS**.
- Browser workflow `36768054313`: SUCCESS.
- Playwright: **24 PASS** from 26 declared cases, with 2 expected viewport skips.

### C — PR #31

Green head: `64f3b654b37a3bda35e624ac191015095efaa8f3`

- Foundation workflow `36768524068`: SUCCESS.
- Foundation rules: **224/224 PASS**.
- Cadence: **20 renders / 1 autosave over 5 s**.
- Visible-frame catch-up: **1.5 s simulated**.
- HugeNumber/generator-cost properties: PASS.
- Interface simulation: PASS.
- Constellation: **169 checks PASS**.
- Browser workflow `36768523936`: SUCCESS.
- Playwright: **26 PASS** from 28 declared cases, with 2 expected viewport skips.

The C safety test explicitly checks:
- the interactive cookie has no continuous CSS animation;
- the top bar has no backdrop filter;
- all four generator eras expose distinct semantic accent tokens;
- ambient hero motion is disabled under `prefers-reduced-motion: reduce`.

Existing axe serious/critical scans in both dark and light themes remain part of the Browser suite.

## 4. Player-facing changes

### Generator clarity

Each generator now shows a thematic description in the always-visible layer. A native progressive-details control exposes:

- production of the owned stack;
- owned-stack click contribution;
- share of total automatic CPS;
- effective gain from the next unit;
- specialization state.

The ×1 / ×10 / Max purchase controls remain primary and unchanged in function.

### Research guidance

Locked research cards state the actual missing research name and/or generator-count requirement instead of a generic hidden-prerequisite message.

### Prestige guidance

Before prestige the interface explicitly separates:

- **PERDU** — cookies, current-run clicks, generators and research;
- **CONSERVÉ** — total Rayonnement, spendable Éclats and permanent purchases;
- **GAGNÉ** — derived reward and post-prestige multiplier.

The confirmation dialog repeats the same contract. Prestige rules themselves are unchanged.

### Visual identity

The presentation keeps Cookie Empire's galaxy identity while introducing distinct semantic accents for:

- Atelier;
- Orbite;
- Cosmos;
- Infini.

Ambient motion is decorative only and reduced-motion aware. The click target itself is not continuously transformed.

## 5. Remaining validation boundary

Automated Chromium desktop and Pixel 5 emulation are green. This does **not** replace validation on the physical Android browser that originally exposed the Foundation 2.8.3 menu-layering defect.

Physical-device validation should therefore be recorded separately after deployment or an equivalent testable build is made available.

## 6. Merge policy

The final integration PR must be reviewed against `main` and must run Foundation + Browser workflows again after release metadata/documentation packaging.

PR #25 remains a prototype reference and should not be merged.
