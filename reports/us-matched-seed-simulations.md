# U.S. Memory Trail matched-seed simulation matrix

This O6.2 report holds planner seed, starting state, simulated time schedule, and a separate answer-random stream constant within each matched group. Only the learner-response profile changes. The results are deterministic observations of the current U.S. Memory Trail planner, not a randomized human experiment or proof of pedagogical correctness.

## Executive summary

- Across 12 matched planner seeds, the single-weak-item profile added a median 36 Ohio encounters relative to the near-perfect profile (range 36–36); the difference was positive for 12 of 12 seeds. This is consistent with an answer-driven weak-item effect.
- The regional-weakness profile added a median 37 Midwest weak-review selections relative to near-perfect (range 30–39); the difference was positive for 12 of 12 seeds.
- Once cumulative review begins, at most one of ten slots is labeled `fairness-review`; the other nine retain the existing adaptive ranking. The aggregate and seed tables expose the resulting fairness counts rather than folding them into an unnamed review bucket.
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

| Profile | Items introduced | Final mastered | Review selections | Weak review | Fairness review | West selections | Maximum deferral |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | 100 (100–100) | 2 (2–4) | 252 (252–252) | 11 (11–11) | 21 (21–21) | 77 (75–79) | 31 (31–31) |
| single-weak-item | 99 (99–99) | 0 (0–1) | 286 (286–286) | 43 (43–43) | 23 (23–23) | 78 (78–78) | 26 (25–26) |
| regional-weakness | 100 (100–100) | 1 (0–2) | 250 (219–269) | 48 (45–50) | 18 (14–20) | 34 (30–47) | 51.5 (46–53) |
| mixed | 100 (100–100) | 0 (0–2) | 240 (215–271) | 53 (52–55) | 16 (13–20) | 60 (31–80) | 51.5 (49–56) |
| random | 100 (100–100) | 0 (0–2) | 185.5 (166–222) | 59 (58–59) | 8.5 (6–13) | 61.5 (45–81) | 53 (49–55) |

## Seed matrix summary

