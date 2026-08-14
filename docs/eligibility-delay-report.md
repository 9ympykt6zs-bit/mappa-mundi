# Eligibility delay reporting

The O6.1 report measures how long a U.S. Memory Trail item waits after it appears in a candidate pool for a selection slot the planner actually emits. It is read-only observability over deterministic simulations and O5.5 Selection Trace; it does not select items, change state, or adjust the planner.

## Run the report

```sh
npm run report:eligibility-delays
```

The command runs the six deterministic 36-session O4 learner profiles and writes:

- `reports/us-eligibility-delays.md`: human-readable summaries, high-delay items, and reason/region/type comparisons;
- `reports/us-eligibility-delays.json`: machine-readable item histories, eligibility episodes, selected events, aggregate analysis, and validation results.

The focused automated check is `scripts/check-eligibility-delay-report.mjs`; it also runs through `npm test`.

## Eligibility definition

Eligibility is **inferred** from the U.S. Memory Trail candidate pools reconstructed by Selection Trace using the planner's existing helpers. An item is counted as eligible in a session when it appears in a `new`, `weak-review`, `older-review`, `recent-review`, or `cumulative-review` pool for a slot emitted in that session.

This definition deliberately does not count:

- unseen items outside the active curriculum candidate pool;
- capital items whose state prerequisite is not satisfied;
- hypothetical pools for slots the planner did not emit;
- Daily Trail rejected candidates, because Daily Trail does not expose its discarded full pool.

Eligibility and selection are separate events. An item can be eligible in more than one pool in one session, but a selection is credited only to the pool recorded by its Selection Trace.

## Delay measurements

For every stable curriculum item, the JSON report includes:

- all eligible sessions and the pool/signal details for each;
- all selected sessions and eventual reason buckets;
- first eligible and first selected sessions, or an explicit `unavailable` field;
- consecutive eligible-but-not-selected episodes;
- maximum resolved, unresolved, and overall observed deferral;
- average delay for episodes that end in selection;
- total and maximum consecutive selections.

An eligibility episode ends when the item is selected, becomes ineligible, or the report window ends. A zero delay means the item was selected in the same session it became eligible. An unresolved delay means the item stopped being eligible without selection or remained eligible at the report boundary.

Reason-signal aggregates are mutually exclusive in this order: new item, weak review, due review, recent review, older review, other review. Planner-pool aggregates remain separate and can count the same item in multiple pools during one session; their selection totals still credit only the actual selected pool.

## What the report can establish

- A candidate was repeatedly eligible but deferred.
- A weak item repeatedly won a review slot rather than waiting.
- Candidate opportunities and selections differ by planner bucket, Census region, or item type.
- Deterministic replays produce identical histories.
- A selected item appeared in an eligibility pool for that session.

## What it cannot establish

- That a long delay is a bug or a short delay is good pedagogy.
- Permanent starvation from a finite 36-session window.
- Why a curriculum-blocked unseen item was not globally eligible beyond the planner's current rules.
- The exact comparator clause that broke every pairwise tie.
- Whether region-level differences are intentional; the planner adapts to item state and does not apply a Census-region weight.
- Daily Trail eligibility delay until its rejected candidate pools become inspectable.

The report should therefore be read as behavioral evidence, not an acceptance verdict.
