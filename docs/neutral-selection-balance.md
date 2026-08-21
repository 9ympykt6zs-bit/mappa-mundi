# Neutral U.S. selection balance

This verifier addresses the Definition-of-Done neutral-selection requirement for the production U.S. Memory Trail planner.

Run:

```sh
npm run report:neutral-selection-balance
```

The verifier constructs a read-only state in which all 100 state/capital items are introduced and have identical review status, counts, difficulty, stability, retrievability, due session, and last-seen session. It then requests 1,000 independently seeded cumulative-review plans, producing 10,000 selections without feeding results back into the state.

The generated Markdown and JSON reports compare each Census region's selection share with its share of eligible items. They also compare states with capitals, report the minimum and maximum per-item selections plus any never-selected item, and exercise the production prompt selector for 10,000 ordinary-review prompts and 10,000 early-chunk prompts.

The focused check proves exact replay, input immutability, the 10,000-selection floor, the ±20% regional and item-type bounds, absence of an eligible item with zero selections, and locating/identifying prompt-objective shares within ±20% of their intentional profile targets. Ordinary review targets a 50/50 mix; early-chunk support intentionally favors the easier locating form at 70/30.

```sh
npm run check:neutral-selection-balance
```

This is a neutral equal-state test, not a learner trajectory. It covers U.S. Memory Trail item selection and the extracted production prompt selector, but not objective balance across Journey, Mental Map, Connections, reconstruction, or other activities. Adaptive non-uniform behavior under weakness is measured separately by the matched-seed and long-horizon reports.
