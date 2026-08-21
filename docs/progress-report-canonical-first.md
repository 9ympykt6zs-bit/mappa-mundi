# Progress Report canonical-first production read

The U.S. Progress Report now has a guarded canonical-first read path for genuinely new learners. It changes only the source of demonstrated-progress evidence. The existing screen, learner-facing wording, category presentation, Bayesian scorer, scheduler status, gameplay, and Memory Trail planner remain in place.

## Eligibility and cohort persistence

A learner can enter the canonical-first cohort only when all of these are true on the first Progress Report read:

- the canonical repository loads with `empty` or `ready` status;
- the U.S. Memory Trail and Daily Trail stores contain no attempt counters or lifecycle history;
- place mastery contains no progress signals or inconsistent aggregate totals;
- the cohort marker is absent rather than corrupt or unreadable; and
- the strict legacy/canonical shadow comparison reports no defect.

Successful enrollment writes the versioned `mappaProgressReportCanonicalCohort` marker. That marker is necessary because new interactions continue updating additive legacy stores. On reload, a valid marker identifies the already-enrolled learner; current legacy counters alone can neither enroll an existing learner nor eject an enrolled learner.

Invalid, unsupported, or unreadable cohort metadata is never repaired implicitly. The selector uses the legacy report instead.

## Canonical evidence boundary

The adapter reads raw events from the canonical repository, routes them through Progress Evidence Policy v1, and passes only policy history `correctCount` and `incorrectCount` values to the existing `scoreBayesianEvidenceCounts` function.

The supported production skills are:

- State Location;
- State Identification;
- Capital Location; and
- Capital Identification.

Journey, U.S. Memory Trail, and Daily Trail attempts merge when they have the same canonical concept × skill. Location and identification remain separate. The current single State Capitals UI category temporarily rolls Capital Location and Capital Identification together once per canonical event. Assisted, partial, and skipped evidence remains provenance and does not become correct or incorrect Bayesian input. Unseen histories retain a null score and render as Not started.

Unsupported optional categories already present in the legacy presentation model are preserved; this slice does not promote additional canonical skills into the UI.

## Safe fallback and diagnostics

The existing legacy report is selected when the repository is corrupt, invalid, unsupported, or unavailable; when legacy history makes first-time eligibility false or ambiguous; when cohort metadata is invalid or cannot be persisted; when the canonical adapter throws; or when the strict shadow detects missing canonical evidence relative to an enrolled learner's legacy counters.

Fallback is silent for learners. On local development hosts, `window.mappaProgressReportReadDebug` exposes the selected path, reason, repository status, eligibility audit, cohort metadata, supported skills, and record-level shadow classifications. Canonical failures also emit a developer console warning. No diagnostic changes learner evidence or planning state.

Existing learners are deliberately not migrated. They remain on legacy until a versioned historical baseline and cutover boundary can prevent overlap without fabricating per-attempt events.

## Reset

The cohort marker and canonical evidence repository have explicit, separate reset helpers. A complete developer reset calls both `resetCanonicalProgressReportCohort(storage)` and `resetCanonicalEvidenceRepository(storage)`, then reloads the repository. Legacy progress stores are not changed by either helper.

Run the focused validation with:

```sh
npm run check:progress-report-canonical-first
```
