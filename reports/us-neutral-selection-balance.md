# Neutral U.S. selection balance report

This deterministic report holds all 100 U.S. Memory Trail items at identical mastery and scheduling state, then performs 1,000 independent seeded cumulative-review plans for 10,000 selections. It measures the production planner without updating learner state or changing selection behavior.

## Census-region balance

| Region | Eligible items | Eligible share | Selections | Selection share | Relative difference | Within ±20% |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Midwest | 24 | 24.00% | 2417 | 24.17% | +0.71% | Yes |
| Northeast | 18 | 18.00% | 1764 | 17.64% | -2.00% | Yes |
| South | 32 | 32.00% | 3228 | 32.28% | +0.88% | Yes |
| West | 26 | 26.00% | 2591 | 25.91% | -0.35% | Yes |

## Item-type balance

| Item type | Eligible items | Eligible share | Selections | Selection share | Relative difference | Within ±20% |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| capital | 50 | 50.00% | 5049 | 50.49% | +0.98% | Yes |
| state | 50 | 50.00% | 4951 | 49.51% | -0.98% | Yes |

## Starvation and reproducibility

- Per-item selection range: 73–134.
- Eligible items never selected: none.
- All region shares within ±20% of eligible share: yes.
- All item-type shares within ±20% of eligible share: yes.
- Same seed and state replay exactly in the focused automated check.

## Scope limit

The planner selects curriculum items before downstream prompt-form choice, so this report verifies Census-region and state/capital item-type balance, not locating-versus-identifying prompt-form balance or non-Memory-Trail activities.