| Planner seed | Profile | Introduced | Unique | Mastered | New | Review | Weak review | Fairness review | Midwest selections | West selections | Max deferral |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| matched-planner-001 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 83 | 77 | 31 |
| matched-planner-001 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 23 | 110 | 78 | 25 |
| matched-planner-001 | regional-weakness | 100 | 100 | 0 | 100 | 235 | 48 | 16 | 202 | 31 | 52 |
| matched-planner-001 | mixed | 100 | 100 | 1 | 100 | 226 | 55 | 14 | 127 | 55 | 53 |
| matched-planner-001 | random | 100 | 100 | 0 | 100 | 198 | 59 | 10 | 61 | 60 | 53 |
| matched-planner-002 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 21 | 86 | 77 | 31 |
| matched-planner-002 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 111 | 78 | 26 |
| matched-planner-002 | regional-weakness | 100 | 100 | 1 | 100 | 260 | 49 | 19 | 185 | 47 | 48 |
| matched-planner-002 | mixed | 100 | 100 | 0 | 100 | 257 | 54 | 18 | 160 | 48 | 51 |
| matched-planner-002 | random | 100 | 100 | 0 | 100 | 173 | 58 | 7 | 59 | 71 | 54 |
| matched-planner-003 | perfect | 100 | 100 | 4 | 100 | 252 | 11 | 21 | 83 | 77 | 31 |
| matched-planner-003 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 110 | 78 | 25 |
| matched-planner-003 | regional-weakness | 100 | 100 | 0 | 100 | 249 | 46 | 18 | 216 | 30 | 52 |
| matched-planner-003 | mixed | 100 | 100 | 0 | 100 | 223 | 52 | 14 | 102 | 72 | 53 |
| matched-planner-003 | random | 100 | 100 | 1 | 100 | 189 | 58 | 9 | 65 | 80 | 53 |
| matched-planner-004 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 86 | 77 | 31 |
| matched-planner-004 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 111 | 78 | 26 |
| matched-planner-004 | regional-weakness | 100 | 100 | 1 | 100 | 251 | 48 | 18 | 215 | 31 | 52 |
| matched-planner-004 | mixed | 100 | 100 | 0 | 100 | 215 | 52 | 13 | 148 | 46 | 54 |
| matched-planner-004 | random | 100 | 100 | 0 | 100 | 182 | 59 | 8 | 52 | 57 | 53 |
| matched-planner-005 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 88 | 76 | 31 |
| matched-planner-005 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 111 | 78 | 26 |
| matched-planner-005 | regional-weakness | 100 | 100 | 0 | 100 | 244 | 49 | 17 | 187 | 30 | 53 |
| matched-planner-005 | mixed | 100 | 100 | 0 | 100 | 232 | 53 | 15 | 120 | 31 | 56 |
| matched-planner-005 | random | 100 | 100 | 0 | 100 | 182 | 59 | 8 | 52 | 59 | 51 |
| matched-planner-006 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 90 | 77 | 31 |
| matched-planner-006 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 110 | 78 | 26 |
| matched-planner-006 | regional-weakness | 100 | 100 | 0 | 100 | 248 | 45 | 18 | 203 | 43 | 50 |
| matched-planner-006 | mixed | 100 | 100 | 0 | 100 | 240 | 53 | 16 | 108 | 62 | 51 |
| matched-planner-006 | random | 100 | 100 | 0 | 100 | 198 | 59 | 10 | 48 | 55 | 52 |
| matched-planner-007 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 21 | 86 | 78 | 31 |
| matched-planner-007 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 110 | 78 | 25 |
| matched-planner-007 | regional-weakness | 100 | 100 | 2 | 100 | 269 | 50 | 20 | 214 | 40 | 51 |
| matched-planner-007 | mixed | 100 | 100 | 2 | 100 | 250 | 55 | 17 | 114 | 62 | 49 |
| matched-planner-007 | random | 100 | 100 | 0 | 100 | 182 | 59 | 8 | 47 | 45 | 52 |
| matched-planner-008 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 85 | 75 | 31 |
| matched-planner-008 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 23 | 110 | 78 | 26 |
| matched-planner-008 | regional-weakness | 100 | 100 | 1 | 100 | 237 | 50 | 16 | 186 | 35 | 52 |
| matched-planner-008 | mixed | 100 | 100 | 1 | 100 | 240 | 53 | 16 | 121 | 62 | 52 |
| matched-planner-008 | random | 100 | 100 | 2 | 100 | 166 | 59 | 6 | 66 | 54 | 55 |
| matched-planner-009 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 21 | 83 | 79 | 31 |
| matched-planner-009 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 23 | 110 | 78 | 25 |
| matched-planner-009 | regional-weakness | 100 | 100 | 1 | 100 | 265 | 46 | 20 | 227 | 31 | 49 |
| matched-planner-009 | mixed | 100 | 100 | 0 | 100 | 241 | 54 | 16 | 81 | 80 | 51 |
| matched-planner-009 | random | 100 | 100 | 1 | 100 | 222 | 59 | 13 | 72 | 67 | 53 |
| matched-planner-010 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 87 | 75 | 31 |
| matched-planner-010 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 110 | 78 | 25 |
| matched-planner-010 | regional-weakness | 100 | 100 | 1 | 100 | 219 | 48 | 14 | 176 | 34 | 52 |
| matched-planner-010 | mixed | 100 | 100 | 0 | 100 | 271 | 52 | 20 | 151 | 42 | 50 |
| matched-planner-010 | random | 100 | 100 | 1 | 100 | 205 | 58 | 11 | 55 | 64 | 53 |
| matched-planner-011 | perfect | 100 | 100 | 3 | 100 | 252 | 11 | 21 | 88 | 75 | 31 |
| matched-planner-011 | single-weak-item | 99 | 99 | 1 | 99 | 286 | 43 | 23 | 110 | 78 | 26 |
| matched-planner-011 | regional-weakness | 100 | 100 | 1 | 100 | 256 | 45 | 19 | 199 | 43 | 46 |
| matched-planner-011 | mixed | 100 | 100 | 0 | 100 | 239 | 52 | 16 | 141 | 58 | 56 |
| matched-planner-011 | random | 100 | 100 | 0 | 100 | 182 | 59 | 8 | 45 | 63 | 54 |
| matched-planner-012 | perfect | 100 | 100 | 2 | 100 | 252 | 11 | 21 | 85 | 77 | 31 |
| matched-planner-012 | single-weak-item | 99 | 99 | 0 | 99 | 286 | 43 | 23 | 110 | 78 | 26 |
| matched-planner-012 | regional-weakness | 100 | 100 | 1 | 100 | 257 | 46 | 19 | 220 | 34 | 50 |
| matched-planner-012 | mixed | 100 | 100 | 0 | 100 | 258 | 55 | 18 | 155 | 62 | 49 |
| matched-planner-012 | random | 100 | 100 | 0 | 100 | 206 | 59 | 11 | 75 | 81 | 49 |

