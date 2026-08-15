# Experimental demonstrated-progress score comparison

This is a non-production design experiment. The candidate scores estimate how strongly a learner has currently demonstrated a specific knowledge skill. They are not scheduler mastery, retention priority, due state, or production learner state, and none is wired into gameplay or UI.

## Executive summary

- **Recommended for further prototype work: Bayesian evidence.** It acknowledges one correct response at 0.500, falls to 0.286 after three contradictory misses, and preserves 0.786 after ten correct plus one miss. Its prior and evidence counts remain inspectable.
- **Best lucky-guess reversal:** BKT-inspired and current-system proxy fall furthest after one correct plus repeated misses, but Bayesian provides the best balance with strong-evidence resilience.
- **Best preservation of extensive successful evidence:** BKT preserves the most numerically, but it saturates near 1.0 and conflates latent learning with demonstrated progress. Bayesian preserves strong evidence without the same saturation.
- **Most satisfying one-pass result:** Bayesian shows every state-location skill at 0.50—acknowledged but neither high nor complete. All four models place the 50 items in the medium band under the provisional shared bands.
- **Easiest arithmetic to explain:** weighted evidence. Its clamp discards evidence depth, however: five correct plus one miss and ten correct plus one miss both finish at 0.760.
- **Unsuitable in current form:** BKT-inspired. A regional-weakness Ohio example can remain very high because no-forgetting and learning transitions answer a latent-knowledge question rather than the requested demonstrated-skill question.

## Score bands

- Unknown: no evidence.
- Low: 0.000–0.299.
- Medium: 0.300–0.649.
- High: 0.650–0.899.
- Complete: 0.900–1.000.

These bands and every model parameter are provisional design-test inputs, not product acceptance thresholds.

## Model definitions

### Model A — Simple weighted evidence

Start unknown; after evidence, add 0.34 for correct, subtract 0.24 for incorrect, add up to 0.12 for a correct streak, and clamp to 0–1.

Assumption: Correct and incorrect answers add or subtract fixed evidence; consecutive correct answers add a small bonus; the result is clamped to 0–1.

### Model B — Bayesian evidence

Start with an unshown Beta(1,2) prior. After evidence, score = (1 + correct) / (3 + correct + incorrect). Each provisional evidence weight is 1.

Assumption: A provisional Beta(1,2) prior is updated with one unit of evidence per correct or incorrect answer; the posterior mean is shown after evidence exists.

### Model C — BKT-inspired

Start with latent P(known)=0.20. Apply guess=0.25 and slip=0.10 Bayes updates, then a 0.12 learning transition after every response. No forgetting transition is applied.

Assumption: A latent-knowledge probability is updated using explicit guess/slip likelihoods and a learning transition after each response. There is no forgetting transition.

### Model D — Current-system-derived proxy

Project existing-style counters: 45% correctness ratio + 30% streak progress toward 4 + 25% correct-evidence progress toward 7. Stability, difficulty, retrievability, status, and time are excluded.

Assumption: Existing correct-count, times-seen, and correct-streak fields are projected into a visible 0–1 score. Scheduler status, stability, difficulty, and retrievability are deliberately excluded rather than pretending they measure demonstrated skill.


No optional time-decaying retention score was added. The current experiment deliberately keeps demonstrated progress separate from retention scheduling; none of the four scores changes during absence without a new response.

## Canonical sequence comparison

Final scores:

