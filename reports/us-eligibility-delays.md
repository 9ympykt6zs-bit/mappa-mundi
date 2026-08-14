# U.S. Memory Trail eligibility delay report

This report measures how long items wait after appearing in a planner candidate pool. Eligibility is an inferred, read-only reconstruction from Selection Trace using the planner's existing helpers. A long delay does not automatically mean a bug, and a short delay does not automatically mean good pedagogy.

## Cross-profile observations

- Random learner Wyoming: eligible in 10 sessions, selected in 1, maximum observed deferral 8; unresolved episodes 2.
- Single-weak-item Ohio: eligible in 20 sessions, selected in 20, maximum delay 0, maximum consecutive selections 20. Delay is low because Ohio repeatedly wins the weak-review slot; frequency and delay measure different risks.
- Regional-weakness Midwest: 283 eligible opportunities and 50 selections. This measures item-level candidate pressure, not explicit regional weighting.
- Items outside emitted candidate pools, including curriculum-blocked unseen items, are not counted as eligible.

Across profiles, the largest delays are generally early-curriculum items remaining in large older-review pools with only one older-review slot. These items were selected previously; an unresolved post-selection deferral is not the same as “never selected.” Eligibility-signal categories are mutually exclusive in this order: new, weak, due, recent, older, other.

## Perfect learner

- Sessions simulated: 36
- Items observed as eligible or selected: 92 of 100
- Maximum observed deferral: 28 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 6.702 sessions
- Average delay for episodes that ended in selection: 2.427 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 87

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Massachusetts | state | Northeast | 36 | 3 | 28 | Unresolved episode |
| Dover | capital | South | 30 | 1 | 28 | Unresolved episode |
| Connecticut | state | Northeast | 36 | 3 | 27 | Unresolved episode |
| Concord | capital | Northeast | 34 | 2 | 26 | Unresolved episode |
| Harrisburg | capital | Northeast | 30 | 2 | 26 | Unresolved episode |
| Augusta | capital | Northeast | 34 | 2 | 25 | Unresolved episode |
| Albany | capital | Northeast | 29 | 2 | 25 | Unresolved episode |
| Boston | capital | Northeast | 34 | 3 | 24 | Unresolved episode |
| Montpelier | capital | Northeast | 29 | 2 | 24 | Unresolved episode |
| Columbia | capital | South | 26 | 1 | 24 | Unresolved episode |
| Raleigh | capital | South | 26 | 1 | 24 | Unresolved episode |
| North Carolina | state | South | 26 | 1 | 24 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 124 | 92 | 32 | 74.2% |
| recent-review | 16 | 3 | 13 | 18.8% |
| older-review | 1448 | 32 | 1416 | 2.2% |
| weak-review | 4 | 4 | 0 | 100.0% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 124 | 92 | 32 | 74.2% |
| due-review | 1365 | 35 | 1330 | 2.6% |
| recent-review | 3 | 0 | 3 | 0.0% |
| older-review | 96 | 0 | 96 | 0.0% |
| weak-review | 4 | 4 | 0 | 100.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 584 | 42 | 542 | 7.2% |
| South | 649 | 38 | 611 | 5.9% |
| Midwest | 294 | 31 | 263 | 10.5% |
| West | 65 | 20 | 45 | 30.8% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 805 | 77 | 728 | 9.6% |
| capital | 787 | 54 | 733 | 6.9% |

## Single weak item learner

- Sessions simulated: 36
- Items observed as eligible or selected: 97 of 100
- Maximum observed deferral: 25 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 6.102 sessions
- Average delay for episodes that ended in selection: 2.848 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 93

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Augusta | capital | Northeast | 34 | 2 | 25 | Unresolved episode |
| Hartford | capital | Northeast | 34 | 2 | 24 | Unresolved episode |
| Columbia | capital | South | 26 | 1 | 24 | Unresolved episode |
| Raleigh | capital | South | 26 | 1 | 24 | Unresolved episode |
| Annapolis | capital | South | 25 | 1 | 24 | Unresolved episode |
| Richmond | capital | South | 25 | 1 | 24 | Unresolved episode |
| Maine | state | Northeast | 36 | 5 | 23 | Unresolved episode |
| Charleston | capital | South | 25 | 2 | 23 | Resolved |
| Providence | capital | Northeast | 34 | 2 | 22 | Unresolved episode |
| Boston | capital | Northeast | 34 | 3 | 22 | Unresolved episode |
| Concord | capital | Northeast | 34 | 3 | 22 | Unresolved episode |
| North Carolina | state | South | 26 | 2 | 22 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 127 | 97 | 30 | 76.4% |
| recent-review | 16 | 3 | 13 | 18.8% |
| older-review | 1478 | 32 | 1446 | 2.2% |
| weak-review | 19 | 19 | 0 | 100.0% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 127 | 97 | 30 | 76.4% |
| due-review | 1408 | 33 | 1375 | 2.3% |
| recent-review | 2 | 2 | 0 | 100.0% |
| older-review | 84 | 0 | 84 | 0.0% |
| weak-review | 19 | 19 | 0 | 100.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 584 | 45 | 539 | 7.7% |
| South | 656 | 40 | 616 | 6.1% |
| Midwest | 300 | 42 | 258 | 14.0% |
| West | 100 | 24 | 76 | 24.0% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 837 | 91 | 746 | 10.9% |
| capital | 803 | 60 | 743 | 7.5% |

