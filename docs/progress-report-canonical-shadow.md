# Progress Report canonical-evidence shadow

This developer-only adapter asks whether the current U.S. Progress Report would tell the same story if its Bayesian demonstrated-progress inputs came from canonical evidence. It is not connected to normal navigation, does not replace the production read path, and writes no learner state.

The adapter supports state location, state identification/naming, and the current item-level capital category. State skills use separate canonical concept × skill summaries. The capital category intentionally combines its locating and identifying mappings because the current report represents capitals as one item-level category. Assisted evidence remains visible as provenance but contributes neither correct nor incorrect retrieval credit.

Both paths call `scoreBayesianEvidenceCounts` from `src/bayesian-progress-score.js`; the shadow does not copy the formula. Canonical reducer summaries are the sole scoring input. Raw events provide recent-attempt and source provenance and are never added to summary counts, preventing summary-plus-event double counting.

The comparison proves score and display-category parity when equivalent evidence counts reach both paths. It does not prove UI rendering parity, recreate scheduler review status, decide whether Journey should affect the learner-facing report, separate old combined planner counts by prompt type, or backfill historical events.

Migration is not yet safe as an unconditional replacement. New learners can diverge because canonical evidence includes Journey and separates prompt skills while the current report does not always do either. Existing learners additionally have legacy-only history that cannot be converted losslessly. A future migration needs an explicit source-inclusion policy, a historical baseline/cutover design, and another shadow acceptance pass.

Run the focused check and regenerate the reports with:

```sh
node scripts/check-progress-report-canonical-shadow.mjs
npm run report:progress-report-canonical-shadow
```

Generated outputs:

- `reports/progress-report-canonical-shadow.md`
- `reports/progress-report-canonical-shadow.json`