| Evidence history | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
| Never attempted | unknown | unknown | unknown | unknown |
| ✓ | 0.340 | 0.500 | 0.537 | 0.561 |
| ✓ ✓ | 0.720 | 0.600 | 0.830 | 0.671 |
| ✓ ✓ ✓ ✓ | 1.000 | 0.714 | 0.988 | 0.893 |
| ✓ ✗ | 0.100 | 0.400 | 0.238 | 0.261 |
| ✓ ✗ ✗ ✗ | 0.000 | 0.286 | 0.141 | 0.148 |
| ✓ ✓ ✓ ✓ ✓ ✗ | 0.760 | 0.667 | 0.981 | 0.554 |
| ✓ × 8 | 1.000 | 0.818 | 1.000 | 1.000 |
| ✗ | 0.000 | 0.250 | 0.148 | 0.000 |
| ✗ ✗ ✓ | 0.340 | 0.333 | 0.445 | 0.261 |
| ✗ ✗ ✓ ✓ ✓ | 1.000 | 0.500 | 0.934 | 0.602 |
| ✓ ✓ ✓, long absence, ✓ | 1.000 | 0.714 | 0.988 | 0.893 |
| ✓ ✓ ✓, long absence, ✗ | 0.760 | 0.571 | 0.761 | 0.445 |
| ✓ × 10, then ✗ | 0.760 | 0.786 | 1.000 | 0.659 |
| ✓, then ✗ × 5 | 0.000 | 0.222 | 0.139 | 0.111 |
| ✓ ✗ ✓ ✗ ✓ ✗ | 0.300 | 0.444 | 0.272 | 0.332 |

### Score after every response

Gap events are omitted from the path because no candidate changes without a response.

| Evidence history | Weighted trajectory | Bayesian trajectory | BKT trajectory | Current-proxy trajectory |
| --- | --- | --- | --- | --- |
| ✓ | 0.340 | 0.500 | 0.537 | 0.561 |
| ✓ ✓ | 0.340 → 0.720 | 0.500 → 0.600 | 0.537 → 0.830 | 0.561 → 0.671 |
| ✓ ✓ ✓ ✓ | 0.340 → 0.720 → 1.000 → 1.000 | 0.500 → 0.600 → 0.667 → 0.714 | 0.537 → 0.830 → 0.953 → 0.988 | 0.561 → 0.671 → 0.782 → 0.893 |
| ✓ ✗ | 0.340 → 0.100 | 0.500 → 0.400 | 0.537 → 0.238 | 0.561 → 0.261 |
| ✓ ✗ ✗ ✗ | 0.340 → 0.100 → 0.000 → 0.000 | 0.500 → 0.400 → 0.333 → 0.286 | 0.537 → 0.238 → 0.155 → 0.141 | 0.561 → 0.261 → 0.186 → 0.148 |
| ✓ ✓ ✓ ✓ ✓ ✗ | 0.340 → 0.720 → 1.000 → 1.000 → 1.000 → 0.760 | 0.500 → 0.600 → 0.667 → 0.714 → 0.750 → 0.667 | 0.537 → 0.830 → 0.953 → 0.988 → 0.997 → 0.981 | 0.561 → 0.671 → 0.782 → 0.893 → 0.929 → 0.554 |
| ✓ × 8 | 0.340 → 0.720 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 | 0.500 → 0.600 → 0.667 → 0.714 → 0.750 → 0.778 → 0.800 → 0.818 | 0.537 → 0.830 → 0.953 → 0.988 → 0.997 → 0.999 → 1.000 → 1.000 | 0.561 → 0.671 → 0.782 → 0.893 → 0.929 → 0.964 → 1.000 → 1.000 |
| ✗ | 0.000 | 0.250 | 0.148 | 0.000 |
| ✗ ✗ ✓ | 0.000 → 0.000 → 0.340 | 0.250 → 0.200 → 0.333 | 0.148 → 0.140 → 0.445 | 0.000 → 0.000 → 0.261 |
| ✗ ✗ ✓ ✓ ✓ | 0.000 → 0.000 → 0.340 → 0.720 → 1.000 | 0.250 → 0.200 → 0.333 → 0.429 → 0.500 | 0.148 → 0.140 → 0.445 → 0.774 → 0.934 | 0.000 → 0.000 → 0.261 → 0.446 → 0.602 |
| ✓ ✓ ✓, long absence, ✓ | 0.340 → 0.720 → 1.000 → 1.000 | 0.500 → 0.600 → 0.667 → 0.714 | 0.537 → 0.830 → 0.953 → 0.988 | 0.561 → 0.671 → 0.782 → 0.893 |
| ✓ ✓ ✓, long absence, ✗ | 0.340 → 0.720 → 1.000 → 0.760 | 0.500 → 0.600 → 0.667 → 0.571 | 0.537 → 0.830 → 0.953 → 0.761 | 0.561 → 0.671 → 0.782 → 0.445 |
| ✓ × 10, then ✗ | 0.340 → 0.720 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 0.760 | 0.500 → 0.600 → 0.667 → 0.714 → 0.750 → 0.778 → 0.800 → 0.818 → 0.833 → 0.846 → 0.786 | 0.537 → 0.830 → 0.953 → 0.988 → 0.997 → 0.999 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 | 0.561 → 0.671 → 0.782 → 0.893 → 0.929 → 0.964 → 1.000 → 1.000 → 1.000 → 1.000 → 0.659 |
| ✓, then ✗ × 5 | 0.340 → 0.100 → 0.000 → 0.000 → 0.000 → 0.000 | 0.500 → 0.400 → 0.333 → 0.286 → 0.250 → 0.222 | 0.537 → 0.238 → 0.155 → 0.141 → 0.139 → 0.139 | 0.561 → 0.261 → 0.186 → 0.148 → 0.126 → 0.111 |
| ✓ ✗ ✓ ✗ ✓ ✗ | 0.340 → 0.100 → 0.440 → 0.200 → 0.540 → 0.300 | 0.500 → 0.400 → 0.500 → 0.429 → 0.500 → 0.444 | 0.537 → 0.238 → 0.586 → 0.259 → 0.611 → 0.272 | 0.561 → 0.261 → 0.446 → 0.296 → 0.452 → 0.332 |

