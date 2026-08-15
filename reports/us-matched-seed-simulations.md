# U.S. Memory Trail matched-seed simulation matrix

This O6.2 report holds planner seed, starting state, simulated time schedule, and a separate answer-random stream constant within each matched group. Only the learner-response profile changes. The results are deterministic observations of the current U.S. Memory Trail planner, not a randomized human experiment or proof of pedagogical correctness.

## Executive summary

- Across 12 matched planner seeds, the single-weak-item profile added a median 36 Ohio encounters relative to the near-perfect profile (range 36–36); the difference was positive for 12 of 12 seeds. This is consistent with an answer-driven weak-item effect.
- The regional-weakness profile added a median 36 Midwest weak-review selections relative to near-perfect (range 29–37); the difference was positive for 12 of 12 seeds.
- Mixed-profile review pressure changed by a median -12 review selections relative to near-perfect (range -37–19).
- Wyoming maximum eligibility deferral ranged 5–25 sessions across random-profile seeds. This makes the earlier single-seed eight-session observation more appropriately a seed-specific example, not a universal value.
- Every near-perfect run introduced all 100 items at session 39 and first reached mastery at session 49. The final mastered count was only 2–3 at session 60, strengthening the evidence that the earlier 36-session window was too short for any mastery while leaving broader convergence unverified.
- Every single-weak-item run stopped at 99 introduced items within this 60-session window while Ohio received 44 encounters. Progression clearly continued beyond Ohio, but complete introduction was not reached; the finite report cannot determine whether the last item is permanently blocked.
- Matching seeds improves attribution to scripted answers, but profile rules still model synthetic behavior and candidate eligibility remains an inferred reconstruction from Selection Trace.

## Experiment design

- Planner seeds: 12 (`matched-planner-001` through `matched-planner-012`). Twelve seeds provide multiple tie-breaking orders while keeping the report and fast checks practical; no significance test is claimed.
- Profiles per seed: perfect, single-weak-item, regional-weakness, mixed, random.
- Sessions per run: 60; total runs: 60.
- Answer seeding: One deterministic answer seed is shared by all profiles within a planner-seed group and is distinct from the planner seed. Profiles that do not consume randomness ignore it.
- Starting state: the same empty normalized U.S. Memory Trail state; simulated start time: 2030-01-15T18:30:00.000Z.

## Aggregate profile outcomes

Values are median (minimum–maximum) across planner seeds.

| Profile | Items introduced | Final mastered | Review selections | Weak review | West selections | Maximum deferral |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | 100 (100–100) | 2 (2–3) | 252 (252–252) | 11 (11–11) | 75.5 (74–78) | 31 (31–31) |
| single-weak-item | 99 (99–99) | 0 (0–1) | 286 (286–286) | 43 (43–43) | 78 (78–78) | 26 (25–26) |
| regional-weakness | 100 (100–100) | 1 (0–2) | 250 (219–269) | 48 (45–50) | 37.5 (29–49) | 54.5 (46–57) |
| mixed | 100 (100–100) | 0.5 (0–1) | 240 (215–271) | 53 (52–55) | 63 (35–87) | 58 (57–59) |
| random | 100 (99–100) | 0.5 (0–1) | 189.5 (166–222) | 59 (58–59) | 65 (49–88) | 59 (58–59) |

## Seed matrix summary

