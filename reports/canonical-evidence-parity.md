# Canonical vs legacy evidence parity validation

Generated from deterministic controlled fixtures at 2034-02-03T15:30:00.000Z.

## Executive summary

Where canonical evidence and legacy state describe the same learner behavior, do they agree? **Yes, for the comparable new-evidence paths covered here.** The report found 0 defects across 11 scenarios. It recorded 52 matching field comparisons, 3 intentional differences, and 1 unavailable/not-comparable fields.

This validates the canonical repository as a faithful read-only record of newly emitted evidence in the covered paths. It does not validate mastery formulas, adaptive selection, Progress Report scoring, historical backfill, or every gameplay path.

## Scenario table

| Mode | Action | Legacy result | Canonical result | Verdict |
| --- | --- | --- | --- | --- |
| Journey | Select Ohio, then place it on Ohio. | src/maplibre/activity-session.js (ActivitySession); {"itemId":"ohio","behavior":"locate Ohio","attempts":1,"correct":1,"incorrect":0,"completedIds":["ohio"]} | 1 event(s); concepts=state-location:ohio; skills=locating; outcomes=correct | match |
| Journey | Select Ohio, then place it on Michigan. | src/maplibre/activity-session.js (ActivitySession); {"itemId":"ohio","behavior":"locate Ohio","attempts":1,"correct":0,"incorrect":1,"selectedTargetId":"michigan"} | 1 event(s); concepts=state-location:ohio; skills=locating; outcomes=incorrect | match |
| U.S. Memory Trail | Miss Ohio twice, then locate Ohio correctly. | src/united-states-memory-trail-planner.js (itemProgress + lastSessionSummary); {"itemId":"state:ohio","behavior":"combined session result for Ohio","attempts":3,"correct":1,"incorrect":2,"timesSeen":1,"sessionId":"us-memory-trail:parity-session"} | 3 event(s); concepts=state-location:ohio; skills=locating; outcomes=incorrect, incorrect, correct | intentional difference |
| U.S. Memory Trail | Locate Ohio correctly in two consecutive sessions. | src/united-states-memory-trail-planner.js (itemProgress); {"itemId":"state:ohio","attempts":2,"correct":2,"incorrect":0,"timesSeen":2} | 2 event(s); concepts=state-location:ohio; skills=locating; outcomes=correct, correct | match |
| Daily Trail | Miss Ohio once, then locate Ohio correctly. | src/daily-trail-planner.js (itemProgress); {"itemId":"world-core:state:ohio","behavior":"combined session result for Ohio","attempts":2,"correct":1,"incorrect":1,"timesSeen":1} | 2 event(s); concepts=state-location:ohio; skills=locating; outcomes=incorrect, correct | intentional difference |
| Daily Trail | Use the guided Ohio exposure. | src/maplibre-poc.js (updateMemoryTrailStats guided branch); {"itemId":"world-core:state:ohio","behavior":"guided exposure","retrievalAttempts":0,"retrievalCorrect":0,"guidedTapCount":1} | 1 event(s); concepts=state-location:ohio; skills=locating; outcomes=assisted | intentional difference |
| U.S. Memory Trail | Answer one locate prompt and one identify/name prompt for Ohio. | src/maplibre-poc.js (nameToPlace*/placeToName* targetStats); {"itemId":"state:ohio","locatingAttempts":1,"identifyingAttempts":1} | 2 event(s); concepts=state-location:ohio, state-naming:ohio; skills=locating, identifying; outcomes=correct, correct | match |
| Mental Map | Submit a partial Lake Erie set, then the complete correct set. | src/atlas/mental-map-challenge-engine.js (evaluateMentalMapAnswer); {"itemId":"lake-erie-all","behavior":"relationship recall","outcomes":["partial","correct"],"credit":[{"earned":2,"possible":4},{"earned":4,"possible":4}]} | 2 event(s); concepts=relationship:set:lake-lake-erie+michigan+new-york+ohio+pennsylvania; skills=relationship-recall; outcomes=partial, correct | match |
| Map Reconstruction | Submit Ohio close and Michigan well placed. | src/atlas/map-reconstruction-evaluation.js (evaluation.placements); {"itemIds":["ohio","michigan"],"behavior":"spatial reconstruction","placementStatuses":["close","well-placed"]} | 2 event(s); concepts=state-reconstruction:ohio, state-reconstruction:michigan; skills=spatial-reconstruction; outcomes=partial, correct | match |
| Canonical repository | Submit the same action event through overlapping wiring twice. | controlled action fixture; {"itemId":"state:ohio","evidenceBearingActions":1} | 1 event(s); concepts=state-location:ohio; skills=locating; outcomes=correct | match |
| U.S. Memory Trail + canonical repository | Record correct Ohio evidence, persist both stores, and reload. | mappaUnitedStatesMemoryTrailProgress; {"itemId":"state:ohio","correct":1,"incorrect":0,"currentSessionNumber":2} | 1 event(s); concepts=state-location:ohio; skills=locating; outcomes=correct | match |

