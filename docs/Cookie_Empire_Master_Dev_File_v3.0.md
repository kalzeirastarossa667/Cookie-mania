# COOKIE EMPIRE — MASTER DEV FILE
Version: 3.0
Status: FOUNDATION 2.4 SYNERGIES / SOURCE OF TRUTH
Last audit: 2026-09-30

## 0. Purpose

This file is the project memory and development contract for Cookie Empire.

Before changing the game, read this file.
Do not silently discard its decisions.
When a new decision is made, update this file before implementing a large feature.

Primary goal:
Build a stable browser idle/clicker game whose systems are understandable, testable, and extensible.

Core rule:
DO NOT ADD FEATURES ON TOP OF AN UNVERIFIED FOUNDATION.

---

# 1. Project history and lessons

Previous versions suffered from:
- clicking that appeared to work but did not reliably increase cookies;
- saved values that could silently invalidate gameplay;
- XP thresholds that were mathematically wrong;
- quest UI that could become stale;
- excessive coupling between game logic and DOM rendering;
- too many features being added before the core mechanics were proven;
- insufficient real-browser testing;
- overconfident claims that a correction was "done" after only static inspection.

These are known failure modes.

Never repeat them.

---

# 2. Development philosophy

Every feature must pass four stages:

1. SPECIFICATION
   Define exactly what the feature means.

2. IMPLEMENTATION
   Implement the smallest possible version.

3. AUTOMATED TEST
   Test normal cases, edge cases, and invalid data.

4. BEHAVIORAL TEST
   Verify the actual browser behavior when relevant.

Only then can the feature be considered stable.

Never use "the code looks correct" as proof that the feature works.

---

# 3. Current architecture target

The project must remain conceptually separated into:

GameState
  ↓
Game Rules / Economy
  ↓
Game Engine / Time
  ↓
Persistence
  ↓
UI
  ↓
Content

Recommended responsibilities:

## GameState
Contains the source-of-truth gameplay state.

Examples:
- cookies
- total produced
- total clicks
- generator ownership
- upgrade ownership
- progression data

Do not store values that can be safely derived unless there is a concrete reason.

## Economy
Contains mathematical rules:
- adding cookies
- spending cookies
- production per second
- costs
- multipliers
- formatting

UI code must not contain economic rules.

## GameEngine
Advances the simulation with elapsed time.

It must not depend on the visual frame rate.

requestAnimationFrame is a rendering/update mechanism, not the persistent game clock.

## Persistence
Responsible for:
- save
- load
- validation
- versioning
- migration
- corruption handling

The rest of the game should not directly manipulate localStorage.

## UI
Reads game state and displays it.

UI must not become the source of truth.

---

# 4. Time model

There are two different notions of time.

## In-session time
Use a monotonic high-resolution timer / requestAnimationFrame timestamp for simulation.

Concept:

elapsedSeconds = (currentFrameTime - previousFrameTime) / 1000

Production:
production += CPS × elapsedSeconds

Cap unusually large frame deltas to prevent absurd simulation jumps after stalls.

## Between-session time
Use a persisted wall-clock timestamp such as Date.now().

On load:

offlineSeconds =
  currentWallClock - savedWallClock

Then clamp to a deliberate maximum.

IMPORTANT:
Date.now() can be affected by system clock changes.
Therefore offline production is not a security mechanism.

The game is single-player; robustness is more important than anti-cheat.

---

# 5. Persistence rules

localStorage is acceptable for the early browser version.

However:
- access must be wrapped in Persistence code;
- save/load must use JSON;
- save data must have an explicit version;
- invalid data must never crash the game;
- every loaded field must be validated;
- logically impossible states must be rejected or normalized;
- derived values should be reconstructed rather than blindly trusted;
- migrations must exist when the save format changes.

Never assume localStorage is always available.

A save failure must not break gameplay.

A corrupted save must fail safely.

For large future saves or more demanding persistence, consider IndexedDB instead of synchronous Web Storage.

---

# 6. Number system — DECISION REQUIRED BEFORE LARGE ECONOMY

Current prototype may use Number for small values.

This is NOT a final decision for the full idle game.

Before implementing large-scale Cookie Empire economy, choose and document one system:

- Number
- BigInt
- Decimal implementation/library
- custom scientific-number representation
- hybrid representation

Requirement:
The chosen system must define:
- integer/decimal behavior;
- multiplication;
- division;
- comparison;
- zero;
- infinity/invalid values;
- serialization;
- formatting;
- upgrade scaling;
- cost scaling.

Do NOT build hundreds of upgrades before this decision.

---

# 7. Source of truth rules

For every state field, decide whether it is:

A. SOURCE OF TRUTH
or
B. DERIVED VALUE.

Example:

SOURCE:
generator count

DERIVED:
cookies per second

SOURCE:
owned upgrade IDs

DERIVED:
current click multiplier, if it can be reconstructed safely

Never create two independent sources for the same fact unless necessary.

This prevents save inconsistencies.

---

# 8. Core gameplay rules — currently intentionally minimal

The foundation should initially contain only:

- click cookie;
- receive cookies;
- basic automatic production;
- save;
- load;
- offline production;
- reset;
- basic UI;
- automated tests.

Do NOT add yet:
- XP
- levels
- quests
- achievements
- generators beyond the minimal test generator
- upgrade trees
- prestige
- achievements
- particles
- complex animations
- large content lists

These come later.

---

# 9. Test protocol

Every new system must have tests.

## Core economy tests

Test:
- initial cookies = 0;
- one click adds exactly one base click reward;
- ten clicks add exactly ten base rewards;
- zero/negative reward is rejected;
- non-finite reward is rejected;
- spending cannot create negative cookies;
- production for 1 second matches expected CPS;
- production for 10 seconds matches expected CPS;
- fractional CPS works correctly.

## Time tests

Test:
- 0 elapsed seconds;
- normal elapsed time;
- fractional elapsed time;
- large frame stall;
- capped frame delta;
- no negative delta.

## Save tests

Test:
- save then load;
- empty save;
- missing save;
- malformed JSON;
- wrong version;
- missing fields;
- invalid numeric values;
- impossible values;
- extra unknown fields.

## Offline tests

Test:
- 0 seconds;
- 10 seconds;
- 1 hour;
- maximum allowed duration;
- negative clock difference;
- invalid timestamp.

## Reset tests

Test:
- reset clears gameplay state;
- reset removes/replaces the correct save;
- reset does not corrupt unrelated data.

## UI tests

Test:
- click button exists;
- click event works;
- displayed balance matches state;
- displayed CPS matches state;
- disabled/enabled controls match state.

---

# 10. Regression rule

When a bug is found:

1. Reproduce it.
2. Write a minimal test that fails.
3. Fix the code.
4. Confirm the test now passes.
5. Run the previous tests again.
6. Only then continue development.

Never fix a bug by changing several unrelated systems at once.

---

# 11. Versioning

Use explicit versions.

Examples:

Foundation:
0.1

First stable core:
0.2

First economy:
0.3

First content layer:
0.4

First complete playable prototype:
0.5

Release candidate:
1.0

Do not reuse an old save format under a new meaning.

If state structure changes:
- migrate it;
or
- explicitly invalidate it.

---

# 12. UI principles

The UI is secondary to the simulation.

Rules:
- no duplicated game logic in HTML handlers;
- event listeners call game methods;
- UI reads state;
- frequent rendering must be throttled;
- full DOM reconstruction should not happen every animation frame;
- mobile layout must be considered from the beginning;
- buttons must have clear disabled states;
- important values must remain readable.

Avoid global inline handlers such as:
onclick="game.someMethod()"

Prefer:
addEventListener(...)

---

# 13. Known technical facts

requestAnimationFrame:
- generally follows the display refresh rate;
- is one-shot and must be requested again;
- is commonly paused in background tabs;
- should use its timestamp/delta to avoid refresh-rate-dependent simulation.

Therefore:
requestAnimationFrame is suitable for active-session simulation/render updates,
but NOT sufficient by itself for offline idle progression.

localStorage:
- persists across browser sessions;
- is synchronous;
- can be unavailable or restricted;
- should be accessed through a dedicated persistence layer.

performance.now():
- is monotonic during a browsing context;
- is appropriate for measuring elapsed active-session time;
- should not be treated as a cross-session timestamp.

---

# 14. Current known weaknesses

These are deliberately recorded so they are not forgotten:

- Foundation tests are not yet exhaustive.
- Browser-level testing is not yet comprehensive.
- Number system is now decided and automatically tested; real-browser verification of the numeric build remains to be performed.
- Persistence validation needs stronger logical consistency checks.
- Offline time is vulnerable to system-clock manipulation.
- Multi-tab synchronization is not yet designed.
- The final economy has not yet been specified.
- XP/levels are intentionally absent from the foundation.
- Quests are intentionally absent from the foundation.

Never hide these weaknesses in future progress reports.

---

# 14.1 Foundation test milestone

Foundation 0.2 was produced from the original Foundation 0.1 and hardened before adding gameplay systems.

Automated core suite: **15/15 passed**.

Covered:
- initial state
- single click
- repeated clicks
- click power
- zero CPS
- fractional CPS
- invalid elapsed time
- offline production cap
- invalid offline time
- number formatting
- save/load round-trip
- corrupted JSON
- invalid save version
- missing save fields
- invalid numeric data
- impossible state (`clickPower < 1`, inconsistent production)

Static JavaScript syntax check: **passed** with `node --check`.

Browser-level automated verification is **not yet counted as passed**. A headless Chromium run was attempted, but the execution environment did not terminate cleanly with this continuously running browser page. Therefore this milestone does not claim full browser behavioral verification.

# 15. Definition of "stable"

A version is stable only if:

- its specification is explicit;
- automated tests pass;
- important browser behavior has been tested;
- save/load works;
- invalid saves fail safely;
- no known blocking bug remains;
- previous regression tests still pass.

"Syntax valid" is NOT equivalent to "stable".

"Looks clean" is NOT equivalent to "stable".

"Works once" is NOT equivalent to "stable".

---

# 16. Roadmap

PHASE 1 — FOUNDATION
[CURRENT]
- core state
- click
- basic production
- time engine
- persistence
- offline foundation
- tests

PHASE 2 — HARDENING
- complete automated tests
- browser behavior tests
- save validation
- migration strategy
- number-system decision
- multi-tab decision

PHASE 3 — ECONOMY
- generator model
- cost curves
- CPS
- click power
- multipliers
- balancing formulas

PHASE 4 — PROGRESSION
- XP
- levels
- objectives
- achievements

PHASE 5 — CONTENT
- generator catalogue
- upgrade catalogue
- unlocks
- special mechanics

PHASE 6 — PRESENTATION
- animations
- particles
- sounds
- visual polish
- responsive polish

PHASE 7 — RELEASE
- full regression suite
- save migration test
- performance test
- mobile test
- long-session test
- final packaging

---

# 17. AI DEVELOPMENT CHECKLIST

Before writing code, ask:

[ ] What exact rule am I implementing?
[ ] Is the rule already defined here?
[ ] What is the source of truth?
[ ] What are the edge cases?
[ ] What test proves it works?
[ ] Can this change break an older system?
[ ] Does the save format change?
[ ] Does the number system support it?
[ ] Does the browser behavior need testing?

After writing code:

[ ] Syntax check
[ ] Unit tests
[ ] Regression tests
[ ] Browser test when applicable
[ ] Inspect generated file
[ ] Report limitations honestly

---

# 18. Non-negotiable project rule

NEVER SAY:

"Everything is fixed."

unless the relevant behavior has actually been verified.

Prefer:

"Implemented and statically verified."

or:

"Implemented and tested with X/Y/Z."

or:

"Implemented, but browser-level verification is still missing."

Accuracy of the development report is part of the project.

---

# 19. Historical next action — superseded by sections 25–26

Foundation 0.4 implements the first minimal economy model and passes the automated regression suite.

Do NOT add a large generator/content list yet.

Next:

BROWSER-VERIFY FOUNDATION 0.4, then harden the generator-count model before expanding the economy.

Verify in the browser:
- cursor purchase at exactly 15 cookies;
- balance deduction;
- owned count increment;
- CPS becomes 0.1;
- automatic production increases cookies;
- save/reload preserves cursor ownership and reconstructs CPS;
- new game clears generator ownership.

After browser verification, decide whether generator ownership counts remain safe-integer `Number` values or move to a larger integer representation before large-scale generator content is introduced.



## 14.2 Browser smoke-test result — Foundation 0.2

User verification reported:
- clicking: PASS
- save/load: PASS
- new game: FAIL before patch

Root cause:
The reset action called `localStorage.removeItem(...)` and then relied on `location.reload()`. The reset behavior therefore depended on browser reload behavior instead of explicitly replacing the in-memory game state.

Patch:
- clear the persisted save;
- create a fresh `GameState`;
- replace the `GameEngine`;
- reconnect the UI to the new engine;
- reset frame timing;
- render zeroed state;
- persist the fresh state;
- show a confirmation message.

This removes the reload dependency. Static JavaScript syntax verification passed after the patch.

Browser verification of the patched reset action: PASS (user confirmed new game now works).

# 20. Number-system decision — Foundation 0.3.1

Decision date: 2026-09-27

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED.
Browser-level verification of this numeric build: PASS (user validated click, save, and new game).

## 20.1 Representation

Cookie Empire uses a custom scientific-number representation named `HugeNumber` for economy values.

Canonical form:

`mantissa × 10^exponent`

Rules:
- zero is represented canonically as `{m:0,e:0}`;
- positive non-zero values are normalized so `1 <= m < 10`;
- mantissa uses JavaScript `Number` precision;
- exponent is stored separately, preventing overflow at `Number.MAX_VALUE` for ordinary idle-game scales;
- negative economy values are invalid;
- display formatting is separate from internal representation.

Authoritative economy fields using HugeNumber in the current foundation:
- cookies;
- totalProduced;
- clickPower;
- cps.

`totalClicks` remains an integer Number because it is a count and does not currently require HugeNumber arithmetic.

## 20.2 Supported operations

The numeric layer defines and tests:
- addition;
- subtraction clamped at zero;
- multiplication;
- division with division-by-zero rejection;
- comparison;
- fractional values;
- exponentiation for economic scaling;
- exponential generator-cost scaling;
- JSON serialization/deserialization.

When adding numbers whose exponents differ by more than the mantissa precision can represent, the smaller addend is intentionally ignored. This is a precision tradeoff, not overflow.

## 20.3 Persistence

Save format version 2 serializes HugeNumber values as:

`{ "m": <mantissa>, "e": <exponent> }`

Version-1 Number saves are migrated into HugeNumber when valid. Invalid, impossible, future-dated, malformed, or unsupported saves fail safely.

## 20.4 Display policy

Formatting does not control arithmetic.

The current French long-scale display includes:
- mille;
- million;
- milliard;
- billion;
- billiard;
- trillion;
- trilliard;
- quadrillion;
- quadrilliard;
- quintillion;
- quintilliard;
- sextillion;
- and further named scales through décilliard.

