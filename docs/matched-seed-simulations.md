# Matched-seed simulation matrix

O6.2 compares synthetic U.S. Memory Trail learners while holding planner randomness, starting state, and simulated time constant. Its purpose is to separate changes consistent with learner answers from changes caused by a different deterministic tie-breaking order.

## Run the report

```sh
npm run report:matched-seed-simulations
```

The command runs 12 planner seeds across five profiles—near-perfect, single weak item, regional weakness, mixed, and seeded random—for 60 sessions each. Twelve seeds are enough to reveal obvious ranges and outliers without turning this first descriptive report into a large statistical framework.

Outputs:

- `reports/us-matched-seed-simulations.md`: executive summary, seed matrix, pairwise comparisons, regional analysis, mastery/progression, seed sensitivity, and open questions;
- `reports/us-matched-seed-simulations.json`: compact machine-readable inputs, per-run metrics, diagnostic items, pairwise deltas, descriptive aggregates, and validation fields.

## Seed separation

Each matched group has one planner seed. Every profile in that group receives the exact same planner seed, so U.S. Memory Trail's seeded tie-breaking is held constant.

The group also has a separate deterministic answer seed. Regional-weakness, mixed, and random profiles consume this answer stream; rule-only profiles such as single-weak-item do not. Sharing the answer stream within a group provides common deterministic draws while the profile's response rule changes. The answer seed is never passed to the planner.

Existing simulation calls that provide only `seed` preserve the prior behavior: planner sessions use `${seed}:planner:<session index>` and answers use `${seed}:answers`.

## Measurements

Every matrix cell records:

- progression: introduced and encountered items, selections, correct/incorrect results, first complete introduction, first mastery, and mastered counts at checkpoints;
- adaptation: new/review/reason-bucket counts, repeated selections, maximum eligibility deferral, and unresolved deferrals;
- regional behavior: introduced items, inferred candidate opportunities, selections, review/weak-review selections, error rate, and selection per opportunity;
- diagnostic items: Ohio, Wyoming, Massachusetts, and Georgia;
- matched deltas from the near-perfect profile to single-weak-item, regional-weakness, and mixed profiles.

Aggregates are medians and ranges. Null milestones are excluded from numeric milestone distributions and remain explicitly null in per-run data.

## What it can show

When the same pairwise direction appears across matched planner seeds, the result is consistent with an answer-driven effect under the scripted profiles. Ranges show how much the observed metric varies with planner seed. Candidate-opportunity normalization can distinguish raw regional encounter totals from the size of reconstructed planner pools.

## What it cannot show

- Matched deterministic simulations are not randomized experiments with human learners.
- The report does not decide whether a measured effect is pedagogically desirable.
- Eligibility is inferred from Selection Trace candidate-pool reconstruction. Items outside emitted pools are not called eligible.
- The planner does not retain the exact comparator clause that resolved every tie or a single cross-bucket score.
- A finite 60-session window cannot prove long-run convergence or absence of starvation.
- The matrix covers U.S. Memory Trail, not Daily Trail, UI interactions, response time, or human forgetting.

The checks in `scripts/check-matched-seed-simulation-matrix.mjs` verify seed matching/separation, exact replay, seed-sensitive valid trajectories, aggregation math, JSON serialization, fixture immutability, and unchanged planner output. Passing checks verify the reporting machinery, not the adaptive algorithm's educational correctness.