## Lucky-guess analysis

| Scenario | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
| firstCorrect | 0.340 | 0.500 | 0.537 | 0.561 |
| oneCorrectThreeMisses | 0.000 | 0.286 | 0.141 | 0.148 |
| oneCorrectFiveMisses | 0.000 | 0.222 | 0.139 | 0.111 |

Weighted evidence reverses most abruptly because it clamps at zero. BKT and the current proxy also make persistent contradiction visibly weak. Bayesian falls below the low/medium boundary after one correct and three misses while preserving the complete evidence counts.

## Strong-evidence resilience

| Scenario | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: |
| fiveCorrect | 1.000 | 0.750 | 0.997 | 0.929 |
| fiveCorrectOneMiss | 0.760 | 0.667 | 0.981 | 0.554 |
| tenCorrectOneMiss | 0.760 | 0.786 | 1.000 | 0.659 |

The weighted clamp makes five and ten prior successes indistinguishable after one miss. The current proxy loses its entire streak component on a miss. BKT barely moves after saturation. Bayesian gives the most directly explainable diminishing impact from a single contradictory observation.

## Recovery after two misses

| Model | Score after misses | Correct answers to high | Correct answers to complete | Scores after successive correct answers |
| --- | ---: | ---: | ---: | --- |
| weighted-evidence | 0.000 | 2 | 3 | 0.340 → 0.720 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 |
| bayesian-evidence | 0.200 | 7 | not reached | 0.333 → 0.429 → 0.500 → 0.556 → 0.600 → 0.636 → 0.667 → 0.692 → 0.714 → 0.733 → 0.750 → 0.765 |
| bkt-inspired | 0.140 | 2 | 3 | 0.445 → 0.774 → 0.934 → 0.983 → 0.996 → 0.999 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 → 1.000 |
| current-system-proxy | 0.000 | 4 | 7 | 0.261 → 0.446 → 0.602 → 0.743 → 0.800 → 0.852 → 0.900 → 0.910 → 0.918 → 0.925 → 0.931 → 0.936 |

## Long absence

All candidates preserve the exact pre-gap score across a simulated 365-day absence. This is intentional: the experiment treats elapsed-time review pressure as a scheduler concern. A future retention-confidence comparison would be a different score with a different label.

