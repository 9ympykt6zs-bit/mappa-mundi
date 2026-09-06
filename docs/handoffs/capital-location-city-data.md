# Assignment: Author capital-location city choices

Status: accepted

## Brief — Lead completes before dispatch

- Objective and user-visible outcome: add a maintainable 50-state data module that pairs each canonical state capital with the two largest cities in that state excluding the capital, including real coordinates and names for use as indistinguishable capital-location choices.
- Why delegation is more efficient than direct implementation: compiling and checking 100 non-capital city records is bounded content work that can proceed independently while the Lead designs the runtime, feedback, and evidence boundary.
- Specialist role; selected supported model/effort and reason: Content / Learning Systems; `gpt-6-astra`, high reasoning, because the user explicitly permits Astra for bounded implementation and source/derivation accuracy matters across all states.
- Agent/task identifier after dispatch: `/root/capital_city_data`.
- Checkout/worktree path, branch, base revision, and pre-existing dirty files: shared checkout `/Users/ryanbarnhill/Documents/mappa-mundi`, `feature/evidence-driven-learning-foundation`, base `931c44a`, clean.
- Relevant files, contracts, domain documentation, and concise context: canonical capital coordinates live in `assets/maps/data/us-capitals.json` and section files `assets/maps/data/us-states-capitals-*.json`; state IDs and capital IDs must match normalized activities. No repository-wide non-capital city dataset exists. Distractors are display/input context only and must never be activity targets or evidence concepts.
- Allowed files/changes: create `src/atlas/us-capital-location-city-choices.js`; create `scripts/check-us-capital-location-city-choices.mjs`; add a concise source/derivation note under `docs/` if useful. Use plain JavaScript data, immutable exports, and pure lookup helpers. Do not modify existing files.
- Exclusions and behavior/data that must be preserved: no runner/UI/CSS/evidence/mastery/planner/activity JSON changes; do not alter canonical capital coordinates or IDs; exclude a capital from its own two distractors even when it ranks among the state's largest cities; no DC; no generated evidence identities for distractors.
- Acceptance criteria (observable and specific): exactly 50 states; each has one capital matching repository data and exactly two unique non-capital cities with finite longitude/latitude; Louisiana yields Baton Rouge plus New Orleans and Shreveport; Rhode Island and Delaware have valid close-scale choices; states where the capital is populous still receive two other cities; lookup APIs return cloned/frozen safe records; source and selection rule are documented.
- Required tests and manual/browser checks; environment constraints: run the new checker and relevant existing capital data/content checks. Network research may be used only if necessary; cite stable primary/public data sources in documentation. Report any ambiguous incorporated-place/population cases.
- Return control to the Lead; no further delegation or unrelated edits: required. Do not commit.

## Handoff — specialist completes

- Files changed: added `src/atlas/us-capital-location-city-choices.js`, `scripts/check-us-capital-location-city-choices.mjs`, and `docs/us-capital-location-city-choices.md` only.
- Result: authored deeply frozen records for all 50 states, with the canonical capital plus two Census-ranked non-capital places and pure state/capital lookup helpers. Distractors carry Census audit metadata but no activity, target, entity, or evidence identity.
- Source decisions: fixed 2020 Census incorporated-place population; Hawaii uses CDPs because incorporated-place rows do not represent its city structure. Representative coordinates use Census internal points. The documentation records Worcester deduplication and the Louisville government-balance convention.
- Specialist validation: the new checker, state-capital relationship check, U.S. Memory Trail capital visual check, U.S. content coverage check, JavaScript syntax checks, and diff hygiene passed. No commit was created.

## Acceptance — Lead completes

- Reviewed every added file and integrated the records through a separate question-state module and MapLibre layers. Active authored activity coordinates override global capital coordinates so existing capital positions remain stable.
- Confirmed that all city choices remain display/input context. Runtime GeoJSON omits concept, target, activity, entity, and population identities; Guided browser coverage verifies that a distractor miss records only the expected canonical capital-location concept.
- Added neutral pre-answer markers and equal hit areas, nearest-dot resolution for overlaps, capital-star and three-label feedback, same-state and wrong-state wording, standalone and Guided routing, cursor suppression, and source-reset handling.
- Lead validation: 107/107 fast checks; five focused desktop Guided/capital-location browser cases; three focused mobile capital-location cases; and 18 broader desktop/mobile U.S. system and Capital Connections cases passed. `git diff --check` is required again immediately before commit.
- Accepted 2026-09-06. No further specialist work or delegation is active.
