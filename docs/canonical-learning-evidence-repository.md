# Canonical learning evidence repository v1

The A2 repository is the durable, append-only history for new canonical learning evidence. It proves that Journey, U.S. Memory Trail, eligible U.S. items in Daily Trail, Mental Map, and Map Reconstruction can describe the same underlying knowledge with the A1 contract while their existing learner stores continue to operate unchanged.

## Persistence format

The browser storage key is `mappaMundiCanonicalEvidence`. Its JSON value has this shape:

```json
{
  "storageVersion": 1,
  "evidenceSchemaVersion": 1,
  "events": []
}
```

Only these persisted fields are written. Runtime load status is returned separately on the in-memory repository object. Events are validated through `createCanonicalEvidenceEvent` on insertion, save, and load, and inputs are cloned so callers cannot mutate stored history accidentally.

Storage migrations are keyed by the version they migrate from in `CANONICAL_EVIDENCE_REPOSITORY_MIGRATIONS`. Version 1 has no prior migration. A future or otherwise unsupported version is reported as `unsupported-version`.

Invalid JSON, invalid event data, unsupported versions, and storage read failures return an empty in-memory view with a specific status and message. The persisted value is preserved rather than silently removed or overwritten. A new write is refused while such a load error exists, allowing debugging or an explicit reset.

## Insertion and idempotency

`eventId` is the idempotency key. Inserting the same validated event twice is a successful no-op. Reusing an event ID with different content is an explicit collision error. Reconstruction writes its state-level events as a batch with one attempt ID and distinct event IDs.

New gameplay writes are additive:

- U.S. Journey state placement emits `state-location:{state} + locating`.
- U.S. Memory Trail and equivalent Daily Trail state/capital prompts emit the retrieval mapping selected by the prompt form. Guided prompts remain `assisted`.
- Mental Map emits relationship recall or sequencing and preserves partial credit.
- regional and Lower 48 reconstruction emit one spatial-reconstruction event per evaluated state, preserving correct, partial, incorrect, and skipped outcomes.

Existing planner state, Journey progress, mastery debug writes, progression, thresholds, content, and Progress Report calculations are not replaced or recalculated.

## Replay and reads

Replay sorts events by timestamp, sequence, and event ID before reducing them. Each concept × skill summary contains only factual counts and provenance:

- attempts;
- correct, incorrect, assisted, partial, and skipped counts;
- last evidence timestamp;
- most recent outcome;
- sorted source modes seen.

There is deliberately no mastery formula in A2. Read APIs expose all events; concept, skill, and source-mode filters; recent events; summaries; and repository version/status. The Learning Inspector can opt into a canonical evidence view while retaining all existing legacy adapters and labels canonical live events separately from legacy aggregate state.

## Historical data and reset

Historical planner counters are not replayed into this repository. The A1 aggregate adapter remains available for truthful read-only inspection, but it cannot be inserted as a raw event because it has no real event identity, timestamp, or prompt-specific attribution.

`resetCanonicalEvidenceRepository` removes only `mappaMundiCanonicalEvidence`. It does not clear Daily Trail, U.S. Memory Trail, Journey, place mastery, reconstruction resume data, Progress Report inputs, or other legacy persistence.

## Current limitations and next work

The repository records only new interactions after this integration. It does not schedule practice, choose content, compute mastery, sync across devices, or change Progress Report scoring. A future migration may compute demonstrated progress from canonical evidence through the read APIs, but that must be validated separately before replacing any legacy calculation.

Run the focused checks with:

```sh
node scripts/check-canonical-learning-evidence.mjs
node scripts/check-canonical-learning-evidence-repository.mjs
```

Both also run under `npm test`.
