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

## Prompt-objective balance

The production prompt selector intentionally targets a 50/50 locating/identifying mix during ordinary review and an easier 70/30 mix during early-chunk support.

| Profile | Objective | Intended share | Prompts | Actual share | Relative difference | Within ±20% |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| ordinary-review | locating | 50.00% | 5000 | 50.00% | +0.00% | Yes |
| ordinary-review | identifying | 50.00% | 5000 | 50.00% | +0.00% | Yes |
| early-chunk-support | locating | 70.00% | 7000 | 70.00% | +0.00% | Yes |
| early-chunk-support | identifying | 30.00% | 3000 | 30.00% | +0.00% | Yes |

## Starvation and reproducibility

- Per-item selection range: 73–134.
- Eligible items never selected: none.
- All region shares within ±20% of eligible share: yes.
- All item-type shares within ±20% of eligible share: yes.
- All prompt-objective shares within ±20% of their intentional profile target: yes.
- Prompt objectives never selected: none.
- Mastered share when 30 due non-mastered items compete with 70 future-mastered items: 0.00%.
- All due mastered items remained eligible across the controlled probe: yes.
- Same seed and state replay exactly in the focused automated check.

## Mastered-item pressure

- Mixed due-review setup: 70 mastered items scheduled in the future; 30 due review items.
- Mixed selections: 2000 non-mastered; 0 mastered.
- All-mastered setup: All 100 mastered items are due with equivalent scheduling evidence.
- All-mastered selections: 2000; never selected: none.

## Scope limit

This report verifies U.S. Memory Trail item selection and its production locating-versus-identifying prompt selector. It does not project objective balance across Journey, Mental Map, Connections, reconstruction, or other non-Memory-Trail activities.
