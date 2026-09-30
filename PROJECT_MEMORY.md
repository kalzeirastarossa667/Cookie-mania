# COOKIE EMPIRE — PROJECT MEMORY

Version: 1.0  
Created: 2026-09-30  
Purpose: durable continuity context for AI agents and human contributors.

> This file complements the Master Dev File. It does **not** replace it.
> GitHub `main` + the current Master Dev File remain the technical source of truth.
> Revalidate the current HEAD, open PRs and CI before acting because this memory can outlive the state it describes.

## 1. Project identity

Cookie Empire is a browser idle/clicker game built to remain understandable, stable, testable and extensible.

The project should feel like an original galactic cookie empire: attractive, readable and progressively more spectacular as the player advances. External clickers, including Cell to Singularity, may inspire broad UX principles such as progression clarity and visual hierarchy, but proprietary layouts, assets and code must not be copied.

The player experience remains clicker-first. Generators contribute to automatic production and, through the established game systems, can also reinforce clicking. Progression should be understandable without requiring the player to reverse-engineer formulas.

## 2. Sources of truth and continuity

Use sources in this order:

1. current GitHub `main` HEAD;
2. latest Master Dev File;
3. current code and automated/browser tests;
4. current accepted reports/specifications;
5. this PROJECT_MEMORY file for durable human intent and continuity;
6. old chats only as historical context, never as a more authoritative runtime source.

Never resume from an old local copy merely because it appears complete.

At creation of this file, `main` was:
- HEAD: `6790ded5f8d3ca44e87f84053312612ae4d2fef1`
- status: Foundation 2.8.3 — Menu
- save schema: v7

This snapshot is historical context only. Always revalidate it.

## 3. Human product preferences

Durable preferences expressed and validated by the project owner:

- dark galaxy mode is the default visual identity;
- dark blue/galaxy background with deep violet accents is preferred;
- a light theme must remain available;
- the game should become more attractive without sacrificing readability;
- the central cookie should feel more realistic and polished rather than like a generic placeholder;
- the game should provide enough explanation that a new player is not lost;
- generator descriptions and progression guidance are important;
- mobile usability is a first-class requirement;
- do not trade stability for visual spectacle;
- prefer useful tests and regression coverage over redundant test duplication;
- at least 16 generators were requested and this target has been reached.

The project owner has repeatedly preferred careful autonomous progress over frequent interruptions for trivial approval. However, real user/browser/device validation must not be fabricated or replaced by confidence.

## 4. Human validations and historical observations

Important human validation history:

- early Foundation versions had clicking and saving manually confirmed as working;
- “Nouvelle partie” was once the remaining visible bug and was subsequently corrected;
- Foundation 0.6 / 0.6.1 / 0.6.2 / 0.7 were reported functional during the earlier development line;
- Foundation 0.6.1 interface was manually reported readable on the user’s device;
- later mobile work was motivated by real UI observations, including fixed navigation overlap and the top-right menu hiding Exporter / Importer actions;
- automated Pixel 5 emulation is useful evidence but is **not** equivalent to physical Android validation.

When a user reports a real-device issue, treat it as evidence to reproduce and cover with a regression test where feasible.

## 5. Development behavior expected from AI agents

Default workflow:

ANALYZE → SPECIFY → DESIGN → IMPLEMENT → TEST → AUDIT → DOCUMENT

For a bug:

REPRODUCE → ADD A FAILING REGRESSION → FIX → MAKE TEST GREEN → RUN REGRESSIONS

Before changing the game:
- identify exact `main` HEAD;
- read the latest Master;
- inspect relevant code;
- inspect open branches/PRs to avoid duplicate concurrent work;
- inspect CI;
- preserve already validated behavior.

Do not say a feature is “fixed”, “validated” or “done” solely because the code looks correct.

Always distinguish:
- implemented;
- statically inspected;
- automatically tested;
- browser tested;
- physically device tested.

The owner explicitly values second-pass audits and expects the AI to look for its own mistakes before requesting validation.

## 6. Architectural invariants to preserve

Unless a newer Master explicitly changes them:

- `HugeNumber` is the authoritative large-number representation;
- `Economy` owns economic calculations;
- UI must not recreate economy formulas;
- timing/production logic must remain isolated from rendering;
- persistence must remain defensive;
- derived values should not be persisted when they can be recomputed safely;
- generator DOM should be built once and dynamic references cached rather than reconstructing all cards every render;
- ×1 / ×10 / Max purchasing must remain functional;
- save migrations and import/export behavior require explicit regression coverage;
- destructive restore/import/new-game actions require clear confirmation where defined by the Master;
- localStorage failures must not be silently hidden;
- avoid unnecessary runtime dependencies;
- development tests must not be embedded into the shipped game.

## 7. Known historical failure modes

Do not repeat these patterns:

- clicks appearing to work while state was not reliably updated;
- malformed save values silently corrupting progression;
- mathematically incorrect thresholds;
- stale objective/quest UI;
- excessive coupling between DOM and game logic;
- adding too many features before foundations were verified;
- declaring success after static inspection only;
- duplicate/redundant test execution;
- converting authoritative huge values to JavaScript `Number` too early;
- visual changes covering or making controls untouchable on mobile;
- rebuilding already completed work from an old version.

