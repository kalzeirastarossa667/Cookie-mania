# COOKIE EMPIRE — MASTER DEV FILE
Version: 2.4
Status: FOUNDATION 0.7.1 CONTENT AND WRITE-CADENCE CANDIDATE / SOURCE OF TRUTH
Last audit: 2026-09-27

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

Current loop refreshes UI and writes localStorage every 0.25 simulated seconds, up to four times per second. Keep the 0.25-second UI cadence and separate autosave to an approximately 5-second in-session interval. Manual save remains intact. Flush pending progress on `pagehide` and when the document becomes hidden; these are best-effort browser lifecycle hooks. Use elapsed in-session time for the accumulators; do not add persistent timer state. On large stalls continue clamping frame delta as before. A failed save remains handled by Persistence and does not stop gameplay. The tradeoff is up to roughly five seconds of unsaved in-session progress after an abrupt termination where lifecycle events do not run, plus the pre-existing localStorage limitations.

## 32.4 Verification gates

Rerun all 146 existing embedded tests, add tests for oven cost, ×1/×10/Max, derived and offline production, old-save default, present invalid count and save/load. Check loop cadence and the ×10 displayed cost with a focused interface integration test if a DOM harness is available. Check syntax, inspect the HTML, and report browser testing separately. If DOM/browser verification cannot run, leave it pending and do not claim the UI change stable.

## 32.5 Implementation and verification — 2026-09-27

The 0.7.1 candidate adds the oven through immutable Content and the established generic engine/UI. The existing four upgrades and eight progression steps are preserved. The ×10 price is computed once per render and shared by button text, accessible label and enabled state. Existing cards stay mounted while values update. The loop keeps 0.25 s rendering and saves at about 5 s of active simulated time. Pending progress is also saved on pagehide/hidden as a best-effort operation; a failed save remains the Persistence system's responsibility.

The five initial oven core tests were observed failing against 0.7 before the content change; the lifecycle integration assertion also failed before its handler was added. Then all tests passed. One additional import compatibility case was added during audit. Node syntax checks passed. Core/regression: **152/152** (146 original + six oven cases). A deterministic loop test observed 20 renders and one autosave across 5 s of simulated frames. Focused jsdom integration: **22/22** assertions across startup diagnostics, rendered cards, visible batch cost and accessible label, exact-cost single purchase, batch purchase, derived CPS, compatibility of an old v4 save, unchanged progression, keyboard shortcut isolation, pagehide checkpoint, failed save retry and hidden-tab checkpoint. The earlier 58 DOM scenarios from the 0.7 report were not available as a standalone script to rerun; their covered subsystems retain the original 146 embedded regression tests, and this release does not claim to rerun those 58. No actual mobile browser or native screen reader was used.

Risk: an abrupt termination without pagehide/visibilitychange can lose approximately five seconds of recent progress. The prior multi-tab, storage, clock and precision limitations still apply. A direct attempt to open the local HTML file in the available cloud browser was rejected by its security policy because `file:` URLs are blocked; no indirect route or bypass was attempted. Therefore the browser gate remains open despite the passing jsdom integration. Any long gameplay expansion requires separate balancing and save tests. Next: real browser/mobile inspection of the 0.7.1 layout, batch price wrapping, buying an oven and reloading a saved game; then choose a small progression or balancing milestone based on the observation. This section is the current next-action authority.
