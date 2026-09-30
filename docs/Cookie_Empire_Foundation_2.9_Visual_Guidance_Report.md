# Cookie Empire — Foundation 2.9 Visual & Guidance — Final Checkpoint Report

Date: 2026-09-30  
Baseline: Foundation 2.8.3 Menu (`29dfe1d8a409961101e17510533212b9c67d24fb`)  
Release-candidate branch: `release/foundation-2.9-rc`  
`main` revalidated before final packaging: `bfc46e721940086fd67e5ffc3d93cc3f2343128c`  
Foundation 2.9 C resynchronized head: `26e7c8a176b1b00f344d88d8271a3f0df33b422a`  
Final packaged RC head: `02c62e659c532f20fe6fb5925f30c0d4f5c227db`  
Final integration PR: **#32 — merged**  
Foundation 2.9 integration commit on `main`: `5c4ee2eaa4fb3cae1b6ebc32be127da43898bd41`

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

Original green C head: `64f3b654b37a3bda35e624ac191015095efaa8f3`  
Resynchronized green C head: `26e7c8a176b1b00f344d88d8271a3f0df33b422a`

- Foundation workflow after `main` resynchronization `36773131291`: SUCCESS.
- Foundation rules: **224/224 PASS**.
- Cadence: **20 renders / 1 autosave over 5 s**.
- Visible-frame catch-up: **1.5 s simulated**.
- HugeNumber/generator-cost properties: PASS.
- Interface simulation: PASS.
- Constellation: **169 checks PASS**.
- Browser workflow after `main` resynchronization `36773131276`: SUCCESS.
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

## 5. Validation boundary and physical Android result

Automated Chromium desktop and Pixel 5 emulation are green, but they remain distinct from real-device evidence.

After the successful GitHub Pages deployment of Foundation 2.9, the project owner manually tested the deployed version on a physical Android phone and reported that the game appeared to function correctly, notably the `⋯` menu and its accessibility. This is recorded as **user physical-Android validation on the tested device/browser**.

This manual result does **not** certify all Android devices, browser engines, viewport sizes, accessibility configurations or assistive technologies. Automated emulation and physical-device validation remain separately identified evidence.

## 6. Merge policy — historical outcome

The release-candidate policy required the final integration PR to be reviewed against `main` and to rerun Foundation + Browser after release metadata/documentation packaging. PR #32 satisfied that gate and was merged.

PR #25 remains a prototype reference and was not used as the integration source.


## 7. Final RC packaging checkpoint

Before opening the final integration PR, the C branch was merged non-destructively with the current documentation-only `main` updates. The resulting head `26e7c8a176b1b00f344d88d8271a3f0df33b422a` was **0 commits behind main** and passed both workflows again:

- Foundation: **224/224 PASS**, cadence **20 renders / 1 autosave over 5 s**, visible-frame catch-up **1.5 s**, deterministic properties PASS, interface PASS, Constellation **169 PASS**;
- Browser: **26 PASS + 2 expected viewport skips** across desktop Chromium and Pixel 5 emulation;
- Foundation 2.8.3 mobile settings-menu hit-testing remains green.

A final browser regression was added during RC packaging for the Master 53.9 boundary: advanced generator metric text must stay finite with **zero CPS** and with an **extreme HugeNumber prestige value (`1e1000`)**. The final integration PR was required to run Foundation + Browser once more on the packaged state.

The packaged playable archive was required to be byte-identical to the root `index.html`. At this RC checkpoint, physical Android validation was still separate and had not yet been recorded.

## 8. Final merged/deployed checkpoint

PR #32 integrated the packaged RC head `02c62e659c532f20fe6fb5925f30c0d4f5c227db` into `main`. The Foundation 2.9 runtime integration commit is `5c4ee2eaa4fb3cae1b6ebc32be127da43898bd41`.

Post-merge evidence on that exact integration commit:

- Foundation checks workflow `36774955501`: **SUCCESS**;
- Foundation rules: **224/224 PASS**;
- deterministic properties: PASS;
- targeted interface checks: PASS;
- Constellation: **169/169 PASS**;
- Browser checks workflow `36774955560`: **SUCCESS**;
- Playwright: **28 PASS + 2 expected viewport skips**;
- zero-CPS and extreme-`HugeNumber` (`1e1000`) generator-metric regression: PASS on desktop and mobile projects;
- Foundation 2.8.3 mobile settings-menu hit-testing: PASS;
- GitHub Pages workflow `36774955023`: **SUCCESS**;
- deployed version metadata: **Foundation 2.9 · Visual**;
- archived playable file remains byte-identical to root `index.html` at the integration checkpoint.

After deployment, the project owner performed the physical Android check described in section 5. No runtime, economy, save-schema or gameplay change is introduced by the final documentation checkpoint.