| Planner seed | Profile | Introduced | Unique | Mastered | New | Review | Weak review | Midwest selections | West selections | Max deferral |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| matched-planner-001 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 88 | 76 | 31 |
| matched-planner-001 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 110 | 78 | 25 |
| matched-planner-001 | regional-weakness | 100 | 100 | 1 | 100 | 235 | 48 | 216 | 32 | 56 |
| matched-planner-001 | mixed | 100 | 100 | 1 | 100 | 226 | 55 | 141 | 59 | 59 |
| matched-planner-001 | random | 100 | 100 | 1 | 100 | 198 | 59 | 67 | 55 | 58 |
| matched-planner-002 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 88 | 74 | 31 |
| matched-planner-002 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-002 | regional-weakness | 100 | 100 | 1 | 100 | 260 | 49 | 196 | 46 | 50 |
| matched-planner-002 | mixed | 100 | 100 | 0 | 100 | 257 | 54 | 174 | 49 | 59 |
| matched-planner-002 | random | 100 | 100 | 0 | 100 | 181 | 58 | 63 | 71 | 59 |
| matched-planner-003 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 86 | 78 | 31 |
| matched-planner-003 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 25 |
| matched-planner-003 | regional-weakness | 100 | 100 | 0 | 100 | 249 | 46 | 221 | 38 | 57 |
| matched-planner-003 | mixed | 100 | 100 | 0 | 100 | 223 | 52 | 119 | 72 | 58 |
| matched-planner-003 | random | 100 | 100 | 1 | 100 | 189 | 58 | 74 | 88 | 59 |
| matched-planner-004 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 90 | 76 | 31 |
| matched-planner-004 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-004 | regional-weakness | 100 | 100 | 1 | 100 | 251 | 48 | 224 | 36 | 56 |
| matched-planner-004 | mixed | 100 | 100 | 0 | 100 | 215 | 52 | 157 | 45 | 57 |
| matched-planner-004 | random | 100 | 100 | 0 | 100 | 182 | 59 | 57 | 59 | 59 |
| matched-planner-005 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 88 | 76 | 31 |
| matched-planner-005 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-005 | regional-weakness | 100 | 100 | 2 | 100 | 244 | 49 | 201 | 32 | 56 |
| matched-planner-005 | mixed | 100 | 100 | 1 | 100 | 232 | 53 | 147 | 39 | 58 |
| matched-planner-005 | random | 99 | 99 | 0 | 99 | 190 | 59 | 59 | 63 | 58 |
| matched-planner-006 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 87 | 77 | 31 |
| matched-planner-006 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-006 | regional-weakness | 100 | 100 | 0 | 100 | 248 | 45 | 215 | 49 | 54 |
| matched-planner-006 | mixed | 100 | 100 | 0 | 100 | 240 | 53 | 125 | 64 | 58 |
| matched-planner-006 | random | 100 | 100 | 0 | 100 | 198 | 59 | 42 | 67 | 58 |
| matched-planner-007 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 85 | 76 | 31 |
| matched-planner-007 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 25 |
| matched-planner-007 | regional-weakness | 100 | 100 | 2 | 100 | 269 | 50 | 199 | 49 | 53 |
| matched-planner-007 | mixed | 100 | 100 | 1 | 100 | 250 | 55 | 125 | 87 | 58 |
| matched-planner-007 | random | 100 | 100 | 0 | 100 | 182 | 59 | 47 | 49 | 59 |
| matched-planner-008 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 88 | 75 | 31 |
| matched-planner-008 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-008 | regional-weakness | 100 | 100 | 1 | 100 | 237 | 50 | 195 | 36 | 56 |
| matched-planner-008 | mixed | 100 | 100 | 1 | 100 | 240 | 53 | 132 | 66 | 58 |
| matched-planner-008 | random | 100 | 100 | 1 | 100 | 166 | 59 | 61 | 59 | 59 |
| matched-planner-009 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 87 | 75 | 31 |
| matched-planner-009 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 110 | 78 | 25 |
| matched-planner-009 | regional-weakness | 100 | 100 | 1 | 100 | 265 | 46 | 248 | 29 | 54 |
| matched-planner-009 | mixed | 100 | 100 | 1 | 100 | 241 | 54 | 102 | 75 | 58 |
| matched-planner-009 | random | 100 | 100 | 1 | 100 | 222 | 59 | 74 | 71 | 58 |
| matched-planner-010 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 90 | 75 | 31 |
| matched-planner-010 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 25 |
| matched-planner-010 | regional-weakness | 100 | 100 | 2 | 100 | 219 | 48 | 174 | 41 | 53 |
| matched-planner-010 | mixed | 100 | 100 | 1 | 100 | 271 | 52 | 163 | 35 | 57 |
| matched-planner-010 | random | 100 | 100 | 1 | 100 | 205 | 58 | 61 | 72 | 59 |
| matched-planner-011 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 90 | 75 | 31 |
| matched-planner-011 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-011 | regional-weakness | 100 | 100 | 1 | 100 | 256 | 45 | 202 | 44 | 46 |
| matched-planner-011 | mixed | 100 | 100 | 0 | 100 | 239 | 52 | 152 | 62 | 57 |
| matched-planner-011 | random | 100 | 100 | 0 | 100 | 182 | 59 | 49 | 60 | 58 |
| matched-planner-012 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 90 | 75 | 31 |
| matched-planner-012 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 110 | 78 | 26 |
| matched-planner-012 | regional-weakness | 100 | 100 | 2 | 100 | 257 | 46 | 226 | 37 | 55 |
| matched-planner-012 | mixed | 100 | 100 | 0 | 100 | 258 | 55 | 157 | 68 | 58 |
| matched-planner-012 | random | 100 | 100 | 1 | 100 | 206 | 59 | 80 | 81 | 59 |

