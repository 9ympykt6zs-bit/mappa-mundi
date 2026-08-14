# Learning Inspector data layer

The Learning Inspector v1 is a read-only, JSON-safe adapter layer over Mappa Mundi's existing learner-state and result models. It does not create a shared evidence architecture, change planner behavior, write storage, or install a visual interface.

The implementation is in `src/learning-inspector.js`. `scripts/check-learning-inspector.mjs` provides fixture-based examples and regression coverage.

## Evidence labels

Every inspectable field is an envelope with an explicit evidence label:

```json
{
  "availability": "observed",
  "value": 6,
  "source": "daily-trail progress state",
  "note": ""
}
```

- `observed` means the value is present in an existing state, plan, result, or caller-supplied context.
- `inferred` means the Inspector computed or classified the value from observed inputs. The `source` and `note` state how.
- `unavailable` means the current source does not provide enough evidence. Its value is `null`; the Inspector does not silently substitute zero, false, or a guessed explanation.

## Item adapters

| Adapter | Currently visible | Important limits |
| --- | --- | --- |
| Place mastery | Stable place ID, separate recognition/naming/locating/relationship signals, attempts, correct/incorrect counts, streaks, last result, and last attempt timestamps. Aggregate counts and latest encounter are marked inferred because they combine observed signals. | No due schedule or lapse semantics. No single combined mastery status is inferred from distinct skills. An absent place record is unavailable, not zero evidence. |
| Daily Trail | Item/activity/category metadata plus the existing item progress record: status, memory state, attempts, correct responses, misses, lapses, last-seen/review fields, and due session/date when present. | The adapter reports planner progress status but does not relabel it as a new mastery judgment. Missing progress falls back to `introduced` or `unseen` as an explicitly inferred planner interpretation. |
| U.S. Memory Trail | Item/activity/type metadata plus status, memory state, attempts, correct responses, misses, lapses, last-seen session, and due session when present. | No date-based due field currently exists. Item type is exposed as the closest available category, not silently mapped to the U.S. content taxonomy. |
| Journey progress | Journey/step progress and stored completion for a specific difficulty. | Step completion is not treated as item mastery. Journey progress does not include attempts, errors, lapses, or due state. |
| Mental Map | Challenge ID/category, current challenge state, and submitted evaluation fields such as correctness, selected/missing states, score, or route results when supplied. | Results are not currently accumulated into durable per-concept attempts or mastery. No last-seen or review schedule is available. |
| Map Reconstruction | Region/state identity, session phase/view, evaluation, and state placement result when supplied. | Results are not currently accumulated into durable per-state attempts or mastery. Move count, last-seen time, and review schedule are not available as learner evidence. |

## Selection explanations

Daily Trail explanations use the existing planner reason projection and debug-item projection exported by `src/daily-trail-planner.js`. Reason codes include new, weak review, recent review, checkpoints, remediation, terminal review, and continents/oceans foundation or review. Because those reasons are projected from the emitted plan rather than stored as immutable evidence, the Inspector marks them inferred.

U.S. Memory Trail does not currently emit reason codes. Its adapter reports observed plan membership and infers a narrow bucket such as `new`, `weak-review`, `older-review`, or `recent-review`. It also exposes observed priority inputs from the item's current progress.

Mental Map reports whether the selected challenge is present in the supplied pool and whether the caller supplied a deterministic seed. The selector does not retain its random draw or intermediate preferred pool.

All three selection adapters report exact winner-over-alternative reasoning as unavailable. Daily Trail and U.S. Memory Trail do not retain rejected candidate rankings or comparison traces, and Mental Map does not retain its random draw. The Inspector does not recreate those missing traces after the fact.

Deterministic context can be attached to a selection explanation:

```js
const explanation = createDailyTrailSelectionExplanation({
  state,
  plan,
  item,
  deterministicContext: {
    seed: "learner-scenario-01",
    now: () => new Date("2030-01-15T18:30:00.000Z")
  }
});
```

The export records the seed and resolved time. An injected random function can be identified, but the function itself is not JSON-serializable and therefore is not sufficient for replay.

## Transition snapshots

`createLearningInspectorTransition()` accepts already-adapted before and after item views plus an answer event. It clones both snapshots, preserves the event payload, and reports changed field values. The changes are marked inferred because they are a comparison across the supplied boundary; the Inspector does not claim that the event caused unrelated differences between independently supplied snapshots.

```js
const transition = createLearningInspectorTransition({
  before: beforeItemView,
  event: {
    itemId: "state:maine",
    sourceMode: "United States Memory Trail",
    answer: "Maine",
    result: { correct: true, signal: "locating" }
  },
  after: afterItemView
});
```

`createLearningInspectorDebugObject()` combines item views, selection explanations, and transitions into one JSON-safe export. V1 does not automatically read every localStorage key, listen to gameplay events, retain a history, install a global browser object, or render UI. Callers must supply the existing state/plan/result objects they want to inspect.

## Still unavailable

- A unified learner identity or evidence stream across the existing stores.
- Durable event history tying each answer to every resulting store write.
- Exact rejected-alternative ranking or random draw for past selections.
- Shared naming/locating/relationship evidence across all modes.
- Cumulative Mental Map and reconstruction evidence.
- Production-wide capture of deterministic seed/time context.
- Cross-device state, backend records, migrations, or transaction boundaries.
- A visual Learning Inspector panel and automatic production-runtime wiring.

These are explicit v1 boundaries, not evidence that the corresponding behavior does or does not work.
