# Owned-card deck drafts and retail baseline comparison

The full-deck builder produces an unverified draft constrained by owned quantities. It does not prove competitive performance. The former Steven/Metagross-specific fixed recipe has been removed: reproducing a retail product is not a newly discovered strategy.

## Behavior

- Build only from owned cards, including energy; enforce 60-card size and same-name copy limits. Leave a partial draft with errors when supported cards are insufficient.
- Follow owned evolution chains without skipping a missing stage. Trainer-owned evolution names remain within the same trainer family.
- Check printed attack energy costs. Trainer selection uses a limited role allowlist. Ability effects, additional attack conditions, special-energy effects and tactical synergy are not interpreted.
- From the full-deck sheet, choose a retail baseline explicitly using **시판덱과 비교**. The comparison uses the 11 lists in `starter_deck_presets.json`, not every product in the catalog and not purchase history.
- Show overlap, added and removed quantities, baseline inventory shortages, and current-deck validation errors. Cosmetic prints with identical stored functional fields count as the same card; same-name cards with different skills remain distinct. Incomplete metadata may under-match equivalent prints.
- Label identical compositions **기존 시판덱과 동일** and valid changed compositions **시판덱 대비 변경안 · 성능 개선 미검증**. Invalid compositions get a validation label. Identical composition and sufficient ownership are separate checks.
- Comparison is read-only: it neither registers retail products nor modifies inventory or the deck.

## Measurements and limits

Comparison shows exact hypergeometric probabilities of at least one basic Pokemon, basic energy, or recognized draw supporter in the first seven cards before mulligans. The draw-supporter category uses the engine's limited allowlist. Inclusion does not establish that an effect is usable, useful or stronger.

The separate seeded Monte Carlo button samples initial hands. Neither measurement models effects, turns, opponents, win rates or tournament legality. No improvement ranking is inferred from these numbers. Strategy optimization and battle simulation remain future work.

## Verification

`node --test tests/deck-engine.test.js` — 19 tests, including inventory constraints, evolution names, alternate-print handling, invalid inputs, deterministic sampling, exact baseline probabilities and read-only UI comparison.

`node --check app.js` and `node --check deck-engine.js` check syntax. Tests use synthetic inventories and public card data; private collection data is not committed.

## Pokemon type selection

The 60-card auto-build modal now provides a separate multi-select Pokemon type control and a **선택한 타입으로 60장 구성** button. The existing basic-card browsing filter remains independent. The new action evaluates owned basic starting points, prioritizes representation of selected types, then complete 60-card drafts and filled slots. This ranking is not a performance score.

Every Pokemon, including evolution stages, must have a selected type. Energy selection follows attack costs, not the Pokemon's printed type. Compatible basics are used to represent additional selected types; unavailable or incompatible types are explicitly reported. Different-type evolution prerequisites are not exempt from the restriction. Type ratios and arbitrary mixed-energy attack plans are not supported. Insufficient inventory may produce a partial draft; no unowned cards are added. A failed empty proposal preserves the current deck.

Validation after this addition: 23 tests pass. New tests cover mono-type exclusion, mixed-type representation, empty/unknown/unavailable types, inventory immutability, distinct attack energy types, and evolution-stage restrictions. The prior private inventory snapshot was unavailable for this iteration, so this addition was tested with synthetic inventories. Browser end-to-end verification remains outstanding.
