# Experimental demonstrated-progress scores

This harness is a design investigation. No candidate score is production-authoritative, persisted in learner state, used for review priority, or displayed to learners.

The product construct under investigation is:

> How strongly has this learner demonstrated that they can currently perform this specific knowledge skill?

That construct is intentionally separate from U.S. Memory Trail item mastery, retention scheduling, due state, and broader journey completion.

## Run the experiment

```sh
npm run report:progress-score-experiment
```

Outputs:

- `reports/experimental-progress-score-comparison.md`: formulas, canonical trajectories, focused behavioral comparisons, synthetic examples, perfect-pass implications, tradeoffs, and a non-production recommendation;
- `reports/experimental-progress-score-comparison.json`: parameters, every trajectory, synthetic-profile summaries, regional comparisons, validation, and machine-readable recommendations.

The focused check is `scripts/check-progress-score-comparison.mjs`; it also runs through `npm test`.

The synthetic integration replays U.S. Memory Trail item/mode histories as stand-in skill streams. Production does not yet expose a unified place-by-skill evidence architecture that separately represents Ohio location, identification, capital relationship, regional relationship, and every other taxonomy skill. This harness compares formulas without claiming that missing integration already exists.

## Candidate models

- **Weighted evidence:** fixed correct gain, incorrect loss, small streak bonus, and clamping. It is the simplest baseline, but clamping loses evidence depth.
- **Bayesian evidence:** a provisional Beta prior plus correct/incorrect evidence counts. It is interpretable and preserves the full evidence history, but its prior is not calibrated.
- **BKT-inspired:** guess/slip likelihoods and a learning transition with no forgetting. It models latent knowledge more than demonstrated progress and saturates rapidly under the provisional parameters.
- **Current-system proxy:** a read-only projection of correctness ratio, correct streak, and correct-evidence volume. It deliberately excludes stability, retrievability, difficulty, status, and time rather than claiming those scheduler fields measure demonstrated skill.

All formulas, parameters, and score bands are provisional.

## Absence and retention

None of the candidates changes solely because time passes. The canonical long-absence histories preserve their pre-gap scores until a new response arrives.

This is deliberate, not a claim that forgetting does not occur. Review urgency and retention confidence belong to the scheduler or to a separately labeled retention model. No optional retention score was added because deriving one from a response-only canonical history would require invented stability/time assumptions.

## Current recommendation

Bayesian evidence is the most promising candidate for one further non-production prototype because lucky guesses remain reversible, accumulated success remains visible, and the update can be explained as prior plus evidence.

The BKT-inspired model should not advance as the visible demonstrated-progress bar in its current form: its learning/no-forgetting assumptions saturate quickly and answer a latent-knowledge question. Weighted evidence remains a baseline; the current-system projection remains a diagnostic comparison.

This recommendation does not authorize production wiring. Questions about priors, question-specific guessing, evidence sharing across activity types, score bands, breadth requirements, and recency remain unresolved.