## Forgetting learner

- Sessions simulated: 36
- Items observed as eligible or selected: 96 of 100
- Maximum observed deferral: 27 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 6.267 sessions
- Average delay for episodes that ended in selection: 2.267 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 86

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Concord | capital | Northeast | 34 | 2 | 27 | Unresolved episode |
| Boston | capital | Northeast | 34 | 2 | 26 | Unresolved episode |
| New Hampshire | state | Northeast | 36 | 4 | 25 | Unresolved episode |
| Providence | capital | Northeast | 34 | 2 | 24 | Unresolved episode |
| Columbia | capital | South | 26 | 1 | 24 | Unresolved episode |
| Raleigh | capital | South | 26 | 1 | 24 | Unresolved episode |
| North Carolina | state | South | 26 | 1 | 24 | Unresolved episode |
| South Carolina | state | South | 26 | 1 | 24 | Unresolved episode |
| Annapolis | capital | South | 25 | 1 | 24 | Unresolved episode |
| Charleston | capital | South | 25 | 1 | 24 | Unresolved episode |
| Richmond | capital | South | 25 | 1 | 24 | Unresolved episode |
| Maryland | state | South | 25 | 1 | 24 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 128 | 96 | 32 | 75.0% |
| recent-review | 16 | 3 | 13 | 18.8% |
| older-review | 1441 | 32 | 1409 | 2.2% |
| weak-review | 15 | 15 | 0 | 100.0% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 128 | 96 | 32 | 75.0% |
| due-review | 1384 | 34 | 1350 | 2.5% |
| recent-review | 2 | 1 | 1 | 50.0% |
| older-review | 71 | 0 | 71 | 0.0% |
| weak-review | 15 | 15 | 0 | 100.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 584 | 54 | 530 | 9.3% |
| South | 648 | 46 | 602 | 7.1% |
| Midwest | 292 | 24 | 268 | 8.2% |
| West | 76 | 22 | 54 | 28.9% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 805 | 87 | 718 | 10.8% |
| capital | 795 | 59 | 736 | 7.4% |

## Regional weakness learner

- Sessions simulated: 36
- Items observed as eligible or selected: 83 of 100
- Maximum observed deferral: 30 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 5.449 sessions
- Average delay for episodes that ended in selection: 1.279 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 76

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| New Hampshire | state | Northeast | 36 | 2 | 30 | Unresolved episode |
| Massachusetts | state | Northeast | 36 | 3 | 29 | Unresolved episode |
| Dover | capital | South | 30 | 1 | 28 | Unresolved episode |
| Harrisburg | capital | Northeast | 30 | 1 | 28 | Unresolved episode |
| Delaware | state | South | 30 | 1 | 28 | Unresolved episode |
| Pennsylvania | state | Northeast | 30 | 1 | 28 | Unresolved episode |
| Albany | capital | Northeast | 29 | 1 | 28 | Unresolved episode |
| Montpelier | capital | Northeast | 29 | 1 | 28 | Unresolved episode |
| Trenton | capital | Northeast | 29 | 1 | 28 | Unresolved episode |
| New Jersey | state | Northeast | 29 | 1 | 28 | Unresolved episode |
| New York | state | Northeast | 29 | 1 | 28 | Unresolved episode |
| Vermont | state | Northeast | 29 | 1 | 28 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 107 | 83 | 24 | 77.6% |
| weak-review | 157 | 22 | 135 | 14.0% |
| recent-review | 15 | 3 | 12 | 20.0% |
| older-review | 1266 | 32 | 1234 | 2.5% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 107 | 83 | 24 | 77.6% |
| weak-review | 227 | 33 | 194 | 14.5% |
| due-review | 1146 | 24 | 1122 | 2.1% |
| recent-review | 4 | 0 | 4 | 0.0% |
| older-review | 61 | 0 | 61 | 0.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 584 | 35 | 549 | 6.0% |
| South | 633 | 42 | 591 | 6.6% |
| Midwest | 283 | 50 | 233 | 17.7% |
| West | 45 | 13 | 32 | 28.9% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 842 | 92 | 750 | 10.9% |
| capital | 703 | 48 | 655 | 6.8% |

## Mixed learner

