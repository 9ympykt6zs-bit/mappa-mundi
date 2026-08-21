# Progress Evidence Policy v1

## 1. Purpose

This policy defines which canonical evidence affects each user-facing Progress Report skill. The guarded canonical-first production read consumes it without changing UI layout, the Bayesian formula, learner evidence, scheduling, or gameplay.

The policy decision key is the canonical `conceptId + skillId`. Source mode and activity remain provenance and producer-validation data; they do not redefine the skill. Outcome determines whether the included event is positive, negative, partial, assisted, or non-scoring evidence.

## 2. Core principles

- Count only evidence whose canonical concept and skill genuinely measure the user-facing skill.
- Merge different modes when they measure the same concept × skill. Journey, U.S. Memory Trail, and Daily Trail Ohio-location events belong to one Ohio State Location history.
- Keep location, identification, relationship recall, and spatial reconstruction separate.
- Treat `correct` and `incorrect` as the current Bayesian inputs. Preserve other outcomes without silently changing their meaning.
- Deduplicate by `eventId` before aggregation. Route raw canonical events through this policy and score the resulting histories; never add the raw events to those history counts again.
- Do not fabricate prompt-specific history from legacy aggregates.
- A new producer with an already-approved concept × skill may contribute regardless of its mode name, but it must pass emission parity before production migration.

## 3. User-facing progress skills

| Progress skill | Required canonical mapping | Current status |
| --- | --- | --- |
| State Location | `state-location:{state}` + `locating` | Supported |
| State Identification | `state-naming:{state}` + `identifying` | Supported |
| Capital Location | `capital-location:{state}:{capital}` + `locating` | Supported |
| Capital Identification | `capital-naming:{state}:{capital}` + `identifying` | Supported |
| Capital-of Relationship | `state-capital:{state}:{capital}` + `relationship-recall` | Policy defined; no current live emitter |
| Geographic Relationships | `relationship:*` + `relationship-recall` or `sequencing` | Supported for Mental Map evidence |
| Spatial Reconstruction | `state-reconstruction:{state}` + `spatial-reconstruction` | Supported as a distinct skill, not State Location |
| Contextual Knowledge | Explicit contextual concept + contextual-recall skill + approved U.S. taxonomy qualification | Blocked by canonical contract v1 |

Context cannot yet contribute. Canonical v1 has no contextual-recall skill, and evidence events do not carry the taxonomy qualification needed to distinguish approved physical, political, human, historical-geographic, or environmental context from generic relationship questions.

## 4. Source and skill inclusion matrix

| Current source/activity | Canonical concept + skill | Progress contribution | Inclusion rule |
| --- | --- | --- | --- |
| Journey U.S. state placement | `state-location:*` + `locating` | State Location | Include correct/incorrect retrieval; merge with the same history from trails |
| U.S. Memory Trail name-to-place | `state-location:*` + `locating` | State Location | Include |
| Daily Trail name-to-place | `state-location:*` + `locating` | State Location | Include when the emitted skill is truly `locating` |
| Memory/Daily place-to-name | `state-naming:*` + `identifying` | State Identification | Include; never share with State Location |
| Capital name-to-place | `capital-location:*` + `locating` | Capital Location | Include |
| Capital place-to-name | `capital-naming:*` + `identifying` | Capital Identification | Include |
| Future scored capital relationship activity | `state-capital:*` + `relationship-recall` | Capital-of Relationship | Include after emitter parity validation |
| Mental Map relationship question | `relationship:*` + `relationship-recall` | Geographic Relationships | Include; do not leak into State Location or Identification |
| Mental Map ordered relationship | `relationship:*` + `sequencing` | Geographic Relationships | Include as relationship evidence |
| Map Reconstruction | `state-reconstruction:*` + `spatial-reconstruction` | Spatial Reconstruction only | Never automatically convert to State Location |
| Any guided retrieval | Approved retrieval mapping + `assisted` | Exposure provenance only | Retain, but add no correct/incorrect Bayesian count |
| Any source with mismatched concept and skill | For example `state-location:*` + `identifying` | None | Exclude as having no approved policy rule |
| Generic location/naming evidence | Any | Relationships or Context | Exclude; those constructs require their own canonical concept and skill |