## Field-level differences

- **memory-trail-locate-ohio-repeated-misses — times seen vs raw attempts (intentional difference):** The legacy planner increments timesSeen once per practiced item per completed session; canonical evidence retains each response. Legacy: `1`; canonical: `3`.
- **memory-trail-locate-ohio-repeated-misses — timestamp (unavailable/not comparable):** This legacy planner stores session numbers rather than per-response timestamps. Legacy: `—`; canonical: `2034-02-03T15:30:02.000Z`.
- **daily-trail-locate-ohio — times seen vs raw attempts (intentional difference):** Daily Trail persists one timesSeen increment per practiced item per session, while canonical evidence retains both responses. Legacy: `1`; canonical: `2`.
- **daily-trail-guided-ohio — legacy persisted raw attempt (intentional difference):** The planner aggregate records introduction separately; the canonical repository durably preserves the assisted exposure without retrieval credit. Legacy: `runtime-only guided counter`; canonical: `durable assisted event`.

## Coverage

Validated:

- Journey U.S. state location correct and incorrect actions
- U.S. Memory Trail Ohio location with repeated misses and recovery
- U.S. Memory Trail repeated correct Ohio retrieval across sessions
- Daily Trail Ohio location and guided exposure
- Ohio locating versus identifying skill separation
- Mental Map relationship partial and correct results
- Map Reconstruction state-level partial and correct placements
- repository duplicate protection
- legacy and canonical reload/persistence round-trip

Not yet tested:

- non-U.S. Journey canonical emission
- capital retrieval parity beyond the shared state/capital adapter contract
- every generated Mental Map challenge form
- every reconstruction region and Lower 48 capstone
- browser-level localStorage failures and cross-tab concurrency
- historical interactions that occurred before canonical emission was installed

## Risks

- **Double-writing risk:** Repository eventId idempotency prevents duplicate durable events when overlapping wiring submits the same action identity. Distinct accidental identities for one UI action remain a wiring risk.
- **Mode-specific ambiguity:** Legacy trail planners combine prompt forms in session aggregates; raw canonical events preserve locating versus identifying. Aggregate-to-skill parity is therefore unavailable historically.
- **Partial-result semantics:** Mental Map score-bearing incomplete answers and reconstruction close placements remain partial. Other legacy modes without partial semantics cannot be compared as partial.
- **Session/timestamp differences:** Canonical events have per-attempt timestamps and session IDs. Some legacy stores retain only session numbers or completion state.
- **Historical aggregate limitations:** Canonical history covers new emission only. Legacy aggregates cannot be losslessly converted into prompt-specific events and are not backfilled.

## Migration assessment

Safe to begin a separate, shadow/read-only Progress Report migration slice for newly emitted evidence; not safe to replace legacy scoring or infer historical prompt-specific evidence yet.