## Pairwise comparisons

Deltas are comparison profile minus the matched near-perfect run. Positive values describe more of the named metric, not automatically better behavior.

### Near-perfect vs single weak item

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | 33 (33–33) | 12 of 12 |
| itemsIntroduced | -1 (-1–-1) | 0 of 12 |
| finalMasteredCount | -2 (-3–-1) | 0 of 12 |
| reviewSelections | 34 (34–34) | 12 of 12 |
| weakReviewSelections | 32 (32–32) | 12 of 12 |
| MidwestReviewSelections | 23 (21–26) | 12 of 12 |
| MidwestWeakReviewSelections | 38 (37–39) | 12 of 12 |
| WestSelections | 2.5 (0–4) | 11 of 12 |
| OhioEncounters | 36 (36–36) | 12 of 12 |
| WyomingMaximumDeferral | -2 (-2–-1) | 0 of 12 |

### Near-perfect vs regional weakness

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | -2 (-33–17) | 5 of 12 |
| itemsIntroduced | 0 (0–0) | 0 of 12 |
| finalMasteredCount | -1 (-3–0) | 0 of 12 |
| reviewSelections | -2 (-33–17) | 5 of 12 |
| weakReviewSelections | 37 (34–39) | 12 of 12 |
| MidwestReviewSelections | 121 (84–161) | 12 of 12 |
| MidwestWeakReviewSelections | 36 (29–37) | 12 of 12 |
| WestSelections | -38.5 (-46–-27) | 0 of 12 |
| OhioEncounters | 5.5 (-7–22) | 8 of 12 |
| WyomingMaximumDeferral | 6 (0–11) | 11 of 12 |

### Near-perfect vs mixed

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | -12 (-37–19) | 3 of 12 |
| itemsIntroduced | 0 (0–0) | 0 of 12 |
| finalMasteredCount | -2 (-3–-1) | 0 of 12 |
| reviewSelections | -12 (-37–19) | 3 of 12 |
| weakReviewSelections | 42 (41–44) | 12 of 12 |
| MidwestReviewSelections | 56 (15–86) | 12 of 12 |
| MidwestWeakReviewSelections | 28.5 (22–37) | 12 of 12 |
| WestSelections | -13 (-40–11) | 1 of 12 |
| OhioEncounters | -6 (-7–15) | 5 of 12 |
| WyomingMaximumDeferral | 8 (-8–12) | 10 of 12 |

## Regional analysis

Values are medians across the 12 runs for each profile. Candidate opportunities come from inferred Selection Trace pools. Selection rate normalizes selections by those opportunities; it is not a regional planner weight.

| Profile | Region | Introduced | Candidate opportunities | Selections | Review | Weak review | Error rate | Selection/opportunity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | Northeast | 18 | 1016 | 81 | 63 | 1 | 1.3% | 8.0% |
| perfect | Midwest | 24 | 870 | 88 | 64 | 5 | 5.7% | 10.1% |
| perfect | South | 32 | 1417 | 106 | 74 | 2 | 1.9% | 7.5% |
| perfect | West | 26 | 677 | 75.5 | 49.5 | 2 | 4.0% | 11.2% |
| single-weak-item | Northeast | 18 | 1016 | 85 | 67 | 0 | 0.0% | 8.4% |
| single-weak-item | Midwest | 23 | 852 | 110 | 87 | 43 | 40.0% | 12.9% |
| single-weak-item | South | 32 | 1424 | 112 | 80 | 0 | 0.0% | 7.9% |
| single-weak-item | West | 26 | 722 | 78 | 52 | 0 | 0.0% | 10.8% |
| regional-weakness | Northeast | 18 | 1016.5 | 38 | 20 | 1 | 2.9% | 3.7% |
| regional-weakness | Midwest | 24 | 893.5 | 208.5 | 184.5 | 41 | 64.5% | 23.7% |
| regional-weakness | South | 32 | 1402 | 60 | 28 | 5 | 13.0% | 4.3% |
| regional-weakness | West | 26 | 620.5 | 37.5 | 11.5 | 0.5 | 12.7% | 6.2% |
| mixed | Northeast | 18 | 1017 | 44 | 26 | 4 | 17.5% | 4.3% |
| mixed | Midwest | 24 | 839 | 144 | 120 | 34 | 65.4% | 17.5% |
| mixed | South | 32 | 1400 | 91.5 | 59.5 | 11 | 38.9% | 6.5% |
| mixed | West | 26 | 593 | 63 | 37 | 1 | 38.2% | 11.0% |
| random | Northeast | 18 | 1022.5 | 77 | 59 | 24 | 46.6% | 7.4% |
| random | Midwest | 24 | 758 | 61 | 37 | 10.5 | 45.8% | 8.1% |
| random | South | 32 | 1333.5 | 90 | 58 | 17 | 45.4% | 6.8% |
| random | West | 26 | 466 | 65 | 39.5 | 6.5 | 48.5% | 14.1% |