- Sessions simulated: 36
- Items observed as eligible or selected: 90 of 100
- Maximum observed deferral: 35 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 4.772 sessions
- Average delay for episodes that ended in selection: 0.628 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 84

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Maine | state | Northeast | 36 | 1 | 35 | Unresolved episode |
| Rhode Island | state | Northeast | 36 | 1 | 34 | Unresolved episode |
| Massachusetts | state | Northeast | 36 | 2 | 34 | Unresolved episode |
| Augusta | capital | Northeast | 34 | 1 | 33 | Unresolved episode |
| Boston | capital | Northeast | 34 | 1 | 33 | Unresolved episode |
| Hartford | capital | Northeast | 34 | 1 | 32 | Unresolved episode |
| Providence | capital | Northeast | 34 | 1 | 32 | Unresolved episode |
| Dover | capital | South | 30 | 1 | 28 | Unresolved episode |
| Harrisburg | capital | Northeast | 30 | 1 | 28 | Unresolved episode |
| Delaware | state | South | 30 | 1 | 28 | Unresolved episode |
| Pennsylvania | state | Northeast | 30 | 1 | 28 | Unresolved episode |
| Albany | capital | Northeast | 29 | 1 | 28 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 110 | 90 | 20 | 81.8% |
| recent-review | 15 | 3 | 12 | 20.0% |
| weak-review | 131 | 31 | 100 | 23.7% |
| older-review | 1308 | 32 | 1276 | 2.5% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 110 | 90 | 20 | 81.8% |
| due-review | 1209 | 15 | 1194 | 1.2% |
| recent-review | 3 | 1 | 2 | 33.3% |
| weak-review | 198 | 50 | 148 | 25.3% |
| older-review | 44 | 0 | 44 | 0.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 585 | 36 | 549 | 6.2% |
| South | 623 | 54 | 569 | 8.7% |
| Midwest | 301 | 48 | 253 | 16.0% |
| West | 55 | 18 | 37 | 32.7% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 794 | 79 | 715 | 10.0% |
| capital | 770 | 77 | 693 | 10.0% |

## Seeded random learner

- Sessions simulated: 36
- Items observed as eligible or selected: 74 of 100
- Maximum observed deferral: 35 consecutive eligible-but-not-selected sessions
- Average observed deferral across resolved and unresolved episodes: 4.555 sessions
- Average delay for episodes that ended in selection: 1.35 sessions
- Never selected despite eligibility: none
- Unresolved deferral items at or before the report boundary: 66

### Highest item delays

| Item | Type | Region | Eligible sessions | Selected sessions | Max delay | Notes |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Maine | state | Northeast | 36 | 1 | 35 | Unresolved episode |
| New Hampshire | state | Northeast | 36 | 1 | 35 | Unresolved episode |
| Massachusetts | state | Northeast | 36 | 2 | 34 | Unresolved episode |
| Rhode Island | state | Northeast | 36 | 3 | 32 | Unresolved episode |
| Augusta | capital | Northeast | 34 | 2 | 32 | Unresolved episode |
| Concord | capital | Northeast | 34 | 2 | 31 | Unresolved episode |
| Providence | capital | Northeast | 34 | 2 | 31 | Unresolved episode |
| Boston | capital | Northeast | 34 | 2 | 30 | Unresolved episode |
| Connecticut | state | Northeast | 36 | 3 | 29 | Unresolved episode |
| Delaware | state | South | 30 | 2 | 24 | Unresolved episode |
| Vermont | state | Northeast | 30 | 2 | 24 | Unresolved episode |
| Albany | capital | Northeast | 28 | 1 | 24 | Unresolved episode |

### Planner-pool analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new | 90 | 74 | 16 | 82.2% |
| recent-review | 15 | 3 | 12 | 20.0% |
| weak-review | 267 | 34 | 233 | 12.7% |
| older-review | 1095 | 32 | 1063 | 2.9% |

### Eligibility-signal analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| new-item | 90 | 74 | 16 | 82.2% |
| due-review | 947 | 11 | 936 | 1.2% |
| weak-review | 393 | 57 | 336 | 14.5% |
| recent-review | 4 | 1 | 3 | 25.0% |
| older-review | 33 | 0 | 33 | 0.0% |

### Census-region analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 586 | 53 | 533 | 9.0% |
| South | 622 | 55 | 567 | 8.8% |
| Midwest | 240 | 32 | 208 | 13.3% |
| West | 19 | 3 | 16 | 15.8% |

### Item-type analysis

| Group | Eligible opportunities | Selections | Deferred | Selection rate |
| --- | ---: | ---: | ---: | ---: |
| state | 794 | 80 | 714 | 10.1% |
| capital | 673 | 63 | 610 | 9.4% |

## Interpretation limits

The report cannot prove permanent starvation from a finite 36-session window, identify an exact pairwise comparator clause, or determine whether any delay is pedagogically appropriate. It does not cover Daily Trail because Daily Trail does not currently expose its discarded full candidate pool.