Beyond the named display table, values fall back to scientific notation instead of imposing an engine limit. The naming layer may be extended later without changing saved numeric values or economy arithmetic.

## 20.5 Verification milestone

Foundation 0.3.1 automated suite: **22/22 passed** in the Node harness.

Covered:
- all previous foundation regression cases;
- huge values such as `1e1000`;
- arithmetic across large exponent differences;
- fractional arithmetic;
- serialization round-trip;
- exponential cost scaling;
- invalid numeric operations;
- large-number naming/formatting;
- save/load and corrupted-save rejection.

JavaScript syntax check: **passed** with `node --check`.

Browser-level behavioral verification for Foundation 0.3.1: **PASS**. User validated click, save, and new game on 2026-09-27.



# 21. First economy model — Foundation 0.4

Decision date: 2026-09-27

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED + BROWSER VERIFIED.

## 21.1 Content model

Generator definitions are immutable content data in `GENERATORS`. The first proof generator is `cursor`:
- base cost: 15 cookies;
- growth rate: 1.15 per owned cursor;
- base production: 0.1 cookie/second per cursor.

Only one generator is intentionally present. The purpose of Foundation 0.4 is to validate the architecture, not to add content volume.

## 21.2 Source of truth

Authoritative state:
- `state.generators.cursor` = owned cursor count.

Derived state:
- `state.cps` is a runtime cache reconstructed by `Economy.deriveCps` / `Economy.refreshDerived`.

Save version 3 does **not** persist CPS. This prevents generator ownership and CPS from becoming two independent sources of truth.

## 21.3 Cost and purchase rules

Generator price:

`baseCost × growthRate^owned`

The calculation uses `HugeNumber` through the Economy layer.

A purchase is atomic:
1. resolve generator definition;
2. derive current cost;
3. compare balance with cost;
4. if unaffordable, mutate nothing;
5. if affordable, subtract cost;
6. increment owned count;
7. rebuild derived CPS.

Subtraction cannot create a negative cookie balance.

## 21.4 Persistence version 3

Save version 3 persists:
- cookies;
- totalProduced;
- totalClicks;
- clickPower;
- generator ownership;
- lastSavedAt.

CPS is reconstructed after load.

Version-2 and version-1 saves remain loadable. Because those versions contain no authoritative generator ownership, migration initializes cursor ownership to zero and reconstructs CPS from that state instead of trusting the old saved CPS field.

Invalid or negative generator ownership rejects the save safely.

## 21.5 Verification milestone

Foundation 0.4 JavaScript syntax: **PASS** with `node --check`.

Automated regression suite: **28/28 PASS** in the Node harness.

New economy coverage includes:
- CPS derived from owned cursors;
- purchase succeeds at exact cost;
- exact balance is deducted;
- ownership increments;
- CPS updates after purchase;
- purchase below cost fails without mutation;
- cursor cost follows exponential scaling;
- corrupted generator ownership is rejected;
- v2 migration ignores obsolete saved CPS and reconstructs derived CPS;
- all previous numeric, click, time, offline, persistence, and corruption tests remain passing.

Browser verification for Foundation 0.4: **PASS**. User validated the purchase flow, automatic production, save/load persistence, and new-game reset on 2026-09-27.

## 21.6 Known limit requiring a deliberate next decision

Generator ownership uses a non-negative JavaScript safe integer (`Number.isSafeInteger`). Foundation 0.4.1 resolves this as a deliberate long-term invariant rather than a temporary assumption; see section 22.


# 22. Generator-count invariant and bulk purchases — Foundation 0.4.1

Decision date: 2026-09-27

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED + BROWSER VERIFIED.

## 22.1 Ownership representation decision

Generator ownership remains a non-negative JavaScript safe integer. It is intentionally **not** represented by `HugeNumber`.

Rationale:
- ownership is a discrete count and must remain exact;
- exponential generator pricing makes the safe-integer ceiling economically unreachable long before integer precision becomes a practical gameplay constraint;
- safe integers keep persistence, indexing, validation, and purchase quantities simple;
- converting ownership to `HugeNumber` would add complexity without a realistic gameplay benefit.

Invariant: `0 <= owned <= Number.MAX_SAFE_INTEGER`. Purchases that would exceed the ceiling are rejected without mutation.

This decision is independent from cookie/cost/CPS arithmetic, which continues to use `HugeNumber`.

## 22.2 Bulk purchase mathematics

A batch of `q` generators starting from ownership `n` costs the geometric sum:

`baseCost × growthRate^n × (growthRate^q - 1) / (growthRate - 1)`

When growth rate is exactly 1, batch cost is `currentCost × q`.

The calculation is owned by Economy and uses `HugeNumber`. Small floating mantissa differences caused by mathematically equivalent operation order are tested with an explicit relative tolerance (`< 1e-12`) rather than exact object equality.

## 22.3 Purchase semantics

`buyGenerators(id, quantity)` is atomic:
- invalid quantity => 0 purchased, no mutation;
- insufficient funds => 0 purchased, no partial purchase;
- counter overflow => 0 purchased, no mutation;
- affordable valid batch => deduct full batch cost once, increment ownership once, rebuild CPS once.

`buyGenerator(id)` remains the single-purchase compatibility path and delegates to `buyGenerators(id, 1)`.

## 22.4 Max purchase algorithm

`Max` must not loop once per purchased generator. `Economy.maxAffordableGeneratorCount` uses:
1. exponential search to bracket the affordable quantity;
2. binary search to find the exact maximum affordable safe-integer quantity.

This makes the number of affordability checks logarithmic in the quantity purchased.

## 22.5 Persistence

Save schema remains version 3. Bulk buying introduces no new authoritative state, so no migration is justified.

## 22.6 Verification milestone

Foundation 0.4.1 JavaScript syntax: **PASS** with `node --check`.

Automated regression suite: **33/33 PASS** in the Node harness.

New coverage:
- batch geometric cost agrees with sequential cost within the documented numeric tolerance;
- exact ×10 purchase;
- insufficient ×10 is atomic and performs no partial purchase;
- Max resolves the exact affordable quantity;
- ownership ceiling cannot overflow.

All 28 Foundation 0.4 regression tests remain passing.

Browser verification for Foundation 0.4.1: **PASS**. User validated single purchase, ×10, Max, production, save/load, and new-game reset on 2026-09-27.

## 22.7 Next logical step

Foundation 0.4.1 browser validation is complete. The data-driven generator architecture proof is implemented in Foundation 0.5; see section 23.


# 23. Data-driven generator architecture proof — Foundation 0.5

Decision date: 2026-09-27

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED. Browser verification pending.

## 23.1 Purpose

Foundation 0.5 proves that generator expansion does not require duplicated economy or UI logic. A second generator is introduced only as an architecture proof before expanding game content.

## 23.2 Content source of truth

`GENERATORS` is the authoritative immutable content table for generator definitions. Each definition currently owns: `id`, display `name`, `icon`, `baseCost`, `growthRate`, and `baseCps`.

Current proof content:
- Cursor: base cost 15, growth ×1.15, 0.1 CPS each.
- Grandma: base cost 100, growth ×1.15, 1 CPS each.

These values are foundation proof values, not final balance commitments.

`GameState.generators` contains only authoritative ownership counts and is initialized from the generator-definition IDs. CPS remains derived by Economy across all definitions.

## 23.3 Generic UI

Generator cards are generated from `GENERATORS`. The UI no longer owns Cursor-specific DOM fields or Cursor-specific purchase handlers. A delegated purchase handler routes ×1, ×10, and Max actions by generator ID to the existing generic GameEngine methods.

Adding a future generator should therefore require a content definition rather than duplicated purchase/economy/UI rules.

## 23.4 Persistence compatibility

Save schema remains version 3 because no new kind of authoritative state was introduced; `generators` was already a keyed ownership object.

For known generator IDs missing from an older v3 save, Persistence initializes ownership to zero. Present generator counts must still be non-negative safe integers. This provides forward compatibility when content definitions add generators without weakening validation of stored values.

## 23.5 Verification milestone

Foundation 0.5 JavaScript syntax: **PASS** with `node --check`.

Automated regression suite: **37/37 PASS** in the Node harness.

New coverage proves:
- the second generator uses the generic engine purchase path;
- CPS combines multiple generator types;
- initial state covers every generator definition;
- an older v3 save missing the newly introduced generator loads with that generator initialized to zero;
- all Foundation 0.4.1 regression behavior remains passing.

Browser verification for Foundation 0.5: **PASS**. User validated the multi-generator purchase/production/save/reset behavior on 2026-09-27. The real-time production rate was observed as plausible but was not manually stopwatch-measured; deterministic time invariants are locked in Foundation 0.5.1.

## 23.6 Next logical step

Foundation 0.5 browser validation is complete. Foundation 0.5.1 locks the fundamental production/time invariants before progression work. After browser validation of 0.5.1, specify the upgrades/multipliers layer and its interaction with derived CPS, HugeNumber arithmetic, persistence, and data-driven content.


# 24. Fundamental production/time invariants — Foundation 0.5.1

Decision date: 2026-09-27

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED. Browser verification pending.

## 24.1 Fundamental law

Unless a future mechanic explicitly changes simulation time or production rules, automatic production obeys:

`produced = CPS × elapsed simulation seconds`

Therefore 1 CPS means exactly one cookie per simulated second. Examples locked by tests:
- 0.1 CPS × 10 s = 1 cookie;
- 4.8 CPS × 10 s = 48 cookies.

CPS remains derived from authoritative generator ownership. `GameEngine.tick(seconds)` applies the derived CPS to elapsed simulation time and credits both current cookies and total produced.

## 24.2 Time subdivision invariant

For an unchanged economic state, subdividing the same elapsed duration must not change production. Ten simulated seconds processed as one 10-second tick must agree with the same ten seconds processed as 100 × 0.1-second ticks, subject only to the numeric representation's established precision behavior.

This invariant protects the economy from accidental dependence on rendering FPS or UI refresh cadence.

## 24.3 Persistence

No authoritative state changed. Save schema remains version 3 and no migration is required.

## 24.4 Verification milestone

Foundation 0.5.1 JavaScript syntax: **PASS** with `node --check`.

Automated regression suite: **40/40 PASS** in the Node harness.

New coverage:
- 0.1 CPS for 10 seconds produces exactly 1 cookie;
- 4.8 CPS for 10 seconds produces exactly 48 cookies;
- equivalent elapsed time split into 100 ticks produces the same result as one tick.

All 37 Foundation 0.5 tests remain passing.

Browser verification for Foundation 0.5.1: **PASS — user confirmed on 2026-09-27**. No new gameplay mechanic was added; this release formalizes and regression-tests the existing time-production contract.

## 24.5 Next logical step

After browser smoke validation, specify the upgrades/multipliers system before adding more generator content. Multipliers must modify derived economic values through Economy rather than becoming independent saved CPS values.

# 25. Upgrades and multipliers — Foundation 0.6

Decision date: 2026-09-27. This section supersedes historical next-action/status statements above.
Status before implementation: SPECIFIED. Final verification is recorded in section 26.
Baseline: exactly the supplied Foundation 0.5.1 and Master v1.7; no older implementation reused.
User confirmed Foundation 0.5.1 browser validation on 2026-09-27.

## 25.1 Architecture readiness and prerequisite repair

The baseline has 40 passing automated tests, generic generator ownership/purchases/UI,
HugeNumber arithmetic, CPS derivation, and versioned persistence. These are sufficient
for a small permanent upgrade system after one numeric prerequisite repair.
A new failing test reproduced `0.compare(0.1) > 0`: comparison checked exponent before
zero. Fix only the zero ordering in HugeNumber.compare. Regression covers both directions,
equality, and fractional subtraction with zero. All 40 baseline tests plus this test pass.
This is directly relevant to fractional production, affordability and save consistency.
Existing time rules, generator costs/counts, bulk algorithm and storage key are retained.

## 25.2 Content and authoritative state

Immutable `UPGRADES` definitions own stable ID, name, description, fixed HugeNumber-compatible
cost string, and immutable effect `{target, factor, generatorId?}`. Supported targets:
`click`, `generator`, `globalCps`. Factors must be finite representable positive values >= 1;
costs must be positive. Validate definitions once at startup, reject unknown targets/IDs.
Starter catalogue (architecture proof, not final balance):
- reinforced_click: 50 cookies, click ×2;
- efficient_cursor: 100 cookies, cursor CPS ×2;
- grandma_recipe: 500 cookies, grandma CPS ×2;
- warm_ovens: 1000 cookies, global CPS ×1.5.
No prerequisites, unlocks, repeatable purchases, refunds, timed effects or cost reductions.
All are visible and can be bought before owning a generator; the effect applies to later purchases.

`state.ownedUpgrades` contains unique known upgrade IDs. It is authoritative.
Keep `state.clickPower` as the authoritative BASE click reward (including legacy custom values),
not the upgraded reward. New derived `state.clickReward` is base clickPower × click multiplier.
`state.cps` and `state.clickReward` are disposable runtime caches, never saved.
Content IDs must not be renamed/removed without a migration. Changing a factor changes the
reconstructed effect for every owner; catalogue balance changes must be deliberate/documented.

## 25.3 Economy formulas and cache lifecycle

Economy computes HugeNumber products in CONTENT order, independent of acquisition order:
Mclick = product of owned click factors;
Mglobal = product of owned globalCps factors;
Mg[id] = product of owned generator factors for this ID; empty product = 1.
clickReward = base clickPower × Mclick.
unitCps[id] = baseCps[id] × Mg[id] × Mglobal.
CPS = sum(count[id] × baseCps[id] × Mg[id]) × Mglobal.
Click effects do not affect CPS; CPS effects do not affect clicks. Global CPS affects all present
and future generators. No CPS-to-click conversion or additive percentages in this release.
Economy is the only owner of these formulas. UI displays effective per-unit production.
Rebuild derived values on engine creation, loading, successful purchases and existing tick refresh.
Reuse one derived multiplier calculation within each refresh; no per-generator upgrade scan.
Retain tick recomputation for compatibility with existing tests/direct state setup. Optimizing
this with invalidation is deferred until catalogue scale provides a concrete need.

## 25.4 Purchase and invalid-input contract

Engine calls Economy for a quote: unknown / owned / insufficient / available.
Unknown/non-string IDs (including prototype keys), duplicate purchases and insufficient funds
return false with no mutation. At exact cost the purchase succeeds with zero balance.
Prepare next ownership, derived values and deducted balance before committing them atomically.
Do not alter generator counts, totalProduced or totalClicks on spending.
Repeated rapid clicks cannot buy an upgrade twice. UI state is advisory; engine rechecks.
No mutation of immutable Content. Invalid runtime ownership fails loudly in derivation;
Persistence catches and rejects invalid serialized ownership safely.

## 25.5 Persistence v4 and migrations