The Midwest comparison is most informative in matched pairs: region size and curriculum order are held constant within each pair, while the response rule changes. West exposure remains partly constrained by curriculum arrival; an item outside an emitted candidate pool is not counted as eligible.

## Mastery and progression

| Profile | First complete introduction median (range) | First mastery median (range) | Final mastered median (range) |
| --- | --- | --- | --- |
| perfect | 39 (39–39); reached by 12 of 12 | 49 (49–49); reached by 12 of 12 | 2 (2–3) |
| single-weak-item | Unavailable; reached by 0 of 12 | 58 (50–60); reached by 5 of 12 | 0 (0–1) |
| regional-weakness | 43.5 (41–46); reached by 12 of 12 | 54.5 (41–59); reached by 10 of 12 | 1 (0–2) |
| mixed | 46 (40–50); reached by 12 of 12 | 54 (35–58); reached by 7 of 12 | 0.5 (0–1) |
| random | 53 (49–58); reached by 11 of 12 | 51.5 (27–54); reached by 8 of 12 | 0.5 (0–1) |

The JSON companion also records mastered counts at sessions 12, 24, 36, and 60 for every run. Null milestone values mean the run did not reach the milestone within 60 sessions; they are not converted to a numeric delay. The perfect profile's identical first-introduction and first-mastery sessions across all seeds indicate low seed sensitivity for those milestones under this response script. Other profiles show wider or absent milestone evidence.

## Seed sensitivity

- Wyoming/random-profile maximum deferral: 5–25 sessions.
- West/random-profile encounters: 1–13 Wyoming encounters across seeds; the aggregate table separately reports all West selections.
- Ohio/single-weak-item encounters: 44–44 across seeds.
- Random-profile Wyoming deferral outliers: matched-planner-010 at 5 sessions and matched-planner-012 at 25.
- Regional-weakness Midwest-selection outliers: matched-planner-010 at 174 and matched-planner-009 at 248.
- Mixed-profile West-selection outliers: matched-planner-010 at 35 and matched-planner-007 at 87.
- Metrics with narrow ranges and the same pairwise direction across most or all seeds are stable in this matrix. Wider ranges identify seed sensitivity, but no statistical confidence level is claimed.

## Earlier conclusions revisited

- **Stronger:** repeated Ohio failures create additional Ohio exposure while planner seed is held constant; the pairwise direction and range are recorded above.
- **Stronger:** Midwest weak responses create additional Midwest weak-review pressure in matched comparisons, separating that response effect from region size and the shared seed/order.
- **Stronger:** the earlier lack of mastery at 36 sessions is explained by the near-perfect profile's stable first mastery at session 49 in all 12 matched runs; this does not establish long-horizon mastery quality.
- **More nuanced:** the single-weak profile continues through 99 introduced items but does not complete introduction by session 60, so “progression continues” remains true while “weak items do not block completion” remains unverified.
- **More nuanced:** Wyoming's earlier eight-session delay is one seeded trajectory. The matrix reports its range and does not treat any finite deferral as permanent starvation.
- **More nuanced:** raw regional encounter counts still combine curriculum composition, candidate-pool size, and response-driven review. Candidate-opportunity normalization narrows but does not eliminate those confounds.
- **Unchanged limitation:** no item outside an emitted Selection Trace pool is labeled eligible, and no finite matrix proves absence of long-run starvation.

## Open questions

- Are the observed review-pressure ranges pedagogically appropriate? The matrix measures behavior but contains no learning-outcome acceptance threshold.
- Would longer horizons change mastery convergence or unresolved-deferral ranges?
- Daily Trail lacks an equivalent full rejected-candidate pool, so the matched matrix currently covers only U.S. Memory Trail.
- Synthetic response profiles omit response time, UI behavior, and human forgetting; matched deterministic runs are not human causal evidence.
