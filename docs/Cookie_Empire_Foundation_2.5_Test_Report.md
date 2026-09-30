# Cookie Empire — Foundation 2.5 Éclat Shop — Test Report

Date: 2026-09-30 UTC
Baseline: Foundation 2.4 Synergies (`c48b0b7d531eec14bab1dd6d0485d3390498ad6c`).

## Scope

Foundation 2.5 gives the separated Éclat wallet its first spendable use. Three permanent, data-driven purchases are introduced: Impulsion radiante (1 Éclat, click ×1.10), Fours rayonnants (2 Éclats, global CPS ×1.10), and Résonance harmonique (4 Éclats, ×1.05 CPS/click when at least one Foundation 2.4 research synergy is active). Spending never reduces lifetime Rayonnement.

The authoritative permanent ownership is `ownedPrestigeUpgrades`. Save schema advances to v7; v6 migrates with an empty permanent shop. Derived multipliers are not persisted.

## Red → green

The six initial 2.5 tests were committed before implementation at `d5678b27722eb1c134a4ed15daf0022a06977e74`. CI produced **203/209**, with exactly the six new contracts failing while all 203 Foundation 2.4 cases stayed green.

After the core implementation, **204/209** passed; the five failures were historical exact-schema assertions still requiring v6. They were migrated to v7 while retaining exact authoritative-field and no-derived-cache checks. Adversarial coverage was then expanded for exact effects, bounded resonance with multiple synergies, neutral resonance without a synergy, derivation-failure atomicity, invalid saved ownership/dependency order, and New Game clearing.

Final Foundation target: **214/214** plus existing interface and 56 Constellation/Horizons DOM checks.

## Balance observatory

The real analyzer now carries `ownedPrestigeUpgrades` when cloning state. The no-shop-spending path remains identical to Foundation 2.4: fresh 2 clicks/s **25,141 s**, fresh 5 clicks/s **10,969 s**, one Rayonnement + 2 clicks/s **22,821 s**. Balance observatory: PASS. This proves the schema/shop introduction does not silently alter players who buy nothing; it is not an optimal-spending model for the new shop.

## Browser verification

Playwright coverage was extended with a controlled permanent-purchase path on both desktop Chromium and Pixel 5 emulation. The first run found an ambiguous test locator because the same data attribute existed on the shop card and its button; all six historical browser scenarios passed. The test was corrected to target the button explicitly without changing runtime behavior. Final browser result must be recorded after the corrected HEAD completes.

## Remaining limits

The shop contains only three purchases. Its factors are deliberately small and should receive human long-play observation before expansion. Physical-phone testing remains separate from Pixel 5 browser emulation. Multi-tab synchronization remains outside this milestone.