Keep localStorage key `cookie-empire-foundation-v2` for continuity on the same browser origin.
Write explicit envelope version 4, existing authoritative fields plus ownedUpgrades.
Do not write cps, clickReward, multipliers, effective per-unit CPS or UI state.
V1 and v2 migrate as before (zero generators); v3 retains validated generators.
All legacy versions initialize ownedUpgrades=[] and retain old clickPower as BASE.
V4 requires an array of unique known string IDs, bounded by current catalogue length.
Missing/null/wrong-shaped ownership, unknown IDs and duplicates reject the complete save;
do not silently strip paid upgrades. Current v4 scalar fields have strict numeric types and
safe non-negative click count/timestamp. Legacy normalization remains compatible.
Ignore unknown extra derived fields; rebuild caches from Content and ownership.
Reject unsupported schema versions, malformed numbers and inconsistent production totals.
Save/load exceptions are contained by SaveSystem as before.

## 25.6 Regression risks and required evidence

Check neutral multipliers; all four scopes; stacking; order independence; fractional and huge
rewards; no double application after refresh/load; base click reward migration; atomic exact/
insufficient/duplicate/invalid purchases; upgrades before generators; ×1/×10/Max costs unchanged;
production/time subdivision; 30-day offline cap with upgraded CPS; reset and UI state;
v1/v2/v3/v4 loading; corrupted v4 fields; absence of derived values from save; unavailable storage.
Rerun every embedded baseline test. Test actual DOM interactions, reload, reset, native keyboard
activation of upgrade controls, mobile overflow and live production in Chromium if available.
Known baseline limitations remain: no multi-tab coordination, ~15 significant digits,
wall-clock manipulation of offline time, 0.5-second frame cap, 250 ms autosave cadence,
limited long-session/device coverage. HugeNumber exponent itself remains finite Number, not
mathematically unbounded. Do not expand unrelated systems during this milestone.

# 26. Foundation 0.6 verification and handoff

Status: IMPLEMENTED + STATICALLY VERIFIED + AUTOMATICALLY TESTED.
REAL BROWSER VALIDATION: USER CONFIRMED on 2026-09-27 (see section 27). The results below describe the earlier automated handoff.

## 26.1 Results (2026-09-27)

- JavaScript `node --check`: PASS.
- Embedded economy/regression suite under Node v24.19.0: **73/73 PASS**.
- All 40 original 0.5.1 tests remain present and passing without changing their assertions.
- Integration suite with jsdom 30.1.1: **12/12 PASS**.
- DOM simulation covers startup, cookie click, exact-price upgrade purchase, duplicate prevention,
  effective production labels, stable card nodes, ×1/×10/Max, save/recreate document, reset,
  keydown routing, v3 startup migration, offline startup, simulated RAF frame cap and inaccessible
  storage. jsdom is NOT a real browser and does not validate rendering or native key activation.
- Numeric prerequisite regression reproduced before repair; zero/fractions/subtraction now pass.
- Audit regression reproduced: a v4 generator count explicitly null was treated as missing. V4
  now rejects it, while missing known IDs still initialize to zero and legacy handling is retained.
- Keyboard regression reproduced using the old global handler: Enter on an upgrade button was
  intercepted as a cookie click. Scope global shortcuts away from interactive controls; native
  button activation is left to the browser. DOM keydown regression passes; native activation
  remains part of the required real-browser checklist.
- Read-through/diff audit: original timing loop, generator pricing/bulk algorithm and persisted
  storage key retained; new upgrade purchases prepare all derived values before committing.

Browser attempts: the local Chromium package download could not be installed (invalid archive).
The connected browser then rejected local HTTP and file access under its environment/security
policy. No workaround was used. No screenshot, mobile-layout validation or live browser test is
claimed. Deliver the self-contained HTML as a candidate for the user's browser validation.

## 26.2 Remaining limits

- Four upgrades are proof content; prices and progression have not been balanced.
- Browser rendering, native keyboard activation and real mobile behavior still require validation.
- localStorage continuity requires the same origin; persistence between separately opened local
  HTML files depends on the browser. Keeping the key cannot guarantee file:// migration.
- Once v4 is written, 0.5.1 cannot read it. Keep the previous file as a reference; do not use it to
  continue a migrated save. Migration is forward-only; no automatic downgrade.
- Legacy schema normalization stays as before; v4 is stricter for click counts, timestamps and
  explicitly present generator counts. Deliberately forged runtime state is not a supported API.
- Inherited limitation found during audit: the manual save button can display success even if
  SaveSystem.save returns false. This release verifies gameplay survives the error; it does not
  claim the toast proves a successful write. Address storage feedback/recovery in a separate
  persistence milestone. Corrupt-save fallback also has no backup/quarantine mechanism yet.
- Multi-tab ownership and offline clock manipulation remain unresolved; no extended soak test.
- New catalogue/effect features require new test cases and, when ownership semantics change,
  an explicit migration. Do not introduce timed effects into this permanent model implicitly.

## 26.3 Next logical action

Have the user validate 0.6 in their browser before introducing more economic systems:
1. Earn 50 cookies, buy Clic renforcé once: balance debited, click reward becomes 2, card Acquise.
2. Buy a cursor: 0.1 CPS; Curseurs efficaces raises its unit rate to 0.2 CPS.
3. Grand-mère recipe doubles only grandma production; Fours bien chauds multiplies combined
   automatic CPS by 1.5. Click reward remains 2.
4. Verify ×1/×10/Max, save/reload, owned labels and effective rates.
5. Verify new game clears upgrades and restores 1 cookie/click and zero CPS.
6. Verify mobile readability/scrolling and Enter/Space on focused buttons.
After validation, prioritize explicit save-error feedback and corrupted-save recovery before
expanding catalogue size or unlock/progression systems.

# 27. Presentation milestone — Foundation 0.6.1

