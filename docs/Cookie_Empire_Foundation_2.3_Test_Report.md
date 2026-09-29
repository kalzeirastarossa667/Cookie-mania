# Cookie Empire — Foundation 2.3 Test Report

Date: 2026-09-29 UTC  
Baseline: Foundation 2.2 Rayonnement + multi-prestige observatory.

## Scope

Foundation 2.3 separates lifetime prestige power from the future spendable wallet without adding a shop or changing any economy constant.

- `prestigePoints`: lifetime Rayonnement; still drives the permanent multiplier.
- `prestigeCurrency`: available Éclats; authoritative HugeNumber reserved for future spending.
- Save schema: v6.
- v5 migration: available wallet is seeded from existing lifetime prestige points.
- v1–v4 migration: both prestige values start at zero.
- Prestige reward credits both totals independently.
- Full New Game clears both.

## Red → green evidence

The initial seven 2.3 regression cases were added before implementation. Foundation CI failed at **190/196**, with the missing wallet/migration/v6/reset behaviors exposed while prior coverage remained intact.

After implementation, three historical exact-schema assertions still described v5. They were migrated to the v6 authoritative field list without removing derived-cache exclusions.

A second adversarial review found a persistence invariant gap: v6 accepted a canonical `prestigeCurrency` larger than lifetime `prestigePoints`. A dedicated red run reproduced this as **196/197** with only the new invariant test failing. V6 decode now rejects a wallet larger than lifetime Rayonnement.

## Automated verification

Final instrumented Foundation run:

- **197/197 Foundation cases passed**
- targeted interface checks passed
- **56/56 Constellation/Horizons DOM checks passed**
- deterministic cadence unchanged
- balance observatory passed
- first 2-click/s threshold remained **31,388 s**
- tenth repeated threshold remained **16,427 s**
- no pacing constant changed

The balance observatory now clones `prestigeCurrency` as authoritative state. It remains outside routine `npm test` after the dedicated measurement run.

Playwright coverage verifies the prestige action in Chromium desktop and Pixel 5 emulation, including visible lifetime Rayonnement, visible available Éclats, v6 persistence and values surviving reload.

## Remaining limits

Browser emulation is not a physical-phone test. The wallet is intentionally not spendable yet; Foundation 2.3 establishes safe currency semantics before any prestige shop. Human long-play balance remains distinct from deterministic observatory measurements.
