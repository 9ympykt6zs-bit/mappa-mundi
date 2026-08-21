# Progress Report canonical-evidence shadow

This adapter asks whether the current U.S. Progress Report tells the same story when Bayesian demonstrated-progress inputs come from canonical evidence. The guarded production selector now uses the adapter for eligible new learners, while the shadow comparison remains active as a developer diagnostic and writes no evidence or planner state.

The adapter supports state location, state identification/naming, and the current item-level capital category. State skills use separate canonical concept × skill histories. The capital category intentionally rolls up locating, identifying, and explicit capital-of relationship histories because the current report represents capitals as one item-level category. The three histories remain independently inspectable. Assisted evidence remains visible as provenance but contributes neither correct nor incorrect retrieval credit.

Both paths call `scoreBayesianEvidenceCounts` from `src/bayesian-progress-score.js`; the adapter does not copy the formula. Histories produced by `src/progress-evidence-policy.js` are the sole canonical scoring input. Raw events provide recent-attempt and source provenance and are never added to history counts, preventing double counting.

The comparison proves score and display-category parity when equivalent evidence counts reach both paths. It does not prove UI rendering parity, recreate scheduler review status, decide whether Journey should affect the learner-facing report, separate old combined planner counts by prompt type, or backfill historical events.

Migration is not safe as an unconditional replacement. The production read path enrolls only a learner with healthy canonical storage and a clean, unambiguous legacy-history audit; it persists that cohort decision and falls back to legacy on repository, metadata, adapter, or shadow defects. Existing learners remain on legacy because their history cannot be converted losslessly. See [progress-report-canonical-first.md](./progress-report-canonical-first.md).

Run the focused check and regenerate the reports with:

```sh
node scripts/check-progress-report-canonical-shadow.mjs
npm run report:progress-report-canonical-shadow
```

Generated outputs:

- `reports/progress-report-canonical-shadow.md`
- `reports/progress-report-canonical-shadow.json`