Specification recorded before implementation, 2026-09-27.
Baseline is exclusively Foundation 0.6 / Master v1.8.
User reported browser testing successful (« J'ai testé et tout marche ») and supplied three mobile
screenshots: 73/73 tests, improved click/CPS, generators and acquired upgrades. Record 0.6 as
USER BROWSER VALIDATED; this is not an independent exhaustive test or measured mobile benchmark.

The user explicitly requests visual work now. This authorizes a bounded presentation milestone
before the historical progression/presentation ordering; no economic feature is introduced.

## 27.1 Specification and design

Warm bakery identity: parchment background, cocoa text, caramel accents and deep green cookie
panel. More detailed cookie drawn with self-contained SVG/CSS, no external image/font/network
resources. Desktop uses two columns; mobile stacks a compact hero and shopping sections.
Generator cards retain ×1/×10/Max; upgrades retain all four definitions and purchase rules.
Owned/available/unaffordable states are distinct. Native buttons, keyboard focus, adequate touch
sizes, responsive wrapping and reduced-motion preference are required. No particles, continuous
animation, artificial progression, new content, tab state or save fields.
Diagnostics move from a fixed overlay to a native details panel in document flow. All 73 tests
still execute on startup; failures open the panel and remain visible. The panel never covers
purchases. Summary controls must not be intercepted by the global cookie shortcut.

## 27.2 Boundaries and state

Changes limited to HTML/CSS, GameUI rendering/bindings, and diagnostic presentation.
GameState, HugeNumber, GENERATORS/UPGRADES, Economy, SaveSystem and GameEngine remain byte-for-byte
identical to 0.6. The application time loop is unchanged. Save envelope v4 and storage key remain.
No migration. No economic values copied into CSS or new UI-owned authoritative state.
DOM cards are built once. Refresh updates their labels and state classes without replacing nodes.
One existing UI defect is addressed as part of feedback: manual save notification must reflect
SaveSystem.save's boolean return. Reproduce it with a failing DOM test before patching.
Corrupt-save recovery remains deferred.

## 27.3 Verification plan

Rerun 73 engine tests and 12 existing DOM integration scenarios. Add focused DOM coverage for
diagnostic placement/failure visibility, summary keyboard routing, nested decorative cookie clicks,
card availability/ownership classes, save failure feedback and very large number text.
Check syntax and compare unchanged economic/persistence/engine blocks exactly to 0.6.
Actual browser/layout verification remains required; if blocked, explicitly state that DOM
simulation is not evidence of layout, contrast at runtime or native browser behavior.


## 27.4 Implementation and results

Implemented in Foundation 0.6.1, 2026-09-27.
- Warm cream/chocolate/gold palette; dark green cookie stage; illustrated SVG cookie and icons.
- Responsive two-column desktop / single-column mobile layout; compact purchase controls.
- Owned counts emphasized; improved available/unaffordable/acquired styling; accessible labels.
- Secondary counts under native « Votre parcours »; new game under the header « … » menu.
- Diagnostics in a collapsed footer details element after success, automatically open on failure.
- Global cookie shortcut excludes native summary controls; reduced-motion CSS and focus outlines.
- Manual save failure UI defect reproduced (test expected impossible but got Partie sauvegardée),
  then fixed to branch on SaveSystem.save's existing boolean. No persistence implementation edits.

Verification:
- JavaScript syntax: PASS. CSS top-level parser: PASS.
- Embedded engine/regression suite: **73/73 PASS**, all assertions unchanged from 0.6.
- DOM integration: **19/19 PASS**, including all 12 earlier scenarios plus 7 UI cases.
- Exact source comparisons: GameState, numeric/content/economy/persistence/engine block,
  CookieEmpireApp/time loop and all embedded test definitions identical to 0.6.
- New DOM cases: save failure feedback, diagnostic placement, failure visibility, summary keyboard
  exclusion, SVG child click bubbling/accessible reward label, visual state after purchase/reset,
  and very large balances. These do not assert actual pixels or physical touch behavior.
- Static print-render previews were attempted at mobile/desktop sizes; unsupported form/CSS/SVG
  behavior made the previews unsuitable as browser-layout evidence. They are not deliverables.
- No real-browser validation of 0.6.1 is claimed. Local browser access was denied in this session's
  earlier setup; no attempt was made to circumvent that restriction.

Remaining: real mobile rendering and keyboard/native-details behavior to validate with the user.
Original precision, offline clock, multi-tab, corrupt-save recovery and local-file origin limits
remain. No save migration is needed; 0.6 and 0.6.1 use the same schema and economic content.

Next: user mobile smoke test of the visual update, including menu/reset, scroll, long numbers,
shop controls and save/reload. After validation, resume persistence recovery work before adding
progression or more content. This section is the latest next-action authority.


## 27.5 User validation — 2026-09-27

User report: « Tout marche bien, et c'est lisible ».
Foundation 0.6.1 is now the latest user-validated playable version.
Functionality and readability on the user's device: PASS according to the user.
This supersedes the pending user smoke-test status in section 27.4. Earlier automated results
remain 73/73 core tests and 19/19 DOM scenarios; no new tests were run for this documentation update.
Do not infer exhaustive coverage of desktop, keyboard, all screen sizes or long sessions from
this general confirmation. No game code or save format changed.

Next logical development task: specify and implement safe recovery/preservation of corrupted
saves, retaining a recoverable copy before any fallback/autosave can overwrite the original.
Keep the validated 0.6.1 economy and presentation as the development baseline.

# 28. Protected persistence — Foundation 0.6.2

Specification recorded before implementation, 2026-09-27. Baseline: validated 0.6.1 / Master v1.9.
Regression reproduced: load rejects malformed data, app substitutes a fresh state, autosave then
replaces the malformed original. The 73 existing tests passed but a new preservation test failed.

## 28.1 Decision and responsibilities

Explicit recovery chosen over silent rollback. Persistence alone owns storage, parsing,
validation, write guards, backup/quarantine and recovery decisions. UI presents its status and
routes confirmed actions; app reconnects a successfully restored/reset state and timing.
GameState, Content, HugeNumber, Economy and GameEngine are unchanged. Game save schema remains v4,
legacy v1–v3 migrations retained. Auxiliary quarantine/export envelopes have their own version 1.
No derived CPS/multipliers are saved. The established storage key remains unchanged.

## 28.2 Storage contract

Three scoped keys: main existing key, `${key}.backup`, `${key}.quarantine`.
Backup is the previous validated raw game snapshot, copied before a normal main write. The first
write initializes backup with its validated candidate. Both slots use unchanged game envelope v4
(or a valid legacy snapshot while migrating). Quarantine contains `{version:1,entries:[{sourceKey,raw,capturedAt}]}` with at most TWO entries.
Raw strings are preserved exactly, including malformed JSON or unsupported versions. Never
automatically replace a different protected raw string. If both entries are occupied, keep any
new suspect data in its original slot and refuse destructive recovery until the user explicitly
frees the protected slot. Identical raw strings reuse the existing entry. The two-entry bound
was selected after a failing test demonstrated that one entry cannot preserve two damaged slots. Export includes main, backup and
quarantine raw strings in a versioned JSON bundle. Export is not repair/import and does not erase.
Freeing quarantine is a separate confirmed user action; it never removes main/backup.

## 28.3 Loading and writes

Distinguish missing, valid, rejected and unreadable storage. Rejected primary or orphaned backup
enters recovery; no autosave/manual save may replace it. A fresh in-memory state can remain playable,
with a persistent unsaved/recovery notice. Read denial blocks writes until explicit retry/load.
Archive rejected raw data when possible; quota/read/write failures never authorize overwriting.
Valid backup availability is shown, but restoration only occurs on explicit user confirmation.
No backup is reconstructed from a rejected state and no corrupted economic values are guessed.

Normal save validates serialized candidate, protects any invalid stored slot before replacement,
writes/verifies backup before main, then updates in-memory lastSavedAt only after success. Save
returns boolean and preserves error status. Check observed main string against the previously
loaded/written string to detect intervening edits. This is a guard, NOT atomic multi-tab locking.
A newly instantiated saver inspects existing storage before its first write.

Restore revalidates current backup and checks that main has not changed since observation;
archive rejected main before replacement, write/verify restored raw without replacing backup.
App then applies the existing capped offline rules once and checkpoints the result. All derived
values are reconstructed. A failed restore leaves the current engine untouched.

New game remains confirmed. Validate/persist fresh state before replacing the in-memory engine;
reject reset if reading/archiving/writing fails. Deliberate new game initializes both save slots
with fresh state, so a later recovery does not normally resurrect the discarded game. Quarantine
survives reset. Unlike 0.6.1, a failed persistent reset does NOT reset only memory; update that
one old DOM expectation explicitly. There is no multi-key localStorage transaction; interrupted
new-game writes may leave different valid slots, and primary always takes precedence on load.

## 28.4 UI and tests

Persistent inline recovery/status panel, no recurring modal on autosave. Confirm restore, new game,
retry/reload (may replace unsaved memory progress), and freeing a protected copy. Export uses a
Blob/download with caught failures and does not claim file download completed from click alone.
Normal gameplay presentation unchanged. Failed storage must not stop clicking/production.

Required: original regression suite; write-after-corrupt-load; valid/invalid/missing backup;
malformed/empty/future schema; occupied quarantine; quota failure at archive/backup/main;
unreadable storage; timestamp commit; invalid candidate; changed main; restore/reload/offline;
reset isolation; export exact strings; release-archive isolation; UI confirmations/cancel;
autosave continuing to refuse across repeated ticks. Real-browser verification remains required;
existing environment restrictions are not to be circumvented and simulated DOM is labelled as such.


## 28.5 Audit changes and test results — 2026-09-27

Implemented, statically verified, automatically tested. Actual browser validation of 0.6.2 is
pending; the last user-validated build remains 0.6.1 until the user confirms this candidate.

Three red/green reproductions were completed:
1. Baseline rejected load followed by save overwrote the corrupt string. New mode guard preserves it.
2. Single-entry quarantine deadlocked new-game recovery when both slots were corrupt. Changed the
   not-yet-released quarantine v1 design to at most two immutable entries; both originals fit.
3. Failed new-game main write could replace the healthy backup with fresh data. Add a best-effort
   rollback of backup on caught failure. When main is unusable/missing, protect the former backup
   as well before reset. Its exact raw data survives even if rollback is subsequently unavailable.

Results:
- JavaScript syntax: PASS (`node --check`).
- Embedded core + persistence suite: **102/102 PASS**, including all 73 previous test cases.
- DOM integration: **29/29 PASS** (19 previous scenarios + 10 recovery scenarios).
- Deliberate change to one prior expectation: reset during inaccessible storage leaves memory
  intact instead of clearing memory only. The diagnostic counter assertion now follows suite size.
- Exact code comparison: GameState, HugeNumber, Content, Economy and GameEngine unchanged.
- All recovery storage fault tests use injected memory storage or isolated synthetic DOM origins;
  no user's actual save was corrupted for testing.

Coverage includes missing/empty/corrupt/future envelopes, prior and orphaned backups, explicit
restore/reset/retry/cancel, quarantine capacity/duplicate/bad metadata, quota at three write stages,
read denial, detected changed main, invalid candidate, write verification, failed reset rollback,
scoped cleanup, timestamp commit, raw export integrity, failed download initiation, offline after
restore, persistent UI notices and repeated autosaves/reloads while recovery is pending.

## 28.6 Remaining limits and next action

- No automatic repair of malformed state and no import of an exported recovery bundle yet. Export
  preserves evidence and valid snapshots for later controlled recovery; it is not an external backup
  until the user actually saves the download. Blob/download completion was NOT browser-verified.
- Backup is one preceding successful snapshot (about one autosave interval), not version history.
  Upgrading cannot reconstruct a missing pre-existing backup. No prior valid copy means no restore.
- Two protected entries bound storage growth. When full, user must export and explicitly choose
  whether to free them; never auto-delete protected data. Unknown quarantine formats are retained.
- localStorage has no multi-key transaction. Caught reset failures attempt rollback; abrupt process
  termination may leave different valid slots. Primary has priority. Browser data deletion, device
  loss or storage failing everywhere cannot be solved by copies in the same localStorage.
- Main raw comparison detects some competing changes, not simultaneous multi-tab write races.
- Automatic/manual writes are paused on recovery/read failure/conflict. Gameplay can remain in
  memory; the persistent panel says this progress is temporary. Restoring/reloading/new-game choices
  may replace that temporary progress and therefore require explicit confirmation in the UI.
- Existing local-file origin, offline-clock and HugeNumber precision limitations remain.
- No actual browser test performed: local-browser access was denied in the prior setup. No
  workaround attempted, no browser success claimed. DOM tests are explicitly simulations.

Next: user browser smoke test (normal save/reload, menu export, reset confirmation and 102/102
startup diagnostic). Do not ask the user to corrupt their real save. Recovery fault behavior is
covered automatically; further browser failure testing should use a disposable isolated test key.
After browser validation, specify controlled import of a validated exported snapshot, preserving
current data before replacement. This would make exports useful across file origins/devices.


## 28.7 User validation — 2026-09-27

User report: « Tout est bon mais revérifie et regarde si tu peux encore consolider le code ».
Foundation 0.6.2 is the latest user-validated playable baseline. This supersedes section 28.5's
pending status. This general confirmation does not certify every injected storage failure case.
The user now requests another audit/hardening pass; controlled import remains deferred.

# 29. Reset failure hardening — Foundation 0.6.3

Specification recorded BEFORE implementation, 2026-09-27.
Baseline exclusively validated 0.6.2 and Master v2.0, read in full. Existing automated baseline:
102/102 embedded tests and 29/29 simulated DOM scenarios pass again.

## 29.1 Reproduced findings

Seven targeted core tests added to an unmodified 0.6.2 source fixture: six fail, one passes.
- Backup setItem can succeed and its verification read fail. The old flag is set after verification,
  so rollback is skipped, leaving fresh data where a previous backup existed (or creating a new slot).
- An unconditional rollback can overwrite a backup changed by another writer during the failure.
- A failed reset may have written its main candidate before verification failed. The old saver
  stays ready, and the message "Nouvelle partie non créée" overstates what is known about storage.
- Failed or silently ignored rollback removal is not verified and does not suspend later writes.
- Invalid candidate rejection before writing already leaves storage untouched (control test).

## 29.2 Contract and design

Scope: SaveSystem.newGame, its mutation guards/status, truthful reset feedback, regression tests.
Preserve all economic rules, Content, GameState, HugeNumber, time, purchase paths and visual layout.
Game envelope stays v4; backup uses the same envelope; quarantine/export stay v1. No migration.
No new authoritative fields or persisted derived values. Runtime persistence mode is not saved.

Mark the backup write as attempted BEFORE calling verifyWrite. On caught failure, attempt rollback
only if the currently observed backup still equals this reset's candidate raw string. Restore the
previous exact raw string, or remove and verify absence if no slot existed. If another raw string
is observed, preserve it. If reads/writes fail, do not force a destructive rollback.
This comparison narrows a race; it is not an atomic compare-and-swap or multi-tab ownership protocol.

Once a reset has attempted its first save-slot write, any caught failure transitions to a new
runtime 'uncertain' mode. Autosave, reset and restore refuse further mutations until explicit load
re-reads storage. Keep the current in-memory engine. Present a persistent "creation not confirmed;
re-read data" status. Do not claim that the main write never happened, nor that rollback necessarily
succeeded. A successful explicit load resumes the existing valid/missing/recovery handling.
Pre-write validation/archive failures retain their established mode and protection behavior.

Archive protection before resetting unusable main data remains unchanged. Normal successful reset
still writes both slots, commits the timestamp and reconnects a fresh engine. Normal save behavior
and legacy migrations are unchanged. No new permission prompt beyond existing UI confirmations.

## 29.3 Tests and audit plan

Seven added core cases cover transient backup verification failure with/without an old backup,
changed backup during rollback, uncertain main write and explicit retry, unreadable rollback with
protected originals, invalid candidate before writes, and silently ignored rollback removal.
DOM cases must reproduce a main write with failed readback: old memory remains playable, message
is truthful, repeated simulated frames cannot write, and explicit retry reconnects persisted state.
Also check the recovery panel and explicit retry after a caught reset failure with successful rollback.
Retain all 102 existing assertions and 29 existing DOM scenarios. Check syntax and exact unchanged
foundation blocks. Real browser automation remains blocked by the previously recorded environment
restriction; do not bypass it or present jsdom as browser validation. User smoke test of the new
candidate is still required. Abrupt termination and simultaneous multi-tab writes remain limitations.

## 29.4 Implementation, audit and results — 2026-09-27

Implemented after the specification and failing tests. Rollback now starts after any attempted
backup write, compares the current backup against its candidate before acting, and verifies removal.
Caught failures after that attempt enter 'uncertain'; save/newGame/restore are blocked until load.
The app retains its current engine and uses truthful "Création non confirmée" feedback.

Results:
- JavaScript syntax (`node --check`): PASS.
- Core: **109/109 PASS**, including all 102 prior tests unchanged and seven new cases.
- DOM simulation (jsdom 30.1.1): **31/31 PASS**, all 29 prior scenarios unchanged plus two new cases.
- Before repair: six of seven new core cases and both new DOM cases failed against 0.6.2.
- Exact source comparisons: GameState, HugeNumber, Content, Economy, GameEngine, GameUI and the
  simulation/start loop unchanged. HTML/CSS unchanged except two release labels. Original test
  definitions unchanged. Only persistence reset/guards/status and the app's reset failure message
  changed outside new tests and version labels.
- Tests inject failures in memory storage and synthetic jsdom origins, never in a user's save.
- No real-browser automation performed, no new screenshot/layout validation claimed. Version 0.6.2
  remains the latest user-validated build; 0.6.3 is an automatically tested candidate.

## 29.5 Limits and next action

A caught storage exception does not prove an earlier write never happened. A rollback is best-effort:
if a read fails, the candidate may remain; if another raw value is observed, preserve it. Explicit
reload resolves the persisted state and may replace unsaved memory progress, under the existing UI
confirmation. A fully successful reset behaves as before. Auxiliary protected data is retained.

No atomic multi-key transaction, complete multi-tab coordination, or crash-proof reset is claimed.
The conditional rollback narrows one race but cannot exclude a change between its read and write.
All earlier local-file origin, offline-clock, numerical precision and bounded-archive limits remain.
No controlled import, additional content, balance change or persistence schema migration was added.

Next: user smoke validation of normal play, save/reload, cancelling/confirming new game and the
109/109 diagnostic. Do not deliberately damage a real save. After this candidate is validated,
resume the previously specified next priority: designing controlled import of valid snapshots.
This section supersedes earlier next-action statements.


# 30. Controlled snapshot import — Foundation 0.6.4

Specification recorded BEFORE implementation, 2026-09-27. User: « Je te fais confiance continue ».
This authorizes the next bounded persistence milestone. It does not assert a new browser test.
Development continues from the latest delivered 0.6.3 / Master v2.1, without reverting its fixes.
The latest explicit user browser validation remains 0.6.2. Baseline rerun: 109 core / 31 DOM pass.
This section supersedes the earlier next-action ordering, while preserving honest candidate status.

## 30.1 Scope, architecture and formats

Accept only a Cookie Empire recovery export `{format:'cookie-empire-recovery',version:1,...}`.
The envelope must have a safe non-negative exportedAt and primary/backup/quarantine fields, each
string or null. Refuse unsupported format/version, malformed JSON and files over 1 MiB; also bound
input text to 1,048,576 code units before parsing. An empty valid envelope has no importable state.
Do not execute file content, infer ownership, merge balances, import HTML or auto-repair state.

SaveSystem owns pure inspection, snapshot validation and commit protection. GameUI owns native
file reading, preview/selection/confirmation and status. App prepares a detached engine for offline
credit and connects it only after a verified commit. Content, GameState, HugeNumber, Economy,
GameEngine and the existing time loop remain unchanged. No new authoritative or derived save fields.
Game schema v4, migrations v1–v3, export/quarantine v1 and storage keys remain unchanged.

Inspect primary, backup and up to two entries from a well-shaped quarantine v1. Show each distinct
valid raw snapshot in source order with a fixed source label; never use imported labels as HTML.
Invalid slots are omitted with a visible notice. An invalid quarantine does not invalidate a valid
primary/backup. Imported quarantine is NEVER copied over local quarantine. No recursive bundles.
Older game versions pass existing decode/migration and a v4 encode/decode round-trip at their own
saved timestamp. Imported normalized numbers must have finite canonical mantissas and integral
finite exponents. Legacy negative/unsafe timestamps or unsafe click counts cannot become a v4 save.
These import-boundary checks do not alter established on-disk load behavior or number arithmetic.

## 30.2 User flow and source of truth

Menu action “Importer une partie” opens an inline panel with labelled file input. Reading a file
only previews: source, cookies, reconstructed CPS/click reward, upgrade count and saved date.
The user chooses a valid snapshot and confirms replacement. Cancellation changes neither state nor
storage through the import path. Normal gameplay/autosave may continue while preview is open.
A closed or superseded file read must never replace the current preview (request generation guard).
A failed read clears stale choices. Re-selecting the same file is supported. Focus stays usable.

At confirmation, decode the chosen RAW snapshot again; never trust a mutable preview state.
App computes offline gain on this detached state using the existing 30-day cap, then commits at
current wall time. Replacement, not addition to the current balance. Re-importing the same source
replaces the same snapshot again; no stacking onto the current game. Future accepted timestamps
produce zero offline gain. No derived CPS/reward/multipliers persisted; Economy reconstructs them.

## 30.3 Protection and commit design

Allow commit in ready/recovery modes after current-main guard; refuse unavailable/conflict/uncertain
until explicit re-read. Validate the prepared imported state AND the current in-memory state first.
Preserve a v4 snapshot of current in-memory progression in existing bounded quarantine, including
unsaved clicks. Also protect the exact current main raw if it is rejected. A valid older primary
need not be archived byte-for-byte: the current in-memory snapshot is the authoritative progression.
Do not touch the backup slot during import. Existing quarantine entries stay immutable. Refuse
replacement if archive is unreadable, full or unwritable. A partial archive append is safe and may
remain after an aborted attempt. Never clear it automatically to make an import succeed.

Recheck main before writing. Write/verify main only; update expectedRaw and lastSavedAt after success.
If the main write was attempted but not confirmed, set existing uncertain mode, show generic
“Écriture non confirmée”, keep the current engine, suspend further game writes until explicit load.
The import does not promise a multi-key transaction or an atomic cross-tab lock. Existing main
comparison and immutable copies reduce loss, but cannot make browser storage crash-proof.

Normal autosave resumes after success and may rotate the ordinary backup. The pre-import game
remains protected in quarantine until explicitly freed; export it and select its protected snapshot
to recover it. If all protected slots are occupied, export before using the existing explicit release
control. An invalid pre-existing backup is not overwritten by import; if later autosave cannot archive
it because quarantine is full, autosave must fail visibly rather than discard it.

## 30.4 Regression and verification plan

Test export round-trip, all source slots, duplicate raws, legacy migration, missing/invalid fields,
future schema, huge/fractional values, invalid normalized numbers, unknown/duplicate upgrades,
size limits and no valid snapshot. Inspection must perform zero storage writes.
Test protection of live memory, corrupted main, bounded/full/bad archive, failures before/after main
write, changed main, blocked modes, invalid current state, scoped keys and untouched backup.
DOM: actual FileReader in jsdom, preview without import, selected backup/archive, cancelled confirm,
bad/oversize file, failed read, stale asynchronous read, successful replacement and offline checkpoint,
repeated import, reload with derived values, failed commit preserving connected engine, keyboard
exclusion for new controls. Existing 109 core / 31 DOM assertions remain unchanged.
Real browser/mobile file selection and download completion still require user validation; the existing
browser policy block is not bypassed. DOM simulation is never labelled real-browser testing.

## 30.5 Audit adjustment specified before repair

A new failing DOM test reproduces the full-archive recovery panel disappearing after the next
successful ordinary autosave, making its release controls inaccessible while import remains open.
Add export and confirmed release controls directly to an import-panel details section, and retain
the import failure explanation there. Reuse the same UI release handler and Persistence methods;
no automatic deletion, new key, or change to archive ownership. Do not rely on the transient recovery
panel to resolve a blocked import. Test export, cancelled release, confirmed release and retry.

## 30.6 Final implementation and results — 2026-09-27

Implemented the specified inspect/choose/confirm flow. GameUI uses FileReader with bounded files
and a read-generation guard; preview text uses textContent. SaveSystem validates external snapshots,
protects live progression, rechecks the main and verifies its write. App applies capped offline gain
on a detached state, checkpoints it and only then reconnects the live engine. Import adds no network
requests or external runtime dependency. Export, local schema and existing loading rules stay intact.

Verification:
- Syntax: PASS (`node --check`, Node 24.19.0).
- Embedded core/regression suite: **131/131 PASS** (all 109 prior tests unchanged + 22 import cases).
- jsdom 30.1.1 integration: **46/46 PASS** (all 31 prior scenarios unchanged + 15 import/audit cases).
- Audit red/green: new full-archive management test failed before the UI repair, then passed.
  The pre-repair fixture and result are packaged for reproduction; it is not a playable delivery.
- Exact source audit: GameState, HugeNumber, Content, Economy, GameEngine, start/time loop and prior
  test definitions unchanged. Prior SaveSystem methods unchanged except generic uncertain wording.
- Existing release confirmation behavior is shared by both entry points. No automatic archive
  clearing, backup overwrite by import, economic mutation during preview or persisted derived data.
- Browser-native picker/download/mobile rendering not independently verified. No attempt to bypass
  the recorded browser restriction. 0.6.4 remains a candidate; user trust was not recorded as an
  explicit browser smoke test of 0.6.3 or 0.6.4.

Coverage includes export parsing, four candidate sources, duplication, unsupported/corrupt envelopes,
1 MiB limit, partial valid exports, legacy migrations, unsafe inherited fields, canonical numeric
checks, huge values, ownership consistency, unsaved-memory protection, corrupt main preservation,
archive saturation/denial, main read/write faults, changed main, blocked modes, and scoped storage.
DOM coverage includes native jsdom FileReader, confirmation/cancel, stable source selection,
non-executable text, asynchronous stale results, failed reads, current progress during preview,
30-day offline cap, checkpoint/reload, repeated import without accumulation, continued clicking after
failure, archive management after autosave and keyboard shortcut isolation.

## 30.7 Limits and next action

Only recovery export v1 is accepted, with valid embedded game snapshots v1–v4. Raw save JSON, HTML,
unknown versions, oversized bundles and irreparable snapshots are rejected. No automatic repair.
Snapshot validation for import is stricter than historical loading; this avoids accepting a legacy
state that cannot be re-saved as valid v4. Two protected slots intentionally bound archive size.

The ordinary backup is untouched during import and may rotate on the next successful normal save.
The protected current-memory snapshot is what guarantees a retained pre-import game while quarantine
is kept. It is not an external backup until exported/downloaded. A valid stale primary is not archived
byte-for-byte; a rejected primary is. Partial protective appends may remain after a refused import.
If corrupted backup preservation later exceeds archive capacity, normal save refuses and shows its
error rather than overwriting the corrupt raw. Export/free decisions remain explicit.

No guarantees added for cross-tab simultaneous writes, abrupt browser termination, deletion of browser
data, changing system clock or ~15-digit mantissa precision. Cross-device transfer requires the user
to actually download/copy the JSON and open it in the new game's file picker.

Next: validate real-device export from the previous playable version, import preview and cancel,
then confirmed transfer into 0.6.4, save/reload and 131/131 diagnostics. Prefer a separate browser origin
or expendable game for the transfer check; never request corrupting real progress. After confirmation,
review the next gameplay milestone with the now-portable saves as a stable base. Do not add a large
catalogue, XP or prestige without their own specification and economic tests.


# 31. Visible workshop milestones — Foundation 0.7

Specification recorded BEFORE implementation, 2026-09-27. User again authorizes continuation.
Baseline: latest delivered 0.6.4 and Master v2.2 read in full, no earlier source reused. Automated
baseline rerun passes 131 core tests and 46 simulated DOM scenarios. This is a bounded next milestone,
not a claim that 0.6.3/0.6.4 have received explicit browser validation. The latest such report is 0.6.2.

## 31.1 Architecture readiness and scope

Production, ownership and purchase consistency are already tested. Existing totalProduced,
generators and ownedUpgrades are sufficient for read-only objectives. A pure Progression rules module
can derive progress without modifying Economy, engine transactions, time or persistence. UI already
refreshes on clicks, purchases, offline/start and state replacement, plus the throttled frame loop.
This is sufficient for an eight-step progress guide. No reward transactions or saved achievement
ownership are necessary for this scope. XP, prestige, unlock gates, extra generators and timed quests
remain outside this release. The existing economy remains the reference while progression is proven.

## 31.2 Content and derivation

Immutable MILESTONES owns ordered definitions: stable id, title, description, metric, target string
and generatorId only for generator metrics. Supported metrics: totalProduced, generator, upgrades.
Validate once: unique non-empty ids, text labels, known metrics/generator ids, positive canonical
HugeNumber targets; count targets must be safe positive integers and upgrade target cannot exceed
current catalogue size. Immutable PROGRESSION_RANKS defines cosmetic titles at completed-count gates.

Eight independent objectives, in recommendation order:
1. first_batch: totalProduced >= 25 — Première fournée.
2. first_cursor: cursor ownership >= 1 — Un coup de main.
3. first_grandma: grandma ownership >= 1 — Une recette de famille.
4. first_upgrade: owned upgrade count >= 1 — Le goût du progrès.
5. cursor_team: cursor ownership >= 10 — Une équipe au travail.
6. thousand_cookies: totalProduced >= 1000 — Mille douceurs.
7. recipe_book: owned upgrade count >= 4 — Le carnet de recettes.
8. ten_thousand_cookies: totalProduced >= 10000 — Un empire en devenir.

Evaluate every objective independently; an objective may be complete before earlier ones. The first
incomplete objective in content order is the suggested next step. All purchases stay available under
the existing affordability/uniqueness rules. No bonus, click/CPS multiplier, price change or payment
for claiming a milestone. Cosmetic ranks at 0/2/4/6/8 complete objectives: Les débuts gourmands,
Petit atelier, Boulangerie en essor, Fabrique reconnue, Empire en devenir.

GameState has NO new fields. Authoritative sources are existing state.totalProduced (NOT current
spendable cookies), state.generators[id] and state.ownedUpgrades. Progression.derive returns fresh
rows with current/target HugeNumbers, done, display progress, total completed, cosmetic rank and next.
It never mutates state/content and never trusts persisted objective/rank/CPS caches.

Completion uses HugeNumber.compare(current,target) >= 0. Clamp displayed progress to target. Percent
is presentation-only, 0..100: return 100 only when truly complete; while incomplete clamp floored
ratio*100 to at most 99. Avoid converting huge absolute totals to Number. Fractional production is
allowed and must not complete an objective early; no economic value is rounded for these rules.

## 31.3 Persistence and lifecycle

Game save remains v4; export/quarantine remain v1; no migration or additional persisted fields.
Existing v1–v3 migrations run as before, then the UI derives goals from the migrated sources. Existing
v4 saves automatically show earned steps. Save/reload, restore/import and offline production all
recompute the guide. Reset starts at zero. Spending cookies never loses a production milestone.

These are state-derived objectives, not an independent permanent achievement history. Current counts
and totalProduced are non-decreasing during ordinary play; importing/restoring an older game or reset
can reduce completed goals. A future selling mechanic or changed thresholds must revisit this contract
before claiming permanence. Content edits can change derived cosmetic progress and must be explicit.

## 31.4 UI design

Compact “Votre empire” card at the top of the shopping column, above generators. Show cosmetic rank,
completed count, one next objective with readable progress and native progress element. A native
“Voir les 8 étapes” details section exposes all goals with text statuses, not color alone. At full
completion show a clear terminal message and no invented future reward/unlock. Existing bakery
palette, responsive layout and controls retained. No external resources or continuous animation.

Build rows once and update them without replacing nodes or collapsing details. Recompute only during
existing render calls. Announce newly completed objectives once via a separate polite live region;
do not replace storage/error feedback or announce old achievements on startup/load/import/reset.
A previous-state reference and completed-id set may live in UI solely for announcement deduplication;
they are not authoritative progression and are never saved. Percent updates must not spam live regions.

## 31.5 Cases and verification plan

Core: empty state, below/exact/above thresholds, fractional and huge totals, independent order,
generator/upgrade ownership and buying in bulk, spending without losing milestones, offline credit,
rank/next/all-done behavior, repeated derivation purity, content immutability/invalid definitions,
save roundtrip and no derived fields, ignored forged objective fields, legacy migration, reset.
DOM: visible fresh guide, clicks updating next goal, generator/upgrade purchases updating rows,
stable nodes/open details, one-time completion announcements, no interference with save-error text,
existing save/import/reset/restore refreshing goals, all-complete and huge values, keyboard summary
handling and accessible progress attributes. Rerun original 131/46 cases unchanged and audit exact
preservation of numeric/economic/engine/persistence/application code. Any discovered bug follows the
red/green regression rule. Browser rendering remains unverified under the recorded environment block;
no alternate access workaround and no simulated DOM described as real browser validation.

## 31.6 Implementation, tests and audit — 2026-09-27

Implemented eight immutable definitions and five cosmetic rank titles, startup content validation,
pure Progression derivation, and an inline guide with a stable expandable checklist. Native progress
and text statuses accompany the visual styles. Completion announcements use a separate polite live
region, update only for newly completed goals, and reset quietly when the state reference changes.
No purchase handler, engine transaction, multiplier, clock, persistence path or imported data changed.

Two defects were reproduced by failing tests before correction:
1. A generator target passed as ['cursor'] was accepted through property-key coercion. Require a
   string generatorId before checking Content ownership. The invalid-definition test now passes.
2. At full completion the top label still said “Votre prochaine étape”. Render “Parcours accompli”
   in the terminal state; the complete-path DOM test now passes.
Both pre-fix fixtures and their failing results are preserved in the validation package.

Results:
- JavaScript syntax: PASS (Node 24.19.0).
- Embedded core/regression: **146/146 PASS** (131 prior tests unchanged + 15 progression cases).
- jsdom 30.1.1 integration: **58/58 PASS** (46 prior scenarios unchanged + 12 progression scenarios).
- Exact source comparison: existing GameState, HugeNumber, generator/upgrade Content, Economy,
  SaveSystem, GameEngine and application/time code unchanged. Existing UI code is unchanged after
  removing the new builder/renderer and their two call sites. Previous CSS is preserved verbatim.
- Core tests cover exact/fractional/huge thresholds, percentage bounds, independent ordering,
  ownership, bulk buying, spending, offline credit, ranks/end state, pure derivation, invalid Content,
  immutable definitions, schema preservation, forged derived fields, migration and reset.
- DOM tests cover fresh/advanced games, clicks/purchases, stable details and focus, deduplicated
  announcements, save error coexistence, save/reload, reset, import of older and advanced states,
  recovery/offline, simulated active production, huge-value terminal state and keyboard exclusion.
- All faults and snapshots are synthetic. No user save was modified for testing.
- No actual browser rendering/native screen-reader validation claimed. The previously recorded
  environment access block is not bypassed. Latest explicit user browser validation remains 0.6.2;
  0.7 and its recent precursor candidates remain pending real-device confirmation.

## 31.7 Limits and next step

This first progression layer guides the existing workshop and grants cosmetic titles only. It does
not introduce rewards, locked purchases, achievement history, new production sources or balancing
changes. Completing the guide does not end the game; automatic production and all purchases continue.
Objectives follow the currently loaded game. Reset or an older import/restore can reduce the guide.
Changes to thresholds or a future selling mechanic must revisit this state-derived contract.

Previously documented storage, multi-tab, offline-clock, number precision and local-file origin
limitations remain. New content validation checks the built-in definitions; it is not a mod loader.
No new runtime dependency, remote font or image was added. Native progress/details controls and
responsive CSS still need real-device visual/accessibility validation.

Next: user check of the guide on mobile, expansion/collapse, first 25 cookies and cursor purchase,
existing save/import continuity and 146/146 startup diagnostics. Continue from this latest release;
do not discard the import or reset protections. Before extending gameplay further, specify a small
balanced generator/upgrade expansion with explicit costs, production and regression scenarios.
No large catalogue, XP or prestige should be added without separate design and verification.
This section is the latest next-action authority.

# 32. Bounded content and purchase clarity — Foundation 0.7.1

Specification recorded before implementation on 2026-09-27. Base: Foundation 0.7 and Master v2.3. Browser verification of 0.7 is still pending; this release is a candidate and must not be called browser validated.

## 32.1 Content and economy

Add one generator, `oven` (« Four artisanal »): initial cost 1 100 cookies, growth factor 1.15 per owned unit, base production 8 cookies/s per unit. These values extend the current two-generator curve without altering previous prices or production. It uses the generic generator buying, derived CPS and immutable Content table. No additional upgrade or progression threshold is introduced. The existing eight steps and four-upgrade « carnet de recettes » stay exactly as defined in section 31.

The authoritative oven count lives at `state.generators.oven` as a non-negative safe integer. CPS is derived. New games initialize it at zero. Older v1–v4 saves and external imports without this key initialize it at zero; invalid present counts are rejected. Save schema remains v4 with no new kind of field and no migration version bump. Reset and offline production use existing paths.

## 32.2 User interface

Add the oven to the existing generator list and use the established icon fallback. For every generator display the full ×10 batch cost directly on its button. The price is derived by Economy and is never an independent state value. Disabled state and shown batch price must use the same computed cost. Avoid changing buttons or recreating the cards on frame renders.

## 32.3 Save cadence

Current loop refreshes UI and writes localStorage every 0.25 simulated seconds, up to four times per second. Keep the 0.25-second UI cadence and separate autosave to an approximately 5-second in-session interval. Manual save remains intact. Save on `pagehide` and when the document becomes hidden even if the simulation accumulator is zero: an input may have occurred since the previous frame. These are best-effort browser lifecycle hooks. Use elapsed in-session time for the accumulators; do not add persistent timer state. On large stalls continue clamping frame delta as before. A failed save remains handled by Persistence and does not stop gameplay. The tradeoff is up to roughly five seconds of unsaved in-session progress after an abrupt termination where lifecycle events do not run, plus the pre-existing localStorage limitations.

## 32.4 Verification gates

Rerun all 146 existing embedded tests, add tests for oven cost, ×1/×10/Max, derived and offline production, old-save default, present invalid count and save/load. Check loop cadence and the ×10 displayed cost with a focused interface integration test if a DOM harness is available. Check syntax, inspect the HTML, and report browser testing separately. If DOM/browser verification cannot run, leave it pending and do not claim the UI change stable.

## 32.5 Implementation and verification — 2026-09-27

The 0.7.1 candidate adds the oven through immutable Content and the established generic engine/UI. The existing four upgrades and eight progression steps are preserved. The ×10 price is computed once per render and shared by button text, accessible label and enabled state. Existing cards stay mounted while values update. The loop keeps 0.25 s rendering and saves at about 5 s of active simulated time. Current progress is also saved on pagehide/hidden as a best-effort operation; a failed save remains the Persistence system's responsibility.

The five initial oven core tests were observed failing against 0.7 before the content change; the lifecycle integration assertion also failed before its handler was added. Then all tests passed. One additional import compatibility case was added during audit. A further DOM regression reproduced loss of a click just before pagehide when the time accumulator was zero; the lifecycle handler now saves regardless of that accumulator. Node syntax checks passed. Core/regression: **152/152** (146 original + six oven cases). A deterministic loop test observed 20 renders and one autosave across 5 s of simulated frames. Focused jsdom integration: **23/23** assertions across startup diagnostics, rendered cards, visible batch cost and accessible label, exact-cost single purchase, batch purchase, derived CPS, compatibility of an old v4 save, unchanged progression, keyboard shortcut isolation, pagehide checkpoint including a click before the next frame, failed save retry and hidden-tab checkpoint. The earlier 58 DOM scenarios from the 0.7 report were not available as a standalone script to rerun; their covered subsystems retain the original 146 embedded regression tests, and this release does not claim to rerun those 58. No actual mobile browser or native screen reader was used.

Risk: an abrupt termination without pagehide/visibilitychange can lose approximately five seconds of recent progress. The prior multi-tab, storage, clock and precision limitations still apply. A direct attempt to open the local HTML file in the available cloud browser was rejected by its security policy because `file:` URLs are blocked; no indirect route or bypass was attempted. Therefore the browser gate remains open despite the passing jsdom integration. Any long gameplay expansion requires separate balancing and save tests. Next: real browser/mobile inspection of the 0.7.1 layout, batch price wrapping, buying an oven and reloading a saved game; then choose a small progression or balancing milestone based on the observation. This section is the current next-action authority.

# 33. Generator-to-click synergy — Foundation 0.8

Specification recorded before implementation on 2026-09-27. Baseline: Foundation 0.7.1 and Master v2.4. User explicitly reports « Tout marche bien » for the delivered game and requests that the new content strengthen clicking according to purchased generators. Record 0.7.1 as user browser validated in ordinary play; this does not certify every edge case or desktop screen size. This section supersedes section 25's old rule that generator ownership does not change clicks.

## 33.1 Rule and balance

For each generator type, every owned unit adds its **base production per second** to the unmultiplied click reward. Example: one cursor adds 0.1 cookie/click, one grandma adds 1, and one artisanal oven adds 8. The new click reward is:

`(base clickPower + Σ (owned[id] × GENERATORS[id].baseCps)) × click multiplier`.

The existing reinforced-click upgrade applies to the complete reward once. Generator-specific CPS upgrades and the global CPS upgrade do not change this click contribution: they continue to affect automatic production only. Buying a generator raises CPS and click reward in the same atomic purchase; upgrading CPS alone must not change click reward. A click credits both cookies and totalProduced by the newly derived reward. Negative, fractional or unsafe generator counts remain invalid under existing validation.

This rule gives one click roughly one second of **unboosted** workshop production plus the existing base reward, so manual clicking remains meaningful as the workshop grows without duplicating balance rules or saved values. It is intentionally a first balance pass, not a commitment to final pacing. Both click and CPS use HugeNumber; differences in mantissa precision at enormous scales retain the documented limitations.

## 33.2 Source of truth and compatibility

Generator definitions already own `baseCps`; do not add a separate click-bonus field with the same numbers. Authoritative fields remain base clickPower, generator counts and owned upgrade IDs. `state.clickReward` remains a derived runtime cache. Existing v1–v4 saves, exported snapshots, backup and quarantine formats remain unchanged. On load/import/restore, click reward is recomputed from current ownership. Old saves gain the newly defined click benefit immediately; this is a deliberate balance change, not a schema migration. No bonus is awarded for generated cookies, only for click actions.

## 33.3 Presentation and regression

Explain the rule in a short hero hint and on generator cards using a per-unit click contribution, while keeping effective CPS distinct. Existing cards remain mounted; labels use Economy formatting. Keep touch targets and ×1/×10/Max behavior. Tests must cover empty state, each generator, mixed/large ownership, repeated recalculation, click upgrade, CPS-only upgrades, atomic purchases, offline production, huge numbers, old save loading/import, reset and actual button click in simulated DOM. Update historical test expectations only when the old assertion explicitly encoded the superseded click formula; preserve their other economic/storage checks. Rerun all prior tests and report real-browser verification separately.

## 33.4 Implementation and verification — 2026-09-27

Implemented in Economy as `deriveGeneratorClickBonus` and included once in `deriveValues`. This reads immutable baseCps values and authoritative counts; it never writes an additional saved field. Click and CPS upgrades remain in their respective domains. The UI shows each generator's click contribution as an additional line and explains the rule beneath the large cookie. Existing generator cards and handlers are preserved; only their content changes. The app still uses save envelope v4 and key `cookie-empire-foundation-v2`.

Five focused tests were observed failing against the 0.7.1 formula, then passing after the economy change. Eleven historical expectations which explicitly encoded the old click formula were updated; their unrelated CPS, cost, migration, backup and import assertions remain. Final automated result: **157/157 core**. Focused jsdom integration: **28/28** assertions, including cards, actual purchases ×1/×10, displayed click value and a DOM click credit. A deterministic simulated loop still performs 20 renders and one autosave in 5 s. Node syntax check and clean `npm ci`/`npm test` pass. The prior 58 DOM scenarios from 0.7 remain unavailable as an independently executable suite; do not report them as rerun. No real browser test of 0.8 is claimed. User validation applies to the preceding 0.7.1 version, not automatically to this one.

The formula is deliberately stronger than the old click curve and can make repeated manual clicking a large part of production. It does not change passive CPS, generator prices, offline gain, ownership or milestones. Existing saves gain the new formula upon loading; players should be told this is a balance change. Next: mobile browser smoke test of visible per-click gains (cursor, grandma, oven), click multiplier, save/reload and diagnostics **157/157**. Consider balancing the click/CPS relationship only after observing this version in ordinary play. This section is the current next-action authority.

# 34. Galactic night theme and cocoa mine — Foundation 0.9

Specification and implementation recorded 2026-09-27. Baseline is Foundation 0.8 and Master v2.5; the player reports ordinary play works and requests a dark blue and deep purple night mode, more content and a structural efficiency review. Ordinary play confirmation does not cover every platform or screen reader.

## 34.1 Visual preference

The initial presentation uses a dark galaxy gradient with blue and violet fields. The header button toggles between night and light modes, exposes its next action in French and its current pressed state, and keeps a minimum 44 px hit area. Contrast overrides cover cards, buttons (including disabled and owned states), progress, diagnostics, import and recovery. The original light palette remains selectable. The preference is stored separately at `cookie-empire-foundation-v2.theme`, accepts only `dark` and `light`, and defaults to dark for missing, invalid or inaccessible storage. SaveSystem alone touches storage; an unavailable store leaves the live toggle usable and announces the persistence failure. Reset/import/export of the game do not change this preference. The save envelope remains v4. Native real-device visual and accessibility checks are pending.

## 34.2 Content and compatibility

Mine de cacao: first cost 12,000, geometric growth 1.15, base CPS 47, and +47 per click for each owned unit before click upgrades. It follows the existing immutable GENERATORS definition and generic purchase and UI paths. CPS upgrades do not multiply its click bonus. Existing v1–v4 saves omit its identifier and load with zero mines. No new saved field or milestone requirement is introduced.

## 34.3 Architecture audit and verification

Content, Economy, GameEngine, SaveSystem and GameUI retain their distinct responsibilities. Generator cards are created once, and refreshed through cached DOM references; the existing 0.25 s render and 5 s autosave schedule avoid writing storage on every frame. The renderer now formats each single and batch price once, using that value for both visible text and accessible button names. At four generators, a larger economic refactor offers no demonstrated gain and would increase compatibility risk. The theme preference is independent of game state and cannot invalidate a save. The existing protection, backup and import paths remain intact.

Tests: 157/157 embedded core, focused jsdom checks for the theme toggle, labels, old-save mine default, mine purchase and derived click/CPS, and deterministic 20 renders / one autosave over five simulated seconds. Browser/mobile layout, computed contrast and native screen reader use remain unverified. Next: check night and light modes on a real phone and desktop, reload after a theme change, buy a mine, and observe later-game click balance.

# 35. Mobile header and extended progression — Foundation 1.0

Specification and implementation 2026-09-27 (Martinique local date). The player validated ordinary play on Android in Foundation 0.9 and provided screenshots. The phone header visibly clipped “Cookie Empire” because three 44 px actions shared the same row as the brand. The eight original milestones were complete despite ten owned cocoa mines; late-game progression needed continuation.

At mobile widths up to 760 px, the title occupies its own row and the three 44 px controls occupy a right-aligned second row. This keeps the full title visible without narrowing tap areas. The compact purchase row allows its primary text to wrap. At larger widths the existing topbar layout is retained. The four new descriptive milestones follow the original eight in order: one cocoa mine, ten cocoa mines, 100,000 total cookies, one million total cookies. New ranks at ten and twelve completed steps are “Royaume du cacao” and “Empire gourmand”. Milestones award nothing and remain derived from authoritative generator counts and totalProduced; old v4 saves do not change format or key. Existing players retain their completed steps and see the next applicable objective. Previous maximum eight-step copy changes to twelve-step copy.

Verification: 157/157 embedded rule/persistence tests and jsdom interface checks pass, including exact large thresholds, partial late-game progression and final rank; deterministic frame cadence remains 20 renders and one save in five simulated seconds. User screenshots validate 0.9 on an Android device, not this new 1.0 mobile layout. A real mobile render, reload and independent screen-reader check remain pending. Next: inspect the 1.0 topbar at narrow phone width and check the next milestone from an imported or continuing save with eight original goals completed.

# 36. Click and mine upgrades, chocolate lab, active-tab recovery — Foundation 1.1

Specification and implementation, 2026-09-27 Martinique local date. The player validated Foundation 1.0 through Android screenshots and requested sustained independent improvements. The baseline is the 1.0 source and Master v2.7.

## 36.1 Content and balance

Add two permanent upgrades through immutable UPGRADES and the existing generic economy, UI and v4 ownership list: `cocoa_excavators` costs 25,000 and doubles cocoa-mine CPS only; `cosmic_click` costs 150,000 and triples the entire derived click reward, cumulative with reinforced click for ×6 total. Neither changes generator prices. Add `chocolate_lab`, cost 250,000, growth 1.15, base 230 CPS and +230 per manual click per unit before click multipliers. Its ownership defaults to zero on older saves. Retain all prior goals unchanged; add all six upgrades, ten million total cookies, first lab and five labs, for sixteen informational goals. Ranks at fourteen and sixteen goals are “Constellation gourmande” and “Académie du chocolat”. Existing completion is recomputed from saved sources, no milestone save fields are introduced. User-facing prices and statuses reflect the new content. Balancing is an initial pass; measure late-game pacing on device before adding multipliers or prestige.

## 36.2 Render and interaction efficiency

The UI caches single and ×10 cost computations per generator at each owned count. Affordability is compared every UI refresh against the current wallet; changing cookies never leaves a button stale. On any acquisition, the ownership count changes and both quotes, visible labels and accessible names refresh together. This avoids five geometric sum evaluations per 0.25-second shop render while retaining the existing 0.25-second UI and 5-second autosave timing. Click feedback is one reused output element, ignored by assistive technology (the main cookie button carries the gain in its label), cleared after 650 ms idle; it does not add a DOM node per click. The expanded sixteen-step list offers a 44 px filter that hides completed entries and lets the player restore them; it explains an empty remaining list when every goal is done. A direct link from progression to the workshop skips the long list without mutating state.

## 36.3 Mobile lifecycle

When visibility changes to hidden or `pagehide` occurs, checkpoint the part and remember the current wall-clock timestamp once. While hidden, skip RAF simulation. On visible again or `pageshow` after a browser history return, apply at most thirty days of offline gain for the elapsed background time, reset RAF time to avoid a second gain, refresh UI and checkpoint if cookies were gained. Repeated lifecycle events do not multiply the gain. If the clock moves back, clamp elapsed to zero. The timestamp is in-memory and not part of the v4 save; page reload still uses the existing lastSavedAt path. This does not guarantee recovery from an abrupt OS kill without a pagehide event and does not address multiple tabs writing concurrently.

## 36.4 Verification and remaining gate

163/163 embedded rule/storage tests pass, including targeted new costs, multiplier separation, idempotence, old-save default, invalid saved ownership and lab purchase. The jsdom UI test exercises actual purchase buttons, visible derived rewards, save reload, quote cache and mobile visibility events with a simulated ten-second suspension. The deterministic loop retains 20 renders and one autosave in five seconds; the hidden-loop test observes zero simulated ticks. The release has not been observed in a real browser, and visual mobile layout, screen readers and balancing remain user/device checks after the requested sustained work. Next: check the 1.1 screenshot, background/foreground gain on Android, save and reload, and whether lab progression feels balanced at 1–10 million cookies.

# 37. Constellation interface and research expansion — Foundation 2.0

Specification recorded BEFORE implementation, 2026-09-28 UTC. Latest baseline 1.1 is validated by the player's complete 79.99 s Android recording. All 40 sampled frames and the final frame were inspected. Audio stream is digital silence (peak -91 dB). Video shows sustained clicking, completed 16 goals and six recipes, shopping at 45 labs; balance wrapping at 100 million displaces the click target. This authorizes a substantial interface/content milestone. Official Cell to Singularity press screenshots supply layout inspiration only; no reference-game asset is shipped in Cookie Empire.

## 37.1 Interface contract

Persistent compact resource HUD; four mutually exclusive views Empire, Atelier, Recherche, Parcours; fixed bottom navigation on phones. Empire retains the original cookie artwork in an original dark orbital scene, compact next objective and chapter title. A secondary click button stays available outside Empire, using the same engine action. Stable one-line abbreviated HUD values retain full French values in accessible labels/title. Each view keeps mounted cards and its own scroll offset. Native navigation buttons use aria-current; keyboard arrows/Home/End move focus and activate a view. Research has three labelled branches, visible prerequisite text and available/locked/owned states. Filters may hide acquired research; selecting a prerequisite resets filtering and opens its branch. No canvas panning, copied 3D assets or paid currencies.

## 37.2 New content

Existing five generators and six upgrades preserve prices and effects. Add orbital_bakery (5 million, 1,400 base CPS/click contribution), lunar_harvest (100 million, 7,800), stellar_forge (2 billion, 44,000), all growth 1.15. New permanent upgrades: precision_click (2 million, click ×2, requires cosmic_click); quantum_click (150 million, click ×2, requires precision_click); singularity_click (15 billion, click ×3, requires quantum_click); lab_synergy (1 million, lab CPS ×3, requires cocoa_excavators); orbital_logistics (25 million, orbital CPS ×3, requires lab_synergy); lunar_crystals (1 billion, lunar CPS ×3, requires orbital_logistics); stellar_network (500 million, global CPS ×2, requires warm_ovens); infinite_ovens (50 billion, global CPS ×2, requires stellar_network). New prerequisites apply only to new purchases; already-owned upgrades always remain effective. Validate dependency IDs, duplicates, self-dependencies and cycles at startup. Quote and engine both enforce the same prerequisite rule through Economy.upgradeQuote.

Add twelve informational milestones after the existing sixteen: 100 million total; first orbital bakery; ten orbital bakeries; nine researches; 1 billion total; first lunar harvest; ten lunar harvests; 12 researches; 10 billion total; first stellar forge; ten stellar forges; 1 trillion total. Existing achievements retained. New ranks at 18/20/22/24/26/28. No prestige/reset mechanic, timers, currency or save-field migration. V4 missing new generator IDs defaults to zero. Forward transfer supported; downgrading after new ownership is unsupported.

## 37.3 Verification contract

Rerun existing core and DOM suites, preserve historical cases by fixing fixtures that meant the original six upgrades rather than the whole expanding catalogue. Add engine tests for gated exact-price purchases, nonmutation on rejection, dependency validation, each generator, chained multipliers, old v4 import, new save roundtrip and reset. UI tests cover view state, keyboard, sticky HUD data, compact huge values, secondary click, filters, research unlock after purchase, stable nodes and late-video synthetic state. No claim of actual browser rendering where environment access remains blocked. DOCX must clearly separate video observations, reference analysis, implemented changes and future ideas.


## 37.4 Implementation and measured verification

Implemented Foundation 2.0 Constellation. Four mounted views, sticky HUD with abbreviated wallet and full accessible value, keyboard navigation, per-view scroll memory, focus transfer from hidden panels, secondary click control, three research branches with dependency links and owned filters. Original orbital scene includes three destination buttons leading directly to their generator cards and displays owned counts. Cosmetic chapter/shading follow highest owned space generator. Generator cards now display effective per-unit click contributions, including click research multipliers.

Performance adjustment: handleClick credits through the same GameEngine action and refreshes resources/feedback immediately, without traversing the entire shop/progression/research tree. Full UI still updates every 0.25 s and immediately on purchases/navigation; autosave remains 5 s. Test verifies 100 clicks produce 100 credits and zero full render calls. Generator-price quote caching remains. Persistence, numeric system, application clock and existing purchase transaction code are unchanged; the shared quote adds research gating.

Verification: 175/175 embedded tests (all 163 prior cases, adjusted only catalogue-specific historical fixtures, plus 12 extension cases); previous available DOM suite passes; 40 new Constellation DOM assertions pass. Includes a synthetic approximation of the video's possessions, forward save loading, exact costs, invalid dependency graphs, effect separation, reset, all-complete goals, accessible navigation, filters, prerequisite jump and secondary click. No real browser/mobile screenshot validation claimed. DOCX illustration is explicitly a schematic, not a browser render. New screen dimensions and physical touch remain unverified under the recorded browser access restriction. No bypass attempted.

Source of truth now this v2.9 file, index.html Foundation 2.0 and the 2.0 test report. The user requested roughly thirty minutes of independent work; no premature device-test request was made. Next concrete priority is observe the new layout and late-game pacing in real play, then tune prices if needed. Prestige, timed buffs, a pannable map and additional currencies remain unimplemented proposals.

# 38. Sixteen generators and specializations — Foundation 2.1 Horizons

Specification BEFORE implementation, 2026-09-28 UTC / 2026-09-27 Martinique. User requests at least sixteen generators and continued analyze/correct/improve/optimize discipline, with approximately twenty minutes of work and GitHub research. Continue from Foundation 2.0 / Master v2.9, never attached historical prototypes. Baseline 175 core tests and the existing DOM suites pass. User says “Très bien”; this is positive acceptance, not proof of independent complete browser verification.

## 38.1 Content and economy

Keep existing eight generator prices and production. Add eight with growth 1.15: nebula_refinery (40 billion, 600,000 CPS), comet_caravan (800 billion, 9 million), quantum_oven (16 trillion, 140 million), time_confectionery (320 trillion, 2.2 billion), antimatter_mixer (6.4 quadrillion, 35 billion), galactic_foundry (128 quadrillion, 560 billion), multiverse_kitchen (2.56 quintillion, 9 trillion), origin_crucible (51.2 quintillion, 145 trillion). Numbers here use English scales; source numeric strings and French UI govern display. Each unit also contributes its base CPS to clicks before click multipliers. New first-price/base-production ratios grow approximately 1.25× per tier, avoiding growth 20× in price with only 6× in output.

Eight permanent specializations for the original eight generators, each requiring ten owned units and costing 80× its original first-unit price. Each doubles that generator's automatic production AND its contribution to clicks, not the base clickPower and not other generators. New effect target generatorPower; separate generatorClicks multiplier map, derived only. Existing CPS-only upgrades retain their exact semantics. Already owned research remains effective even if loaded ownership is below the purchase gate. No new state fields, timers, currencies, or save-format changes. Add sixteen informational goals (first and ten units for each new generator), giving 44 total; 22 researches total.

## 38.2 Shop and efficiency

Group sixteen generators into four cosmetic eras of four. Provide era and possession/affordability filters, explicit empty state and shown/discovered counts. Filters must never alter purchase eligibility or hide an owned unit through an economic gate. Destination jumps clear filters and focus the requested mounted card. Add single-unit “missing cookies” feedback and a production-only time estimate, labelled as excluding manual clicks; no invented click rate. Estimates use HugeNumber ratios and never convert huge balances directly to Number.

Cache UI multipliers and formatted per-unit rates by owned-upgrade signature, invalidating after purchases, reset, imports and restored states. Keep pricing cache by count and resource-only immediate click updates. Limit identical DOM text writes using an equality setter. Authoritative engine computations remain uncached so direct state restoration and existing test paths remain valid. Measure derivation calls and DOM mutations, not phone frame rate.

## 38.3 Correctness repair and tests

Reproduce generator purchase partial mutation when derived-value computation throws, and inherited-key generator inputs. Prepare total cost, new ownership and derived values before committing one purchase. Reject non-string/unknown IDs consistently in generator buying and max buying. Keep bulk arithmetic, price growth and save protection unchanged. Red/green regressions required before repair.

Test every new generator (exact price, CPS, clicks, growth, bulk), specialization before/at ten units, cost/debit/duplicate, per-generator isolation, CPS-only separation, old v4 missing IDs, new roundtrip, reset, 44 goals, filters, destination navigation, estimates, cache invalidation, startup and full prior suites. Real mobile rendering remains unverified under the already-recorded browser restriction.

## 38.4 External research

Primary repositories inspected on GitHub: nuclear-unicorn/kittensgame README and js/buildings.js (metadata cache invalidated by stage); Acamaeda/The-Modding-Tree js/technical/temp.js (temporary computed data and excluding action functions); pmotschmann/Evolve README (clicker/idler progression and tradeoffs). Apply the general ideas of keeping earlier buildings useful and invalidating presentation caches on real changes. No code, assets or dependencies from these repositories are incorporated. Their contribution rules do not govern this repository. A separate research note records URLs and exact inspected file SHAs.

## 38.5 User steering on test usefulness

User additionally requests removal of useless tests during this milestone. Move the development core regression suite out of the downloadable HTML; run it only through npm test. Stop running the same core suite a second time on jsdom startup. Replace the in-game test counter with ordinary version/save information. Remove redundant theme assertions in the new UI suite because the earlier DOM suite already covers preference persistence and accessibility. Consolidate generator coverage into parameterized catalogue cases where this replaces genuinely duplicated single-generator scenarios, preserving old-save and corruption edge cases. Keep economic/persistence regression gates; do not interpret this request as authorization to discard meaningful data-loss protections.


## 38.6 Implementation and results

Foundation 2.1 Horizons implements 16 generators, 22 permanent researches and 44 informational goals. Eight specializations require ten owned units; their generatorPower effect multiplies only the selected generator's CPS and click contribution. All old prices and effects remain. Region/availability/owned/new filters keep mounted cards; destination and research gate links clear filters before focusing a generator. Single-unit waiting feedback is explicitly production-only, with no assumed click frequency. Chapter labels now follow the highest discovered region.

Observed red/green: the injected derived-calculation failure caused generator cookies and ownership to change before an exception in 2.0. The new prepared transaction passes with the full state unchanged. Invalid/prototype ID tests already passed on the old engine; explicit own-string guards are hardening, not a separately reproduced failure.

Test cleanup requested by the user: the full regression function is now scripts/foundation-cases.js and never embedded or invoked by index.html. Core suite runs once via check-foundation.mjs, not again on DOM startup. Removed two redundant theme assertions from check-constellation.mjs. Replaced four per-generator acquisition/missing-field cases with two parameterized catalogue cases covering all 16, including invalid saved ownership. No corruption, recovery, import, timing or numerical regression protection removed. The in-game footer displays version/save information, with no test counter.

Final automated results: **181/181 core cases**, existing interface assertions pass, **56 Constellation/Horizons DOM assertions** pass. These include all 16 exact-price/bulk acquisitions, 22-research roundtrip, generatorPower isolation and multiplication, ten-unit gating, huge-number waiting estimates, filters, empty states, destination focus, the sixteenth purchase, chapter updates and reset. A 20-render probe records zero repeated multiplier derivations or unit-CPS computations for unchanged research; MutationObserver records zero child/text writes in the shop for an unchanged render. Changing research invalidates all 16 displayed unit rates. Engine calculations remain uncached.

Delivery HTML is 155,594 bytes versus 224,991 bytes for 2.0 (30.84% smaller); no external runtime dependency. This byte comparison is not a device startup or FPS benchmark. Timers/persistence/numeric classes unchanged. Save v4 and its key remain; old absent generator IDs initialize to zero. New research ownership is not readable by older builds; transfer forward using existing JSON export/import.

No real browser/mobile layout validation claimed; earlier environment access restriction remains. Node/jsdom results demonstrate rules and simulated DOM interaction, not physical touch behavior, pixel layout or long-term balance. No browser-policy bypass or test request made during independent work. Current authority is this Master v3.0, index.html Foundation 2.1 and the 2.1 test/research reports.


# 39. First prestige layer — Foundation 2.2

Specification recorded BEFORE implementation, 2026-09-28. Baseline: Foundation 2.1 Horizons at commit `1e097e69ebb802f8cad5b9cbb9e649e11a1d2a85`. Both Foundation checks and the new Playwright Chromium checks pass on desktop and Pixel 5 emulation. The browser artifact was inspected before this design; no blocking layout failure was observed. Physical-phone validation remains distinct from emulation.

## 39.1 Progression contract

Foundation 2.2 introduces one permanent prestige resource, **Éclats d'empire**, represented by HugeNumber. Prestige becomes available only when the current run has produced at least **1 billion (1e12) cookies**. The pending reward is `sqrt(totalProduced / 1e12)` Éclats; fractional values are intentional so the numeric engine remains scalable without integer truncation. The permanent production multiplier is `1 + 0.10 × prestigePoints` and applies to both automatic CPS and generator-derived click contribution. It does not multiply the base clickPower directly. The multiplier is derived in Economy and never saved as a cache.

A prestige resets the run resources only: cookies, current-run totalProduced, totalClicks, clickPower, generators and owned research return to their fresh-game values. It preserves accumulated prestigePoints and increments a safe integer prestigeCount. A normal “Nouvelle partie” remains a full reset and clears prestige as well. Milestones continue to describe the current run; no existing objective semantics are silently changed.

## 39.2 Persistence and transaction contract

Save schema advances explicitly from v4 to **v5**. V5 adds `prestigePoints` as canonical HugeNumber JSON and `prestigeCount` as a non-negative safe integer. V1–v4 remain loadable; they migrate with zero prestige points/count. No derived multiplier is persisted.

Prestige must not mutate the live GameState before the replacement save is confirmed. SaveSystem receives a dedicated commit path that protects the previous valid primary snapshot as the backup, verifies the new v5 write and enters the existing uncertain/recovery modes on ambiguous storage failures. If persistence cannot confirm the prestige, the live run remains unchanged. Import/export continues through the existing recovery envelope and accepts migrated v1–v5 states.

## 39.3 UI contract

The Parcours view displays accumulated Éclats, the permanent multiplier and the next prestige reward. Before 1e12 produced, the prestige action is disabled and states the remaining requirement. At or above the threshold, the action requires an explicit confirmation describing the run data that will reset and the permanent reward that will remain. After success, the UI reconnects to the new state and saves normally. No modal framework, second currency shop, prestige upgrades or automation is introduced in this milestone.

## 39.4 Verification contract

Add red/green coverage for v4 migration, v5 roundtrip, invalid prestige values, exact 1e12 threshold, reward scaling, multiplier separation, repeated prestige accumulation, full-new-game clearing, and storage failure leaving the live run unchanged. Rerun all 181 existing core cases and all existing jsdom/Constellation suites. Extend Playwright with a prestige-path test using a controlled valid save rather than millions of clicks, then require both Foundation and Browser workflows to pass on the feature branch. Browser emulation is reported as browser-tested, not as a physical-phone test.


## 39.5 Implementation and verification

Implemented on branch `feature/foundation-2.2-prestige`. GameState now owns `prestigePoints` (HugeNumber) and `prestigeCount`; Economy owns reward and permanent multiplier derivation; GameEngine prepares a detached prestige candidate without mutating the live run; SaveSystem alone commits the v5 replacement. V4 and older saves load with neutral prestige values. Recovery import revalidates prestigePoints as a canonical HugeNumber. The Parcours view exposes the permanent total, multiplier, pending reward and a confirmed prestige action.

Observed red/green: the first implementation failed the Foundation suite because historical schema assertions still required v4. After migrating those expectations, three failures remained: one test helper unavailable inside the VM context and two exact persisted-field assertions still describing v4. Those tests were corrected without weakening their checks. A dedicated storage-failure regression then verifies that a failed primary write leaves the live run byte-for-byte unchanged and enters uncertain mode.

Final automated result on the feature branch: **187/187 Foundation cases**, existing targeted interface checks pass, **56/56 Constellation/Horizons DOM checks** pass, deterministic cadence remains 20 renders and one autosave per five simulated seconds. GitHub Actions Browser checks pass in Chromium for desktop and Pixel 5 emulation, including the new prestige path: locked below threshold, confirmed reset at 1e12, one permanent Éclat, ×1.1 multiplier, zero current wallet and persistence after reload. This is real browser automation, but not a physical-phone validation.

No prestige shop, second prestige tier, timed buff, extra generator, or automation was added. Balance is intentionally conservative and must be observed in a long real play session before expanding the system.


## 39.6 Post-merge audit correction

Post-merge adversarial review found one v5 validation defect: `prestigePoints` used `HugeNumber.fromJSON()` directly, so a locally corrupted v5 save could supply a non-integer exponent or another non-canonical representation. A red regression reproduced the acceptance before correction. Persistence now requires canonical prestige JSON (zero exactly `{m:0,e:0}`; otherwise mantissa in [1,10) and integer exponent) before constructing the HugeNumber. This tightening is deliberately scoped to the new v5 prestige field so historical number migration semantics are not silently changed.

The audit also found two verification-contract gaps rather than demonstrated runtime failures: repeated prestige accumulation and full “Nouvelle partie” clearing of permanent prestige had no dedicated tests. Both now have explicit regression coverage. The terminology in 39.1 was corrected from “1 trillion” to the French long-scale “1 billion” for 1e12, matching the game's existing French scale table and player-facing text.


# 40. Balance observatory — development tooling before further prestige content

Specification BEFORE implementation, 2026-09-29 UTC. Foundation 2.2 Rayonnement is the playable baseline at `d299d58dca358a8fc909a3715175070103aa0fcc`. The prestige mechanic is structurally verified, but its pacing has not been measured through a long deterministic economy run. Do not add a prestige shop, second prestige layer or balance changes until this measurement exists.

## 40.1 Scope and source of truth

Add a development-only balance simulator under `scripts/`; it must never be embedded in `index.html` and must not add runtime dependencies or saved fields. It loads the real game classes/content from the playable HTML, so generator prices, upgrades, prestige formula and HugeNumber behavior remain single-source rather than copied into the analyzer.

The simulator reports clearly labelled hypothetical manual-click scenarios; no click frequency becomes an engine or UI assumption. Each scenario starts from a fresh GameState, advances deterministic simulated seconds, models the configured manual-click income analytically from the real derived clickReward, and uses a deterministic greedy purchase policy. It does not increment totalClicks because that counter is not an input to current economy rules; this avoids millions of synthetic UI-like click calls while preserving the modeled income. Candidate purchases are evaluated from cloned authoritative state through the real Economy/GameEngine rules. The policy selects the affordable generator or research purchase with the greatest increase in combined modeled income `CPS + clickReward × scenarioClickRate` per unit cost. Ties are stable by content order. This policy is a diagnostic heuristic, not a claim about optimal human play.

## 40.2 Safety and verification

The observatory must terminate under an explicit horizon, never mutate Content definitions, never use wall-clock/offline gain and never write Persistence. It reports time to first prestige threshold, wallet, total produced, CPS, click reward, purchases and pending prestige reward. Automated checks require finite/non-negative metrics, threshold consistency when reached, and monotonic expectation that the same deterministic policy with more free manual clicks does not reach the first threshold later than a lower click-rate scenario. A zero-click fresh run is expected not to self-start and is reported as such rather than treated as a game defect.

Expose `npm run analyze:balance`; add a bounded observatory verification to `npm test` only if execution remains fast. Record measured outputs, limitations and any discovered anomaly before changing balance.


## 40.3 First measured baseline

The first CI execution completed successfully. Under the exact deterministic greedy policy defined above, a fresh zero-click scenario correctly stalls at zero. Fresh 2 clicks/s reaches 1e12 totalProduced in **31,388 s (8 h 43 min 8 s)**; fresh 5 clicks/s in **13,587 s (3 h 46 min 27 s)**. Starting a fresh run with one permanent Éclat and the same 2 clicks/s reaches the threshold in **28,538 s (7 h 55 min 38 s)**, about 9.1% sooner than the zero-Éclat 2-click scenario. All three active scenarios followed 719 purchases under this heuristic and crossed with a pending reward around 1.01 Éclat.

These measurements do not establish optimal play, human click endurance, AFK pacing or final balance. The modeled manual income is continuous at the declared rate and the greedy policy values immediate modeled income per cost; a human may save for gates or stop clicking. The result nevertheless shows no structural unreachable-prestige defect and no obvious runaway from the first +10% permanent multiplier. Therefore no balance constant is changed in this milestone. Real long-play observation remains the authority before adding prestige spending or another layer.


# 41. Multi-prestige observatory — verify long-run Rayonnement scaling

Specification BEFORE implementation, 2026-09-29 UTC. Baseline is Foundation 2.2 plus the first balance observatory at commit `4554258c4a84d676da86d94951d1a2ca7b6030c3`. The first-reset pacing is measured, but a permanent additive multiplier can still create undesirable later-cycle acceleration. Measure repeated threshold prestiges before introducing spendable Éclats or another progression layer.

## 41.1 Contract

Extend only the development observatory. For a declared click-rate scenario, simulate a fixed sequence of prestige cycles. Each cycle must begin from the previous cycle's real `GameEngine.prestigeCandidate().state`; do not manually manufacture the next prestige total. Use the existing deterministic purchase policy and stop each run at the same 1e12 threshold. Record per-cycle duration, earned reward, cumulative prestige points and derived permanent multiplier.

This remains diagnostic, not gameplay. It must not change `index.html`, Persistence, Content, save schema or balance constants. Assertions require every requested active cycle to reach threshold, positive rewards, strictly increasing prestige points/count, non-increasing cycle duration under the same deterministic policy, and finite metrics. Record results and limitations before deciding whether Foundation 2.3 should add prestige content.


## 41.2 Measured ten-cycle baseline

The observatory was deliberately re-enabled in the Foundation CI gate for one measurement run. At a constant hypothetical 2 clicks/s and the same deterministic purchase policy, cycles 1→10 reached the threshold in: **31,388; 28,515; 26,133; 24,040; 22,356; 20,877; 19,526; 18,382; 17,360; 16,427 seconds**. Cumulative prestige points progressed to about **10.1** and the permanent multiplier to about **×2.01**. Each threshold run earned about 1.01 Éclat under this policy.

Cycle duration therefore falls from about 8 h 43 min to 4 h 34 min by cycle ten: material but progressive acceleration, consistent with the additive `1 + 0.10 × prestigePoints` formula rather than an observed runaway. No economy constant is changed.

Architectural consequence for future prestige spending: `prestigePoints` currently represents accumulated permanent power. A shop must not silently spend this same value unless losing multiplier power is an explicit design choice. Prefer specifying a separate spendable balance and lifetime/power source before implementing prestige purchases. This is a future schema/economy decision, not implemented here.

The ten-cycle analyzer is intentionally development-only. Its temporary inclusion in routine `npm test` is removed after this measured run because it materially increases CI duration; invoke `npm run analyze:balance` when economy/prestige changes require remeasurement.


# 42. Foundation 2.3 — Rayonnement wallet separation

Specification BEFORE implementation, 2026-09-29 UTC. Baseline: Foundation 2.2 plus the ten-cycle observatory at `1e92ba272454cb394542875fa870516cce803dd7`. The observatory shows progressive rather than runaway scaling through ten threshold prestiges. The next architectural risk is currency semantics: the existing `prestigePoints` is lifetime permanent power and must not later be spent directly by a shop.

## 42.1 State and economy contract

Foundation 2.3 introduces `prestigeCurrency` as a second authoritative HugeNumber in GameState. `prestigePoints` retains its existing meaning and remains the sole source of the permanent `1 + 0.10 × prestigePoints` multiplier. `prestigeCurrency` is the spendable Éclat balance reserved for future prestige purchases; no shop or spending action is introduced yet.

On every successful prestige candidate, the same computed reward is added independently to both `prestigePoints` and `prestigeCurrency`. The two values may diverge in future when spending exists. A normal full “Nouvelle partie” clears both because GameState.create() is the full reset authority. Prestige preserves the existing wallet and adds the new reward.

## 42.2 Persistence contract

Advance the save schema explicitly from v5 to **v6**. V6 persists canonical `prestigePoints` and canonical `prestigeCurrency`, plus the existing authoritative fields. V5 migration maps `prestigeCurrency = prestigePoints`: every Éclat earned before spendable currency existed becomes available, while lifetime power is unchanged. V1–v4 migrate both values to zero. Both v6 prestige HugeNumbers require the same canonical validation rule already used for v5 prestigePoints. No derived multiplier is persisted.

Existing transactional prestige semantics remain unchanged: live state is replaced only after the v6 candidate save is confirmed. Failed/ambiguous writes leave the live run unchanged.

## 42.3 UI and terminology contract

The Parcours prestige card must distinguish **Rayonnement total** (lifetime power) from **Éclats disponibles** (future spendable wallet) and continue to show the permanent multiplier. The prestige confirmation/reward message states that earned Éclats increase both lifetime Rayonnement and available balance. No disabled fake shop controls are added.

Foundation/footer version advances to 2.3. Existing 16 generators, 22 research items, 44 milestones, prestige threshold/reward formula and all economy constants remain unchanged.

## 42.4 Verification contract

Follow red→green. Before implementation, add regression cases proving the new requirements fail on Foundation 2.2: fresh wallet zero, prestige credits both totals, repeated prestige preserves/adds wallet, v5 migration seeds wallet from lifetime points, v6 roundtrip, rejection of invalid/non-canonical v6 wallet values, and full New Game clearing both values. Existing v5 corruption protection must remain. Then implement minimally, rerun all Foundation/jsdom/Constellation checks, rerun the balance observatory to prove unchanged pacing, and require Playwright desktop/Pixel 5 to pass with wallet persistence visible after prestige/reload. Perform a second adversarial review before merge.


## 42.5 Implementation, audit and verification

Implemented on `feature/foundation-2.3-prestige-wallet`. GameState now owns `prestigeCurrency` separately from lifetime `prestigePoints`. Prestige candidates add the same reward to both values while the permanent multiplier continues to read only lifetime points. Save schema is v6; v5 migration clones existing lifetime points into the new wallet, and v1–v4 remain neutral. The Parcours card exposes Rayonnement total, available Éclats and multiplier separately. No spending action or economy constant was added.

Red→green evidence: the seven initial 2.3 cases produced a deliberate **190/196** Foundation failure before implementation. After implementation, three old exact-schema assertions were the only failures and were updated from v5 to v6 without weakening derived-cache exclusions. The resulting suite passed 196/196.

The required second adversarial review then found a real validation gap: canonical v6 values allowed `prestigeCurrency > prestigePoints`, impossible under the current earning-only wallet model. A dedicated red CI run reproduced this as **196/197**, with only the new invariant failing. V6 decode now rejects wallet values above lifetime Rayonnement. The temporary red-run trigger was not retained.

Final instrumented verification passes **197/197 Foundation**, targeted interface checks and **56/56 Constellation/Horizons DOM checks**. The balance observatory was deliberately rerun after carrying the new authoritative wallet through simulation clones: first 2-click/s threshold remains 31,388 s and cycle ten remains 16,427 s, so Foundation 2.3 does not alter measured pacing. The observatory was then removed from routine `npm test` again.

Playwright coverage is updated to require both lifetime Rayonnement and available wallet to show 1 after a threshold prestige, survive reload, and persist under save v6. Chromium desktop and Pixel 5 emulation are the browser validation surfaces; physical-phone validation remains separate.

Next progression work may define a small data-driven prestige shop, but only against the separated wallet. Spending must reduce `prestigeCurrency` transactionally while never reducing `prestigePoints` unless a future design explicitly changes that lifetime-power contract.


# 43. Foundation 2.4 — derived research synergies

Specification BEFORE implementation, 2026-09-30 UTC. Baseline: Foundation 2.3 at `0b76abeed4d91d8286f779be392047f60ebd8c70`. The user requested deeper bonuses and explicit synergies. This milestone extends the existing research layer without introducing spendable Éclat purchases yet; the prestige wallet contract from section 42 remains unchanged.

## 43.1 Design and source of truth

Add immutable `SYNERGIES` content definitions. A synergy is automatically active when all research IDs listed by its definition are owned. Activation is therefore fully derived from authoritative `ownedUpgrades`; GameState receives no `activeSynergies` field and save schema remains v6. Synergies cannot be bought, refunded or activated manually.

Initial catalogue contains four paired-specialization synergies, progressing through the first eight generators. Each requires the two neighboring `generatorPower` specializations of its pair and applies modest multiplicative bonuses to both automatic production and final click reward. Exact factors are content data and must be validated at startup. No synergy may reference an unknown research ID, duplicate a requirement, contain fewer than two requirements, or define a factor below 1.

## 43.2 Economy contract

Economy alone derives active synergies. Upgrade multipliers are reconstructed first; then active synergy CPS factors multiply `globalCps` and active synergy click factors multiply the existing click multiplier. Effects stack multiplicatively in immutable content order and are idempotent across repeated refreshes. Generator prices, ownership, prestige reward formula, Rayonnement permanent multiplier and research purchase prices are unchanged.

The first four combinations are deliberately bounded: Atelier complice (Cursor + Grand-mère) ×1.10 CPS / ×1.10 click; Four & cacao (Four + Mine) ×1.15 / ×1.05; Science orbitale (Laboratoire + Boulangerie orbitale) ×1.20 / ×1.10; Cycle astral (Moisson lunaire + Forge stellaire) ×1.25 / ×1.15. These are initial balance values, not immutable release commitments.

## 43.3 UI contract

Recherche displays a dedicated Synergies section generated from `SYNERGIES`. Each card states its required researches, its two factors and whether it is active. Locked cards are informational only and never become a second source of truth. Existing research filters remain scoped to purchasable research; synergy cards remain visible in their dedicated block.

## 43.4 Verification contract

Red→green coverage must prove: no free synergy on a fresh state; correct activation from the required pair; exact CPS/click multiplication; partial requirements remain inactive; multiple synergies stack multiplicatively; repeated `refreshDerived` is idempotent; save v6 contains no derived synergy cache and reconstructs activation after load; invalid synergy content is rejected. Rerun the complete Foundation/interface/Constellation suites and Playwright desktop/Pixel 5. Because these bonuses change pacing, rerun `npm run analyze:balance` and record the measured impact before merge. Do not add prestige spending in the same milestone.


## 43.5 Implementation and measured verification

Implemented on `feature/foundation-2.4-synergies`. `SYNERGIES` is immutable content and `Economy.deriveActiveSynergies` reconstructs activation from `ownedUpgrades`. Active factors are folded into the existing derived multiplier object; no GameState field and no v6 save field were added. Research now renders a separate informational Synergies block.

Red evidence exists at `49cfc13a01fae848cebcdb7c7d39aa70e929e9e0`. Final automated Foundation result is **203/203**, targeted interface checks pass and **56/56** Constellation/Horizons DOM assertions pass. The deterministic render/save cadence remains unchanged.

The required balance rerun passes. Under the same diagnostic policy, fresh 2 clicks/s reaches prestige in **25,141 s** versus the 2.3 baseline 31,388 s; fresh 5 clicks/s in **10,969 s** versus 13,587 s; one Rayonnement + 2 clicks/s in **22,821 s** versus 28,538 s. The ten-cycle 2-click/s series remains monotonic and reaches cycle ten in **13,148 s** versus 16,427 s. This is a material ~20% acceleration, accepted for this first synergy milestone but explicitly subject to human long-play observation before adding further broad multipliers. The temporary balance step was removed from routine CI after measurement.

Final feature HEAD `b08488d03039eab353085a9a76cb7e37f8e362e3` passed GitHub Actions: 203/203 Foundation cases, targeted interface checks, 56/56 Constellation/Horizons DOM assertions, and 6/6 Playwright browser tests. Chromium desktop and Pixel 5 emulation are browser evidence, not physical-phone evidence. PR #9 was squash-merged to `main` as `d8a0d18c0366525ebb2ada57d9e1b678c286a2cb`. No prestige spending is part of Foundation 2.4.
