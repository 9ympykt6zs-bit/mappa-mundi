# Progress Report canonical-evidence shadow comparison

Generated from deterministic controlled fixtures at 2034-02-03T15:30:00.000Z.

## Executive summary

If the Progress Report were powered by canonical evidence, would it tell the same story as the current report? **Not unconditionally yet.** Across 16 item × skill cases, the shadow produced 11 exact matches, 1 semantic match, 3 intentional differences, 1 unavailable comparison, and 0 defects.

The shared Bayesian formula behaves identically when both paths receive equivalent correct/incorrect counts. Remaining differences are evidence-scope and historical-data policy questions rather than formula defects.

## Comparison table

| Scenario | Item × skill | Legacy result | Canonical shadow result | Verdict |
| --- | --- | --- | --- | --- |
| No Ohio location evidence exists. | state:ohio × state-locations | {"correct":0,"incorrect":0}; score=—; Not started | {"correct":0,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":0}; score=—; Not started | exact match |
| One correct Ohio location retrieval. | state:ohio × state-locations | {"correct":1,"incorrect":0}; score=0.5; Going well | {"correct":1,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":1}; score=0.5; Going well | exact match |
| Three correct Ohio location retrievals. | state:ohio × state-locations | {"correct":3,"incorrect":0}; score=0.666667; Strong | {"correct":3,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":3}; score=0.666667; Strong | exact match |
| One correct Ohio location followed by three misses. | state:ohio × state-locations | {"correct":1,"incorrect":3}; score=0.285714; Needs review | {"correct":1,"incorrect":3,"assisted":0,"partial":0,"skipped":0,"events":4}; score=0.285714; Needs review | exact match |
| Eight correct Ohio locations followed by one miss. | state:ohio × state-locations | {"correct":8,"incorrect":1}; score=0.75; Strong | {"correct":8,"incorrect":1,"assisted":0,"partial":0,"skipped":0,"events":9}; score=0.75; Strong | exact match |
| Two correct Ohio identification/name retrievals with no location evidence. | state:ohio × state-identification | {"correct":2,"incorrect":0}; score=0.6; Going well | {"correct":2,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":2}; score=0.6; Going well | exact match |
| Inspect Ohio location after identification-only evidence. | state:ohio × state-locations | {"correct":0,"incorrect":0}; score=—; Not started | {"correct":0,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":0}; score=—; Not started | exact match |
| One guided Ohio exposure with no retrieval response. | state:ohio × state-locations | {"correct":0,"incorrect":0}; score=—; Not started | {"correct":0,"incorrect":0,"assisted":1,"partial":0,"skipped":0,"events":1}; score=—; Not started | semantically equivalent |
| Locate Ohio correctly once in Journey and once in U.S. Memory Trail. | state:ohio × state-locations | {"correct":1,"incorrect":0}; score=0.5; Going well | {"correct":2,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":2}; score=0.6; Going well | intentional difference |
| Legacy planner combines one location correct and one identification miss; inspect location. | state:ohio × state-locations | {"correct":1,"incorrect":1}; score=0.4; Going well | {"correct":1,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":1}; score=0.5; Going well | intentional difference |
| Legacy planner combines one location correct and one identification miss; inspect identification. | state:ohio × state-identification | {"correct":1,"incorrect":1}; score=0.4; Going well | {"correct":0,"incorrect":1,"assisted":0,"partial":0,"skipped":0,"events":1}; score=0.25; Needs review | intentional difference |
| Two correct and one missed Columbus retrieval across both capital prompt forms. | capital:columbus-oh × state-capitals | {"correct":2,"incorrect":1}; score=0.5; Going well | {"correct":2,"incorrect":1,"assisted":0,"partial":0,"skipped":0,"events":3}; score=0.5; Going well | exact match |
| Legacy Ohio location history exists from before canonical emission began. | state:ohio × state-locations | {"correct":3,"incorrect":1}; score=0.571429; Going well | {"correct":0,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":0}; score=—; Not started | unavailable/not comparable |
| Reload one correct Ohio location from both persisted stores. | state:ohio × state-locations | {"correct":1,"incorrect":0}; score=0.5; Going well | {"correct":1,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":1}; score=0.5; Going well | exact match |
| Reset both scoped evidence stores and compare Ohio location. | state:ohio × state-locations | {"correct":0,"incorrect":0}; score=—; Not started | {"correct":0,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":0}; score=—; Not started | exact match |
| Submit one Ohio location action twice with the same event identity. | state:ohio × state-locations | {"correct":1,"incorrect":0}; score=0.5; Going well | {"correct":1,"incorrect":0,"assisted":0,"partial":0,"skipped":0,"events":1}; score=0.5; Going well | exact match |

## Representative examples

- **Locate Ohio correctly once in Journey and once in U.S. Memory Trail.** Canonical combines two actions measuring the same concept/skill across modes. The current Progress Report reads Memory Trail but not Journey, so it sees one correct response.
- **One correct Ohio location followed by three misses.** Skill-specific legacy counts and canonical concept-skill events provide identical Bayesian inputs and presentation.
- **Two correct Ohio identification/name retrievals with no location evidence.** Skill-specific legacy counts and canonical concept-skill events provide identical Bayesian inputs and presentation.
- **Legacy planner combines one location correct and one identification miss; inspect location.** Legacy combined counters give both state views 1 correct/1 miss. Canonical location correctly receives only the location response.
- **Legacy planner combines one location correct and one identification miss; inspect identification.** Legacy combined counters give both state views 1 correct/1 miss. Canonical identification correctly receives only the identification miss.

## Differences and unavailable history

- **journey-plus-memory-same-skill (intentional difference):** Canonical combines two actions measuring the same concept/skill across modes. The current Progress Report reads Memory Trail but not Journey, so it sees one correct response.
- **legacy-combined-prompt-location (intentional difference):** Legacy combined counters give both state views 1 correct/1 miss. Canonical location correctly receives only the location response.
- **legacy-combined-prompt-identification (intentional difference):** Legacy combined counters give both state views 1 correct/1 miss. Canonical identification correctly receives only the identification miss.
- **historical-legacy-only-location (unavailable/not comparable):** No historical canonical events exist, and the shadow does not fabricate them from legacy aggregates.

## Double-counting protection

One controlled user action was submitted twice with the same event identity. First insert: true; duplicate insert: false; repository events: 1; shadow correct count: 1; shadow raw-event provenance count: 1. The shadow reads legacy source stores: false. Reducer summaries are the only scoring input; raw events are not added again.

## Migration readiness

Safe now:

- Shadow/debug comparison for state location and identification canonical concept-skill streams
- Capital item-level shadow scoring when both canonical capital retrieval prompt forms are intentionally combined
- Canonical-first scoring from a clean cutover only when the included source modes and skill-sharing policy are explicitly matched

Still dependent on legacy evidence:

- Existing learner history that predates canonical emission
- Current scheduler/review-status fields
- Current combined state-practice behavior when no skill-specific legacy signal exists

- **Historical limitation:** Legacy aggregate counters cannot be losslessly separated into locating versus identifying attempts or converted into timestamped canonical events.
- **Brand-new learners:** Not safe as an unconditional canonical-first replacement. Journey evidence is canonical but absent from the current report, and legacy planner fallbacks deliberately share combined state counts across location and identification. A source/skill policy must be chosen and shadow-accepted first.
- **Existing learners:** Not safe. Existing legacy-only history would disappear unless a hybrid baseline/cutover strategy is designed; fabricating raw historical events is prohibited.

Recommendation: Keep the current read path. Continue developer-only shadowing, define source inclusion and legacy-baseline policy, then compare category-level outputs over a clean-cutover cohort before enabling canonical-first reads.

## Scope limits

- The controlled cases validate score/category parity, not Progress Report UI rendering.
- Canonical evidence does not reproduce scheduler due/review status.
- The comparison does not backfill or fabricate historical per-attempt events.
- Only state location, state identification, and item-level capital retrieval are included.
