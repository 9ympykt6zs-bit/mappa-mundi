# Deterministic learner simulations

The O4 simulation harness drives the existing U.S. Memory Trail and Daily Trail planners with fixed seeds, fixed clocks, and explicit synthetic answer behavior. It is evidence infrastructure: it exposes what the current planners do, but it does not tune them or certify that their behavior is pedagogically correct.

## Run the simulations

```sh
npm run report:learner-simulations
```

This generates:

- `reports/us-learning-simulations.md`: a compact human-readable review report;
- `reports/us-learning-simulations.json`: machine-readable session summaries, final states, selection explanations, and before/event/after Learning Inspector transitions.

The fast automated baseline also runs `scripts/check-learner-simulations.mjs`:

```sh
npm test
```

## Learner profiles

| Profile | Scripted behavior |
| --- | --- |
| Perfect | Correct except for a rare, deterministic miss. |
| Single weak item | Always misses Ohio and answers other encountered items correctly. |
| Forgetting | Learns initially, advances the injected clock 45 days, then deterministically misses some previously seen items after returning. |
| Regional weakness | Strong Northeast responses and weaker Midwest responses, using the Census region attached by the canonical U.S. atlas data. |
| Mixed | Region-dependent performance, lower capital accuracy, occasional errors, and a 45-day return gap. |
| Seeded random | Stochastic-looking responses from a deterministic 55% success stream. |

The full profiles drive `planUnitedStatesMemoryTrailSession()` and `applyUnitedStatesMemoryTrailSessionResults()` over the production-derived 50-state/50-capital curriculum. Every selected item is passed through the existing Learning Inspector adapters. The runner does not copy planner ranking, scheduling, progression, or mastery logic.

The forgetting report also includes a narrow Daily Trail completed-review probe over controlled existing progress. This exercises Daily Trail's injected date and its production review selector. It is kept separate because Daily Trail and U.S. Memory Trail do not currently share learner state.

## Reading the reports

Summary counts describe sessions, encounters, accuracy, Census-region distribution, item categories, and final planner state. Selected checkpoints include Inspector before/event/after snapshots and changed fields. Selection explanations report emitted plan buckets and existing priority fields; they do not invent rejected-candidate rankings that the planners do not retain.

Health checks are diagnostics:

- starvation checks only already-introduced items that were never encountered;
- repeated exposure flags unusually frequent encounters of strong items with no recorded misses;
- inability to progress detects a flat introduced-item count across the final five sessions while unseen curriculum remains;
- impossible transitions checks basic count invariants;
- replay checks compare identical seeded executions.

A warning is a prompt for investigation, not an assertion that the algorithm is wrong. Conversely, no warning is not proof of correctness.

## Current measurement limits

- U.S. Memory Trail review scheduling is session-based. Advancing the injected wall clock is recorded and replayable, but does not itself make an item due.
- Daily Trail uses calendar dates, but the controlled return probe is an explicit completed-trail review; it is not a unified-state simulation with U.S. Memory Trail.
- Selection Trace reconstructs the candidate bucket for each emitted U.S. Memory Trail slot. It exposes considered alternatives and existing priority fields, but not the exact comparator clause that broke each tie, cross-bucket competition, or a single numeric score.
- Item categories are the production `states` and `capitals` categories. The runner does not infer richer `US_CONTENT_TAXONOMY.md` concepts that the item data does not carry.
- Simulated correctness is an answer script, not a model of response time, UI interaction, audio, map behavior, or human memory.
- The reports observe 36-session windows. They do not establish long-horizon convergence or absence of starvation across every eligible item.

## Evidence status

- **Implemented:** runner, production-derived fixture adapter, six profiles, Daily Trail return probe, Markdown/JSON report generation, and Inspector capture exist.
- **Automatically tested:** same-input replay, seed variation, all required profiles, JSON serialization, fixture immutability, and the return probe run in the fast baseline.
- **Verified:** not implied by passing checks. A human must review generated behavior against the Definition of Done and record acceptance or defects.

## Eligibility delay analysis

O6.1 reuses the full in-memory Selection Traces from these simulations to measure candidate deferral without changing planner behavior. Run `npm run report:eligibility-delays` and see [`eligibility-delay-report.md`](eligibility-delay-report.md) for definitions and limitations.

## Matched-seed comparisons

O6.2 holds the U.S. Memory Trail planner seed, empty starting state, and simulated time schedule constant while changing only the synthetic learner-response profile. Planner and answer randomness are separate dependencies: stochastic-looking answer profiles use a deterministic answer seed that cannot change planner tie-breaking. Within each matched group, the same answer seed is shared across profiles; profiles that do not consume randomness simply ignore it.

Run the 12-seed, five-profile, 60-session matrix with:

```sh
npm run report:matched-seed-simulations
```

This generates `reports/us-matched-seed-simulations.md` and `reports/us-matched-seed-simulations.json`. See [`matched-seed-simulations.md`](matched-seed-simulations.md) for measurements, interpretation, and limits.

## Long-horizon mastery

O6.3 extends the same deterministic U.S. Memory Trail profiles through sessions 25, 50, 75, 100, 150, and 200:

```sh
npm run report:long-horizon-mastery
```

It generates `reports/us-long-horizon-mastery.md` and `reports/us-long-horizon-mastery.json`. The report measures the current item-level status model, milestone timing, diagnostic item histories, post-introduction review load, and regional mastery without changing or endorsing the model. See [`long-horizon-mastery.md`](long-horizon-mastery.md).
