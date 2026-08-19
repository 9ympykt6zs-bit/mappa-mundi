# Canonical learning evidence contract v1

This is the read-only validation slice that follows the A1 design audit. It defines a small vocabulary for describing U.S. learning evidence without creating shared persistence, changing learner state, or changing any planner, score, threshold, or mode behavior.

## Contract

The contract separates:

- a geographic entity, such as `state:ohio`;
- a learning concept, such as `state-location:ohio` or `state-naming:ohio`;
- the performed skill, such as `locating` or `identifying`;
- one immutable evidence event from one learner attempt.

The v1 skills are locating, identifying, recognition, relationship recall, sequencing, and spatial reconstruction. The v1 outcomes are correct, incorrect, partial, assisted, and skipped.

`conceptId + skillId` is the intended evidence aggregation key. Source mode, activity, session, and response metadata preserve provenance without changing concept identity.

## Historical aggregates are not events

Daily Trail and U.S. Memory Trail currently persist aggregate correct and miss counters. They do not retain a lossless chronological attempt history or prompt-specific skill attribution. Their read-only adapter therefore produces an aggregate summary that lists both possible concept/skill mappings and explicitly marks skill attribution unavailable.

The adapter does not invent event IDs, attempt IDs, timestamps, or individual responses.

## Validated Ohio mappings

The focused check verifies:

- Journey and U.S. Memory Trail `name_to_place` responses both map to `state-location:ohio + locating`;
- `place_to_name` maps separately to `state-naming:ohio + identifying`;
- guided exposure maps to `assisted`, not correct retrieval;
- existing Daily Trail totals remain a combined aggregate summary;
- a Lake Erie Mental Map response maps to relationship recall and preserves explicit partial credit;
- ordered Mental Map responses use sequencing;
- Ohio's reconstruction placement maps to `state-reconstruction:ohio + spatial-reconstruction` and preserves close/partial semantics;
- all state location and naming IDs reuse the existing O1 content-inventory identities.

Run the focused check with:

```sh
node scripts/check-canonical-learning-evidence.mjs
```

It also runs automatically through `npm test` because the fast baseline discovers every `scripts/check-*.mjs` file.

## Explicit boundaries

This slice does not:

- persist canonical events;
- emit events from production gameplay;
- reduce events into mastery or scheduler state;
- migrate historical learner data;
- change the Progress Report or Learning Inspector;
- decide how partial evidence affects Bayesian demonstrated progress;
- implement A2.