## 8. Important validated regressions

Foundation 2.8.1:
manual click bursts must not cause visible automatic-production time loss.

Foundation 2.8.2:
mobile fixed bottom navigation must not cover content brought to the bottom of the viewport; safe-area behavior matters.

Foundation 2.8.3:
the mobile top-right settings menu must remain above the resource HUD so Exporter, Importer and Nouvelle partie stay visible and touchable.

These protections must survive future visual work.

## 9. Current gameplay baseline at memory creation

The accepted `main` README described:
- 16 generators;
- 22 researches;
- 44 objectives;
- permanent branching prestige;
- total Rayonnement distinct from spendable Éclats;
- generator specialization and synergies;
- permanent prestige shop;
- galaxy theme by default and light theme available;
- save schema v7.

Do not use these counts blindly after future changes. Re-read the current README/Master.

## 10. Foundation 2.9 continuity note

At the moment this memory was created, Foundation 2.9 was **not merged into main**.

Active draft work included:
- #26 — A1 Generator content contract;
- #27 — A2 HugeNumber-safe generator metrics;
- #28 — A3 Progressive generator cards;
- #29 — B Player guidance and prestige contract;
- #25 — an older parallel Visual Refresh branch.

The A1 → A2 → A3 → B chain was deliberately incremental. The older #25 Visual Refresh represented a larger parallel approach and had browser-test problems during observation.

A future AI must revalidate these PRs. Do not assume their present state, merge status or correctness from this file.

### 10.1 Foundation 2.9 final checkpoint — 2026-09-30

The creation-time snapshot above remains historical and must not be rewritten.

Later on 2026-09-30, Foundation 2.9 Visual & Guidance completed the staged A1 → A2 → A3 → B → C path and final packaging. PR #32 was merged. The Foundation 2.9 runtime integration commit on `main` is `5c4ee2eaa4fb3cae1b6ebc32be127da43898bd41`.

Post-merge evidence recorded for that integration commit:
- Foundation checks: **SUCCESS**, including **224/224 Foundation** and **169/169 Constellation**;
- Browser checks: **SUCCESS**, final result **28 PASS + 2 expected viewport skips**, including zero-CPS / `1e1000` advanced generator metrics;
- GitHub Pages deployment: **SUCCESS**;
- deployed runtime: **Foundation 2.9 · Visual**.

After deployment, the project owner manually checked the GitHub Pages version on a physical Android phone and reported that the game appeared to function correctly, notably the `⋯` menu and its accessibility. Treat this as **user validation on the tested physical Android device/browser**, not as certification of every Android device, browser, viewport or accessibility setup.

This checkpoint closes Foundation 2.9 before post-2.9 work. The sequencing principle in section 16 remains **stability → observability → extensibility → new mechanics → deeper endgame**. Do not treat the candidate feature pool as permission to skip observability/extensibility preparation.

## 11. Visual-refresh guardrails

A visual refactor should:
- preserve economy, save and timing semantics unless separately specified;
- maintain original Cookie Empire identity;
- improve hierarchy and comprehension;
- preserve reduced-motion support;
- preserve accessibility and touch targets;
- preserve mobile safe areas and menu stacking;
- use progressive disclosure when dense information would otherwise overwhelm the player;
- avoid a giant monolithic generator-card template if structured cached DOM is clearer;
- avoid copying proprietary game assets/layouts.

Visual polish is successful only when the game remains understandable and functional.

## 12. Testing philosophy

Tests exist to protect behavior, not to inflate counts.

Prefer:
- deterministic rule tests;
- property/edge-case tests for HugeNumber and persistence;
- targeted interface contracts;
- browser tests for actual interaction/layout-sensitive behavior;
- explicit regressions for bugs that previously reached the user.

Avoid keeping redundant tests that add maintenance cost without protecting a distinct behavior.

A green Node/jsdom suite does not certify real browser layout.
A green emulated mobile browser does not certify a physical Android device.

## 13. How a new AI should resume the project

On a fresh conversation:

1. Read this file.
2. Read the latest Master Dev File completely enough to understand the current phase and invariants.
3. Resolve the exact current `main` HEAD.
4. Inspect open PRs/branches and current CI.
5. Read the latest relevant report/specification.
6. Compare documentation against runtime reality.
7. Continue the smallest logical task that reduces architectural or regression risk.
8. Do not duplicate work already active in another branch.
9. Run the appropriate automated/browser regressions.
10. Document durable decisions before ending the development cycle.

If this file conflicts with current `main`, current code/tests and the latest Master win.

## 14. Separation from other projects

Cookie Empire is a separate project.

Do **not** import assumptions, mechanics, documentation or architecture from World Cultivation Incremental merely because the same owner develops both projects.

Cross-project inspiration is acceptable only when explicitly evaluated for Cookie Empire.

## 15. Core continuity principle

The project should survive deletion of old chats.

