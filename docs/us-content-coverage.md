# U.S. Content Coverage Reporter

The U.S. content coverage reporter is a read-only inventory of repository content. It answers what U.S. concepts are represented, how those concepts are exposed, and where measurable coverage gaps remain. It does not change gameplay, learner state, adaptive selection, or content data.

## Run the reporter

```sh
npm run report:us-content
```

The command writes:

- `docs/generated/us-content-coverage-report.md` — human-readable summary, state table, regional matrix, physical inventory, gaps, and limitations;
- `docs/generated/us-content-coverage-report.json` — machine-readable sources, concepts, state coverage, regional metrics, and gaps.

Run its focused automated checks with:

```sh
npm run check:us-content
```

## Metric definitions

- **Concept**: one underlying retrievable item of knowledge with a stable semantic ID.
- **Source instance or variant**: an activity target, Memory Trail prompt form, question instance, reconstruction appearance, or other representation of a concept. Variants do not increase conceptual depth.
- **Fixed assessed**: a statically authored concept with a scored production activity or question path.
- **Conditional feedback**: authored learning material that appears only if reconstruction evaluation triggers it. Its presence does not prove learner exposure.
- **Data only**: structured atlas knowledge that is visible or queryable but is not established as scored learning.
- **Dynamic capacity**: a question the current generator could construct. Capacity is reported separately because it does not prove that the question is selected or delivered.

A concept may carry multiple taxonomy tags from `docs/US_CONTENT_TAXONOMY.md`. It is still counted once. State and capital activity targets and their Memory Trail prompt forms merge under the same concept IDs. The two Capital Connections prompt directions merge under one `state-capital:{state}:{capital}` concept per state. The two fixed Gulf west-to-east prompts merge because their ordered relationship is identical. Exact duplicate reconstruction feedback messages currently merge through an isolated normalization rule because reconstruction rules do not yet have canonical concept IDs.

## Regions

National aggregation uses the four Census regions already encoded in `src/atlas/united-states-atlas-data.js`: Northeast, Midwest, South, and West. The reporter does not replace the 11 state/capital curriculum sections, 10 reconstruction regions, or physical-feature sections; it retains those as secondary source metadata where reliable.

The Definition of Done's 80%–120% band is shown as a diagnostic comparison, not as a claim that equal concepts per state is always pedagogically correct.

## Known limitations

- Static inspection cannot prove that a learner actually receives a concept or that a browser flow works.
- Dynamic route totals describe possible endpoint pairs, not selection frequency or regional balance.
- Conditional reconstruction feedback does not establish ordinary assessed coverage.
- Direct state-to-capital relationships are assessed only by the explicit Capital Connections relationship questions; ordinary capital name/location practice remains separate.
- Physical-feature targets are counted once even when the activity can offer multiple prompt forms.
- Unscored atlas relationships are included for traceability and integration-gap analysis but do not satisfy assessed-content floors.
- The reporter does not attempt to define the future learner-evidence schema. Its concept-ID helpers are intentionally isolated in `scripts/lib/us-content-coverage.mjs`.