## Pairwise comparisons

Deltas are comparison profile minus the matched near-perfect run. Positive values describe more of the named metric, not automatically better behavior.

### Near-perfect vs single weak item

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | 33 (33–33) | 12 of 12 |
| itemsIntroduced | -1 (-1–-1) | 0 of 12 |
| finalMasteredCount | -2 (-4–-1) | 0 of 12 |
| reviewSelections | 34 (34–34) | 12 of 12 |
| weakReviewSelections | 32 (32–32) | 12 of 12 |
| MidwestReviewSelections | 26 (21–28) | 12 of 12 |
| MidwestWeakReviewSelections | 39 (37–40) | 12 of 12 |
| WestSelections | 1 (-1–3) | 10 of 12 |
| OhioEncounters | 36 (36–36) | 12 of 12 |
| WyomingMaximumDeferral | -1 (-2–-1) | 0 of 12 |

### Near-perfect vs regional weakness

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | -2 (-33–17) | 5 of 12 |
| itemsIntroduced | 0 (0–0) | 0 of 12 |
| finalMasteredCount | -2 (-4–-1) | 0 of 12 |
| reviewSelections | -2 (-33–17) | 5 of 12 |
| weakReviewSelections | 37 (34–39) | 12 of 12 |
| MidwestReviewSelections | 116 (89–144) | 12 of 12 |
| MidwestWeakReviewSelections | 37 (30–39) | 12 of 12 |
| WestSelections | -42 (-48–-30) | 0 of 12 |
| OhioEncounters | 5 (-7–19) | 7 of 12 |
| WyomingMaximumDeferral | 6 (1–11) | 12 of 12 |

### Near-perfect vs mixed

| Metric | Median (range) delta | Positive seeds |
| --- | ---: | ---: |
| totalSelections | -12 (-37–19) | 3 of 12 |
| itemsIntroduced | 0 (0–0) | 0 of 12 |
| finalMasteredCount | -2 (-4–-1) | 0 of 12 |
| reviewSelections | -12 (-37–19) | 3 of 12 |
| weakReviewSelections | 42 (41–44) | 12 of 12 |
| MidwestReviewSelections | 40 (-2–74) | 11 of 12 |
| MidwestWeakReviewSelections | 29 (12–38) | 12 of 12 |
| WestSelections | -16.5 (-45–1) | 1 of 12 |
| OhioEncounters | -6 (-7–11) | 4 of 12 |
| WyomingMaximumDeferral | 8.5 (-5–13) | 10 of 12 |

## Regional analysis

Values are medians across the 12 runs for each profile. Candidate opportunities come from inferred Selection Trace pools. Selection rate normalizes selections by those opportunities; it is not a regional planner weight.

