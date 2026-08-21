# Neutral U.S. selection balance

This verifier addresses the Definition-of-Done neutral-selection requirement for the production U.S. Memory Trail planner.

Run:

```sh
npm run report:neutral-selection-balance
```

The verifier constructs a read-only state in which all 100 state/capital items are introduced and have identical review status, counts, difficulty, stability, retrievability, due session, and last-seen session. It then requests 1,000 independently seeded cumulative-review plans, producing 10,000 selections without feeding results back into the state.

The generated Markdown and JSON reports compare each Census region's selection share with its share of eligible items. They also compare states with capitals, report the minimum and maximum per-item selections plus any never-selected item, exercise the production prompt selector for 10,000 ordinary-review prompts and 10,000 early-chunk prompts, and run controlled mastered-item pressure probes through the production planner.

The focused check proves exact replay, input immutability, the 10,000-selection floor, the ±20% regional and item-type bounds, absence of an eligible item with zero selections, and locating/identifying prompt-objective shares within ±20% of their intentional profile targets. Ordinary review targets a 50/50 mix; early-chunk support intentionally favors the easier locating form at 70/30. In a separate mixed-pressure setup, 70 future-due mastered items receive no session slots while 30 due review items are available. When all 100 mastered items are due, every item remains selectable and appears during the 200-plan probe.

The report runs through the production cumulative fairness lane. After its introduction, all 100 neutral items still receive selections, Census-region shares remain within about −1.94% to +0.66% of eligible share, and state/capital shares remain within 1% of their eligible shares.

```sh
npm run check:neutral-selection-balance
```

This is a neutral equal-state test, not a learner trajectory or a mathematical proof that starvation is impossible over an unbounded horizon. It covers U.S. Memory Trail item selection and the extracted production prompt selector, but not objective balance across Journey, Mental Map, Connections, reconstruction, or other activities. Adaptive non-uniform behavior under weakness is measured separately by the matched-seed and long-horizon reports.
