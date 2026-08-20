# Canonical vs legacy evidence parity validation

A2.5 validates that the canonical repository is a faithful read-only representation of new learner evidence before any consumer migrates to it. Deterministic scenarios compare only measurements that describe the same behavior. Each field is classified as a match, intentional difference, unavailable/not comparable, or defect.

The validator covers representative Journey, U.S. Memory Trail, Daily Trail, Mental Map, and Map Reconstruction behavior. It also checks locating versus identifying separation, guided evidence, partial outcomes, duplicate protection, missing-event detection, persistence, deterministic replay, serialization, and fixture immutability.

It does not prove that adaptive selection, mastery thresholds, Progress Report scoring, or gameplay UX is correct. It does not reconstruct historical raw attempts from planner aggregates, and it does not establish parity for paths outside the report's coverage list.

Legacy and canonical stores still coexist because they serve different current responsibilities. Legacy state drives scheduling, progression, resume behavior, and the current Progress Report. Canonical evidence is an append-only factual stream for new interactions. Removing or replacing legacy stores before consumers are separately validated would change production semantics and would discard historical aggregate state that cannot be losslessly converted.

Before a consumer migrates, all evidence-bearing paths it relies on must emit canonical events without omissions or duplicates; equivalent concepts, skills, outcomes, and credit must pass parity checks; persistence and replay must remain deterministic; historical-data behavior must be explicitly designed; and the consumer's shadow output must be compared against its legacy output. A2.5 permits a separate read-only/shadow Progress Report migration experiment. It does not authorize replacing current scoring.

Run and regenerate the report with:

```sh
npm run report:canonical-evidence-parity
node scripts/check-canonical-evidence-parity.mjs
```

Generated outputs:

- `reports/canonical-evidence-parity.md`
- `reports/canonical-evidence-parity.json`