Important technical knowledge belongs in GitHub.
Important durable product intent belongs in project documentation.
Tests preserve verified behavior.
Chats are useful working context, but they must never be the only place where a critical project decision exists.


## 16. Candidate long-term product vision and future feature pool

These are **candidate directions**, not committed scope and not permission to implement them automatically.

Before implementing any item, revalidate the current architecture, specify the mechanic, identify authoritative versus derived state, assess save compatibility, model balance impact, add appropriate tests, and obtain product-direction confirmation when the choice materially changes the game.

The broad progression fantasy worth exploring is:

**Cookie → Atelier → industrial empire → Orbite → space empire → Cosmos → galactic exploration → Infini → endgame challenges.**

The cookie/clicker identity should remain recognizable while the scale and strategic depth grow.

Candidate systems:

1. **Gameplay eras** — Atelier, Orbite, Cosmos and Infini can eventually become mechanically distinct progression eras rather than visual categories only. Each era should add understandable depth instead of arbitrary complexity.
2. **Generator mastery** — generators can gain long-term mastery or milestone progression so early generators remain relevant. Prefer derived progress where possible and avoid grind without meaningful decisions.
3. **Deeper generator specialization** — future branches could support production, click, synergy, efficiency or other play styles. Avoid false choices where one branch is mathematically dominant in every situation.
4. **Constellations / generator sets** — combinations of generators could activate thematic synergies, creating intermediate strategic targets without necessarily requiring a new currency.
5. **Dynamic missions** — short contextual goals can create decisions between major purchases. They should complement, not replace, the 44-objective progression.
6. **Tiered achievements** — collection/progression achievements may provide long-term goals. If rewards exist, keep them controlled so achievement farming does not become mandatory.
7. **Cosmic events** — occasional temporary events such as meteor showers, anomalies, portals or supernova-like effects can vary play. Timing must remain centralized and deterministic/testable where possible.
8. **Unlockable automation** — auto-buy or configurable automation can become a late progression reward. It should not remove meaningful early-game decisions and must use existing Engine/Economy purchase contracts rather than bypass them.
9. **Higher prestige layer** — a future endgame reset above current Rayonnement/Éclats may be considered only after the current prestige loop is measured and proven. This would be a structural feature requiring explicit state/save/migration design.
10. **Cosmic map / exploration** — a future map of planets, systems or regions could become a major identity feature for Cookie Empire. It should connect to existing progression rather than becoming an unrelated second game.
11. **Expeditions** — timed missions from the exploration layer could create useful return/offline decisions. They require careful time, persistence and clock-manipulation contracts before implementation.
12. **Cosmic artifacts** — rare collectible/equippable modifiers could support build diversity. Keep inventory/state bounded and effects owned by Economy.
13. **Challenge universes** — temporary runs with altered constraints can reuse the existing engine for endgame content. Challenge state must be isolated so normal saves and progression cannot be corrupted.
14. **Empire Codex** — a discovery/collection interface could explain generators, research, constellations, artifacts, events and world progression while reinforcing player comprehension.
15. **Advanced statistics** — total play time, lifetime production, best CPS, prestige history, generator contribution and related metrics may help both players and balancing. Persist only metrics that cannot be safely reconstructed and have a clear product purpose.

### Architectural preparation for future systems

Do not implement the entire feature pool at once.

Before major expansion, audit the current concentration of HTML, CSS, Content, HugeNumber, Economy, GameState, GameEngine, Persistence, UI and application orchestration in `index.html`. Prefer incremental extraction/modularization protected by regression tests over a large rewrite.

Target responsibility flow remains:

**Content → Economy → Game Engine → Persistence → UI**

A future feature must have a clear owner. UI must not recreate formulas. New independent timers should not bypass the central time model. HugeNumber values should not be converted to ordinary Number prematurely.

Do not create a save-schema v8 merely to prepare for possible features. Introduce a new schema only when a confirmed mechanic requires new authoritative persisted state, with explicit migration and import/export/corruption coverage.

### Progression observability before large economic expansion

Extend the deterministic balance observatory before substantial economy changes. Useful milestones include:

- start → first generator;
- first ×10 / Max purchase;
- first researches;
- era transitions;
- specialization access;
- advanced generators;
- first prestige;
- approximate prestige-cycle duration;
- acceleration of subsequent cycles;
- late-game progression.

Use the real Economy rules rather than duplicating formulas in the analyzer.

The observatory should help detect progression walls, runaway acceleration, obsolete purchases, excessive dead time, weak/overpowered prestige and dangerous numeric growth.

### Preferred sequencing principle

The default strategic order for future development is:

**stability → observability → extensibility → new mechanics → deeper endgame**

A plausible future sequence, subject to revalidation and product decisions, is:
- strengthen observability/modularity;
- generator mastery / constellations / richer achievements or missions;
- era-specific mechanics and carefully earned automation;
- cosmic map / exploration / expeditions / artifacts;
- challenge universes and only then consider a higher prestige layer.

This ordering is guidance, not a frozen roadmap. Prefer the smallest next feature that creates meaningful player decisions without destabilizing the validated foundation.
