# Long-horizon mastery reporting

O6.3 measures how the current U.S. Memory Trail item-state model evolves over 200 deterministic sessions. It is reporting infrastructure, not a new mastery model and not evidence that the current thresholds are pedagogically correct.

## Run the report

```sh
npm run report:long-horizon-mastery
```

The command runs six matched planner seeds across near-perfect, single-weak-item, regional-weakness, mixed, and seeded-random profiles. It writes:

- `reports/us-long-horizon-mastery.md`: mastery curves, milestones, diagnostic histories, broad-competence analysis, review load, persistent weakness, regional results, and open questions;
- `reports/us-long-horizon-mastery.json`: machine-readable run inputs, checkpoint details, item histories, review sessions, descriptive aggregates, and validation fields.

The focused automated check is `scripts/check-long-horizon-mastery-report.mjs`; it also runs through `npm test`.

## What “mastered” currently means

The reporter reads the production U.S. Memory Trail `status` field. The planner currently transitions an item to `mastered` when cumulative correct responses are at least 7, the current correct streak is at least 4, and the item has been seen at least 4 times. A later miss can move a mastered item back to `review`, so mastery is not necessarily absorbing. These rules remain owned by `src/united-states-memory-trail-planner.js`; the reporter observes their output rather than duplicating them.

The source planner's valid statuses are `unseen`, `introduced`, `learning`, `review`, and `mastered`. It does not currently emit a distinct `relearning` status. O6.3 still reports a relearning column, which remains zero unless the production model begins exposing that status.

## Item mastery versus broader accomplishment

U.S. Memory Trail state contains per-item progress, current curriculum position, and session data. It does not persist a separate state meaning “the learner has demonstrated broad knowledge of the United States,” nor does it define a full error-free pass across the current curriculum. A helper can derive completion only when every item is `mastered`; that is not a distinct journey/domain accomplishment.

The report therefore distinguishes:

- all items encountered or introduced;
- at least one correct demonstration per item;
- current scheduler mastery status;
- unavailable broader domain-completion evidence.

It does not invent the missing state or recommend its design.

## Measurements and limits

At sessions 25, 50, 75, 100, 150, and 200, the report records status counts, mastery percentage, encounter/correct/miss summaries, streak distribution, stability, retrievability, due backlog, review backlog, and regional mastery. Milestones cover first mastery, complete introduction, and 25/50/75/90/95/100% mastery.

Diagnostic histories cover Ohio, Wyoming, Maine, Hawaii, and Augusta. Post-introduction analysis separates selection reasons, candidate competition, and Census-region pressure.

Limitations:

- Synthetic answers are not human learning or forgetting.
- Matched seeds improve comparison but do not create a human randomized experiment.
- Selection eligibility is reconstructed from Selection Trace candidate pools.
- A 200-session horizon can show unreached milestones but cannot prove they are impossible.
- Lower review load, faster mastery, or convergence is not automatically better pedagogy.
- Journey, Daily Trail, Mental Map, reconstruction, and atlas evidence are not part of this item state.
