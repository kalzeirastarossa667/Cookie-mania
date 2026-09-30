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