## Synthetic learner examples

The existing U.S. Memory Trail planner ran unchanged for 60 matched-seed sessions. Its responses were replayed as evidence into each isolated model.

Memory Trail currently exposes item/mode histories, not a unified Ohio × location/identification/relationship skill model. Each item history below is therefore a stand-in candidate skill stream for comparing formulas, not evidence that production already separates every required skill.

| Example | Observations | Weighted | Bayesian | BKT-inspired | Current proxy |
| --- | ---: | ---: | ---: | ---: | ---: |
| Single weak — Ohio | 44 | 0.000 | 0.021 | 0.138 | 0.000 |
| Single weak — strong Maine | 6 | 1.000 | 0.778 | 0.999 | 0.964 |
| Regional weakness — Ohio | 13 | 1.000 | 0.438 | 0.940 | 0.572 |
| Regional weakness — Michigan | 25 | 0.720 | 0.393 | 0.785 | 0.580 |
| Near-perfect — Maine | 8 | 1.000 | 0.727 | 0.999 | 0.944 |
| Random — Maine | 12 | 1.000 | 0.467 | 0.948 | 0.589 |

The JSON report also includes score-band counts and Census-region averages for all five profiles. The current-system proxy is verified against the actual final planner counters for diagnostic items; it is still an invented projection, not a production field.

## Perfect 50-state location pass

| Model | Score per state | Aggregate average | Unknown | Low | Medium | High | Complete |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| weighted-evidence | 0.340 | 34.0% | 0 | 0 | 50 | 0 | 0 |
| bayesian-evidence | 0.500 | 50.0% | 0 | 0 | 50 | 0 | 0 |
| bkt-inspired | 0.537 | 53.7% | 0 | 0 | 50 | 0 | 0 |
| current-system-proxy | 0.561 | 56.1% | 0 | 0 | 50 | 0 | 0 |

Every model acknowledges a correct first demonstration without calling it durable mastery or complete. Bayesian's 50% result is the clearest provisional expression of “demonstrated once, needs more evidence.”

## Tradeoffs against product criteria

| Model | Strengths | Weaknesses |
| --- | --- | --- |
| weighted-evidence | Immediate acknowledgement; simple arithmetic; quick reversal after repeated misses | Clamp saturation discards accumulated evidence; fixed increments are highly parameter-sensitive; some failure-heavy recent-correct histories can recover to implausibly high values |
| bayesian-evidence | All evidence remains visible in the posterior; lucky guesses reverse; one miss has diminishing impact after extensive success; prior and evidence weights are explainable | Provisional prior is uncalibrated; plain Beta evidence does not model response order or retention; question-specific guessing needs an explicit extension |
| bkt-inspired | Explicit guess and slip assumptions; fast recovery; bounded latent probability | No-forgetting and learning transitions rapidly saturate; parameter interactions are less intuitive; latent knowledge is not the same construct as demonstrated-progress |
| current-system-proxy | Uses existing counters; easy to compute read-only; acknowledges one successful demonstration | Formula weights are invented; streak reset creates a large one-miss drop; excluding scheduler fields is honest but makes this only a partial projection |

## Recommendation

Prototype **Model B, Bayesian evidence**, one level further—but still outside production. It best balances lucky-guess reversibility, accumulated evidence, strong-evidence resilience, and developer explainability.

Do not advance the BKT-inspired model as the visible demonstrated-progress bar in its current form. Keep weighted evidence only as a simple baseline, and keep the current-system proxy as a diagnostic comparison rather than treating it as an existing score.

Before any production decision, resolve:

- Prior strength and whether it varies by question type
- How to incorporate multiple-choice guess probability without turning the score into scheduler mastery
- Whether evidence should be skill-specific and activity-weighted
- Whether a user-facing complete band should require breadth or only per-skill evidence
- How much recent evidence order should matter

No recommendation in this report is implemented in production.