Source modes listed above are the currently validated producers. The evaluator labels other exact concept × skill producers as semantically valid but not yet producer-validated; source naming alone never turns unrelated evidence into a skill contribution.

## 5. Outcome handling

| Canonical outcome | Policy treatment | Current Bayesian input |
| --- | --- | --- |
| `correct` | Positive demonstrated evidence | `correctCount += 1` |
| `incorrect` | Negative demonstrated evidence | `incorrectCount += 1` |
| `assisted` | Exposure only; not successful retrieval | No count |
| `partial` | Preserve event and `credit`; do not promote to full correctness | No count temporarily |
| `skipped` | Preserve as a skipped opportunity | No count |

The existing Bayesian model accepts correct and incorrect counts, not fractional credit. Until a partial-evidence model is approved, partial events remain visible to debugging and future reducers but are excluded from both Bayesian counts. Treating partial as either fully correct or fully incorrect would change its meaning.

## 6. Capital aggregation policy

Capital Location, Capital Identification, and Capital-of Relationship remain separate canonical histories.

While the current UI retains one **State Capitals** category, its temporary canonical rollup may combine Capital Location and Capital Identification by summing their correct/incorrect events once per `eventId` for each capital, then calling the existing Bayesian scorer. This matches the current item-level capital category without duplicating the formula.

Capital-of Relationship is not included in that rollup. It answers a different question—knowing which capital belongs to a state—and must remain separately inspectable until product design explicitly decides how to display it.

## 7. Reconstruction and Mental Map treatment

- Reconstruction measures `spatial-reconstruction`, not ordinary state locating. A well-placed state is positive reconstruction evidence only; a close placement remains partial reconstruction evidence.
- Mental Map `relationship-recall` and `sequencing` contribute to Geographic Relationships. They do not contribute to State Location merely because the response contains state IDs.
- Mental Map content cannot contribute to Contextual Knowledge until the canonical contract carries an approved contextual skill and taxonomy-qualified concept.

## 8. Historical compatibility

Do not create historical canonical events.

For a future existing-user migration:

1. Freeze trustworthy legacy aggregates as a separately labeled `legacy-aggregate-baseline`.
2. Record the baseline creation time and the set of canonical event IDs already present at that boundary.
3. Add only canonical events not represented by that snapshot, preventing overlap between a baseline and live canonical history.
4. Map skill-specific legacy signals to their matching baseline skill when attribution is reliable.
5. Do not split combined legacy state-practice totals into location and identification. Preserve them as combined aggregate provenance or a compatibility-only baseline until the product chooses how to display that ambiguity.

Brand-new learners can start with canonical-only histories. Existing learners require the baseline/cutover design above before migration.

## 9. Double-counting rules

- `eventId` is the action identity and deduplication key.
- A current v1 event maps to exactly one policy history. Multiple contributions would require an explicit future rule proving that the action measured multiple skills.
- Different modes with different event IDs may both contribute when they are genuinely separate attempts at the same concept × skill.
- A category rollup consumes each mapped event once, even if it summarizes multiple subskills.
- Consumers score policy history counts. Those counts must never be added to the raw events that produced them.
- Legacy baselines and canonical events require a recorded cutover boundary; otherwise their overlapping period must not be summed.

## 10. Open questions

- What canonical concept and skill vocabulary should represent contextual recall?
- How should approved U.S. taxonomy tags be bound to evidence events without duplicating concept metadata?
- Should partial credit eventually become fractional Bayesian evidence or use a separate model?
- Should the final UI expose Capital Location, Capital Identification, and Capital-of Relationship separately?
- How should ambiguous combined legacy state-practice baselines appear after skill-separated canonical evidence begins?
- What producer-parity threshold is required before a new mode may affect learner-facing progress?

## 11. Migration readiness criteria

A canonical-first implementation for brand-new learners is design-ready for State Location, State Identification, Capital Location, and Capital Identification when it consumes this policy, retains the current Bayesian module, and passes shadow/UI acceptance. Geographic Relationships and Spatial Reconstruction are policy-defined but should not appear in the current UI without separate product acceptance. Context and live Capital-of Relationship progress are not implementation-ready because their emitters/contracts are incomplete.

Existing learners are not migration-ready. Migration remains blocked on a versioned legacy-baseline format, a canonical cutover boundary, overlap prevention, and an explicit display treatment for combined historical state-practice evidence.
