# Cookie Empire — Foundation 2.6 Shop-Aware Balance Report

Date: 2026-09-30 UTC
Baseline: Foundation 2.5 Éclat Shop on main at `3f996daa4ada82b500c0766644e5ea3c97ca1822`.

## Purpose

Foundation 2.6 changes no player-facing runtime behavior. It extends the deterministic balance observatory so permanent Éclat spending can be measured before the prestige tree grows.

## Red → green evidence

The red version temporarily ran the analyzer in CI. The existing game suite passed **214/214**, then the analyzer failed only with `2.6 RED: observatoire sans politique de dépense Éclats`. This proves the pre-existing game foundation stayed green and the missing behavior belonged to the diagnostic model.

The green analyzer implements two explicit policies. `hold` buys nothing. `sequential` spends through `GameEngine.buyPrestigeUpgrade` only, in catalogue order whenever the authoritative quote is available. Direct wallet or ownership mutation is forbidden by the model.

## Measured 10-cycle series at 2 clicks/s

Hold seconds: **25,141 · 22,828 · 20,923 · 19,256 · 17,888 · 16,699 · 15,658 · 14,700 · 13,866 · 13,148**.

Sequential seconds: **25,141 · 21,029 · 19,237 · 17,523 · 16,271 · 15,165 · 14,208 · 12,723 · 12,025 · 11,403**.

Sequential purchases occur after cycle 1 (Impulsion radiante, wallet 1.01 → 0.01), after cycle 3 (Fours rayonnants, 2.02 → 0.02), and after cycle 7 (Résonance harmonique, 4.04 → 0.04). Cycle 10 is about **13.3% faster** than hold. After the complete shop is acquired, cycle 8 is about **13.4% faster** than hold.

## Guardrails verified

Hold retains the Foundation 2.5 reference exactly. Cycle 1 is identical across policies. Every shop purchase uses the engine transaction, debits the exact catalogue cost, leaves lifetime Rayonnement unchanged, preserves prerequisite order and monotonic ownership, and keeps the wallet between zero and lifetime Rayonnement. Full balance observatory: **PASS**.

## Interpretation and limits

The three current permanent purchases produce a noticeable but controlled acceleration in this deterministic policy over ten cycles. The model is not a claim about optimal human play. It does not yet search all possible spending timings or compare alternative future branches. No runtime file, save schema, UI, economic factor or content definition is changed by Foundation 2.6; therefore the existing Foundation 2.5 browser verification remains the runtime baseline.

The next prestige expansion should prefer choices and interactions over larger unconditional global multipliers, and should be evaluated against this hold/sequential framework before release.
