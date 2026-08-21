# Neutral U.S. selection balance

This verifier addresses the Definition-of-Done neutral-selection requirement for the production U.S. Memory Trail planner.

Run:

```sh
npm run report:neutral-selection-balance
```

The verifier constructs a read-only state in which all 100 state/capital items are introduced and have identical review status, counts, difficulty, stability, retrievability, due session, and last-seen session. It then requests 1,000 independently seeded cumulative-review plans, producing 10,000 selections without feeding results back into the state.

The generated Markdown and JSON reports compare each Census region's selection share with its share of eligible items. They also compare states with capitals and report the minimum and maximum per-item selections plus any never-selected item.

The focused check proves exact replay, input immutability, the 10,000-selection floor, the ±20% regional and item-type bounds, and absence of an eligible item with zero selections:

```sh
npm run check:neutral-selection-balance
```

This is a neutral equal-state test, not a learner trajectory. The U.S. Memory Trail planner selects items before the downstream prompt form, so it cannot establish locating-versus-identifying prompt-form balance. It also does not cover activities outside U.S. Memory Trail. Adaptive non-uniform behavior under weakness is measured separately by the matched-seed and long-horizon reports.