| Profile | Region | Introduced | Candidate opportunities | Selections | Review | Weak review | Error rate | Selection/opportunity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | Northeast | 18 | 1226 | 83 | 65 | 2 | 2.4% | 6.8% |
| perfect | Midwest | 24 | 1213 | 86 | 62 | 4 | 4.7% | 7.1% |
| perfect | South | 32 | 1890 | 106.5 | 74.5 | 2.5 | 2.3% | 5.6% |
| perfect | West | 26 | 1132 | 77 | 51 | 2 | 3.9% | 6.8% |
| single-weak-item | Northeast | 18 | 1231 | 84 | 66 | 0 | 0.0% | 6.8% |
| single-weak-item | Midwest | 23 | 1249 | 110 | 87 | 43 | 40.0% | 8.8% |
| single-weak-item | South | 32 | 1952 | 113 | 81 | 0 | 0.0% | 5.8% |
| single-weak-item | West | 26 | 1199 | 78 | 52 | 0 | 0.0% | 6.5% |
| regional-weakness | Northeast | 18 | 1305 | 47 | 29 | 1 | 3.1% | 3.7% |
| regional-weakness | Midwest | 24 | 1264.5 | 202.5 | 178.5 | 41 | 64.3% | 16.4% |
| regional-weakness | South | 32 | 1942.5 | 61.5 | 29.5 | 5 | 12.7% | 3.2% |
| regional-weakness | West | 26 | 1077 | 34 | 8 | 0.5 | 13.6% | 3.3% |
| mixed | Northeast | 18 | 1256 | 66 | 48 | 4 | 22.9% | 5.1% |
| mixed | Midwest | 24 | 1183.5 | 124 | 100 | 32.5 | 62.9% | 11.0% |
| mixed | South | 32 | 1881 | 84 | 52 | 11 | 36.8% | 4.5% |
| mixed | West | 26 | 974.5 | 60 | 34 | 1 | 37.1% | 5.9% |
| random | Northeast | 18 | 1168 | 89 | 71 | 23.5 | 45.6% | 7.7% |
| random | Midwest | 24 | 956.5 | 57 | 33 | 11 | 45.7% | 5.8% |
| random | South | 32 | 1592.5 | 83.5 | 51.5 | 17.5 | 45.6% | 5.3% |
| random | West | 26 | 675.5 | 61.5 | 35.5 | 7 | 47.1% | 9.3% |

The Midwest comparison is most informative in matched pairs: region size and curriculum order are held constant within each pair, while the response rule changes. West exposure remains partly constrained by curriculum arrival; an item outside an emitted candidate pool is not counted as eligible.

## Mastery and progression

| Profile | First complete introduction median (range) | First mastery median (range) | Final mastered median (range) |
| --- | --- | --- | --- |
| perfect | 39 (39–39); reached by 12 of 12 | 49 (49–49); reached by 12 of 12 | 2 (2–4) |
| single-weak-item | Unavailable; reached by 0 of 12 | 58 (50–59); reached by 4 of 12 | 0 (0–1) |
| regional-weakness | 43.5 (41–46); reached by 12 of 12 | 52 (41–59); reached by 8 of 12 | 1 (0–2) |
| mixed | 45 (40–51); reached by 12 of 12 | 55.5 (35–57); reached by 4 of 12 | 0 (0–2) |
| random | 53 (49–59); reached by 12 of 12 | 51 (27–54); reached by 7 of 12 | 0 (0–2) |

The JSON companion also records mastered counts at sessions 12, 24, 36, and 60 for every run. Null milestone values mean the run did not reach the milestone within 60 sessions; they are not converted to a numeric delay. The perfect profile's identical first-introduction and first-mastery sessions across all seeds indicate low seed sensitivity for those milestones under this response script. Other profiles show wider or absent milestone evidence.

## Seed sensitivity

- Wyoming/random-profile maximum deferral: 5–25 sessions.
- West/random-profile encounters: 1–13 Wyoming encounters across seeds; the aggregate table separately reports all West selections.
- Ohio/single-weak-item encounters: 44–44 across seeds.
- Random-profile Wyoming deferral outliers: matched-planner-010 at 5 sessions and matched-planner-012 at 25.
- Regional-weakness Midwest-selection outliers: matched-planner-010 at 176 and matched-planner-009 at 227.
- Mixed-profile West-selection outliers: matched-planner-005 at 31 and matched-planner-009 at 80.
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
