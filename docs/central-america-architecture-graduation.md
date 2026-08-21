# Central America Architecture Graduation Report

Date: 2026-08-21  
Graduation unit: Belize, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, and Panama  
Content boundary: country location and country identification only

## Result

Central America passes the bounded second-region architecture graduation test. The production unit composes the existing North America Journey activity, ordinary Memory Trail, canonical evidence repository, Progress Evidence Policy, Progress Report, Learning Inspector, Selection Trace, Expedition framework, and deterministic test infrastructure. It adds no Central America scheduler, learner-state store, gameplay engine, persistence repository, mastery model, or fork of a U.S. activity.

No capitals, physical geography, contextual curriculum, or new relationships were needed to exercise the reusable contracts.

## Reused unchanged

| Existing capability | Graduation use |
| --- | --- |
| `assets/maps/data/central-america.json` target content and map assets | The existing seven-country activity remains the sole playable content set. |
| Journey gameplay and `atlasQuestProgress` | The configured North America Journey step supplies country-location retrieval and keeps its existing progress behavior. |
| Ordinary Memory Trail mechanics and activity progress | The same guided-exposure and retrieval loop supplies country identification; no adaptive U.S. planner was copied. |
| Canonical evidence repository and persistence key | Both modes append normal v1 events to `mappaMundiCanonicalEvidence`. |
| Bayesian demonstrated-progress scorer | Country categories use the same scoring functions as the U.S. canonical-first report. |
| Expedition framework and UI | The same evidence-derived locked/available/in-progress/complete model renders the three-step unit. |
| Learning Inspector envelopes, panel, canonical history view, and transition view | Country items and events appear through a new generic item adapter, not a separate Inspector. |
| Selection Trace schema | Ordinary Memory Trail emits the same observable selection contract. |
| Seeded dependency helpers and fast-check runner | The graduation fixture uses the existing seeded random and auto-discovered `check-*.mjs` infrastructure. |

## New configuration, content, and assets

- `src/central-america-learning-unit.js` declares the seven targets, two evidence metrics, two Progress Report category mappings, and three Expedition steps.
- The existing activity JSON adds only a four-line `canonicalEvidence` contract identifying `country` targets and its allowed target IDs.
- The existing Learn Your World menu adds one Central America entry card.
- `src/geography-learning-unit-registry.js` registers the unit through a generic collection/lookup boundary.
- No new map geometry, country facts, audio, imagery, capital data, physical-geography data, or relationship content was added.

## Core-code changes

All core changes are geography- or activity-generic:

- canonical retrieval now supports the general `country-location:{country}` / `locating` and `country-naming:{country}` / `identifying` vocabulary;
- an activity-level evidence contract maps configured entity types and targets into canonical retrieval items;
- the activity normalizer preserves that contract;
- ordinary Memory Trail emits canonical evidence and a generic Selection Trace;
- a generic canonical Progress Report core accepts item and category configuration, while the U.S. adapter delegates to it without changing its guarded read path;
- a generic geography-learning-unit adapter derives configured evidence metrics, Progress Report items, and Expedition state from the shared repository;
- Expedition rendering, report rendering, return routing, and screen model names are no longer U.S.-exclusive;
- a Journey launch may optionally identify a stable step ID, allowing a configured unit to launch one bounded existing step rather than copy it;
- the Learning Inspector can adapt any canonical retrieval item and enumerates registered learning units;
- ActivitySession accepts the existing seeded-random contract for deterministic replay;
- warm-cache module fingerprints cover the changed runtime graph.

There are no `if central-america` or equivalent region branches in `src/maplibre-poc.js`; region lookup goes through the registry.

## U.S.-specific assumptions discovered

The port found and removed these assumptions:

1. Journey canonical emission recognized only `us-states-*` activities.
2. Canonical retrieval concepts supported states and capitals but not the general country entity already used by map content.
3. Ordinary Memory Trail did not write canonical evidence or expose its selection reasoning.
4. The canonical Progress Report reducer was embedded in the U.S. shadow adapter.
5. Inspector item population was limited to U.S./adaptive items, and its canonical panel used obsolete summary field names.
6. Expedition/report runtime screen state and return routing were named for the United States.
7. A Journey launch could choose only a whole Journey, not a configured existing step.
8. The Learn Your World submenu existed but its entry action skipped directly to Choose Journey, making composed learning units unreachable.
9. ActivitySession answer-bank randomness could not be injected for a deterministic non-U.S. replay.
10. Existing runtime cache keys did not cover two recently changed module graphs; warm-browser acceptance exposed and fixed both gaps.

## Shared infrastructure verification

`scripts/check-central-america-graduation.mjs` proves the exact seven-country boundary; activity normalization and canonical mappings; seeded ActivitySession replay; 14 correct/incorrect location and identification events; repository persistence; policy routing; two seven-item Progress Report categories; Inspector views; ordinary Memory Trail Selection Trace; and Expedition locked, recommended, complete, and optional-step states.

`tests/e2e/central-america-graduation.spec.js` passes on desktop Chromium and the iPhone 13-sized mobile Chromium profile. It verifies the production menu path, initial Expedition state, direct launch of the existing Central America Journey activity, a live canonical location event, Inspector visibility, evidence-derived resume state, a seeded completed state, the shared 14-record Progress Report, ordinary Memory Trail launch, and its live Selection Trace. Runtime page errors and error-level console messages fail the test.

On 2026-08-21:

- fast checks: **81/81 passed**;
- complete Playwright baseline: **26/26 passed** across desktop and mobile projects;
- existing canonical parity, U.S. Progress Report, Expedition, Inspector, Selection Trace, learner simulations, long-horizon mastery, neutral-balance, regional-balance, starvation-protection, and reset checks all remained green.

## Region-specific production footprint

The region-specific footprint is **109 physical source lines**:

- 99 lines in the declarative learning-unit module;
- 4 lines of canonical-evidence metadata in the existing activity JSON;
- 4 lines for the Learn Your World entry card;
- 2 registry lines (the import and collection entry).

The test fixture and this report are excluded from the production count. The shared adapters and generalized core changes are also excluded because they contain no Central America identity or exception. Region-specific engine, scheduler, repository, learner-state, or persistence code added: **0 lines**.

## Graduation conclusion

The same evidence, persistence, Progress Report, Inspector, Selection Trace, orchestration, gameplay, and deterministic verification infrastructure worked for the bounded non-U.S. unit. Central America therefore demonstrates that the U.S. reference implementation can support another geography unit primarily through content and configuration rather than system duplication.
