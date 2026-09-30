# Cookie Empire — Foundation 2.9 Visual Guidance Specification

Date: 2026-09-30  
Baseline: Foundation 2.8.3 Menu, merged and deployed  
Runtime status: specification only; no 2.9 gameplay/UI implementation in this document

## Goal

Make Cookie Empire easier to understand and more attractive without changing its economy. The first implementation slice focuses on generator clarity because the current generator cards expose numbers but do not carry explanatory Content metadata.

## Architecture decision

Generator explanation becomes Content data through a required `description` field on all 16 `GENERATORS` definitions.

Mechanical values stay derived from Economy:
- effective CPS per unit: `generatorUnitCps`;
- effective click contribution per unit: `generatorUnitClick`;
- stack totals: derived from unit values × owned count;
- costs, batches, Max and wait: existing Economy functions;
- specialization hints: derived from `UPGRADES[*].requiresGenerator`.

The UI displays these values but never owns their formulas. No new save field or migration is planned; save schema remains v7.

## Mobile information hierarchy

Always visible:
- generator name and icon;
- one-sentence description;
- owned count;
- effective production per unit;
- next ×1 price;
- affordability/wait state.

Expandable details:
- total production of the owned stack;
- total click contribution of the owned stack;
- share of automatic production when meaningful;
- next-unit gain;
- next generator-bound specialization/research gate.

The current ×1 / ×10 / Max controls stay prominent and at least 44 CSS px high.

## Visual direction

- original Cookie Empire galaxy identity;
- clearer hierarchy rather than more simultaneous decoration;
- four eras receive coherent semantic visual treatments;
- no copied proprietary assets/layouts;
- no color-only state;
- reduced-motion, contrast and focus behavior preserved;
- Foundation 2.8.2 bottom-nav and 2.8.3 settings-menu layering contracts remain mandatory.

## Performance contract

Generator DOM remains build-once/cache-and-update. New dynamic fields get cached references and are updated in place. Multipliers are derived once per render path and reused. No full list reconstruction per frame.

## Rollout

1. Generator clarity.
2. Research/prestige/objective guidance.
3. Visual polish and motion.

Runtime implementation should begin after physical Android confirmation of Foundation 2.8.3, unless the project explicitly decides that emulation is sufficient for that baseline.

The detailed source-of-truth contract and acceptance criteria are recorded in Master Dev File v3.0, section 53.
