# Bayesian demonstrated-progress visualization prototype

> Non-production UX/model validation artifact. This prototype does not read or write learner state, affect scheduling, change mastery thresholds, alter planner behavior, or appear in normal navigation.

## Answer in brief

The most understandable approach is **Option B, label + segmented bar**, with **Option C, skill breakdown**, available when a learner opens an item. The label tells the learner what the bar claims; the bar makes relative strength quickly scannable; the breakdown makes weaknesses actionable. Option A is too ambiguous on its own.

The display feels most honest when it says **Demonstrated** rather than “50% mastered,” reports breadth separately (for example, **50 of 50 state locations demonstrated**), and explains changes in plain language. The provisional thresholds and Beta(1,2) prior are experiment inputs, not proposed production mastery rules.

## Prototype model and representation

Each record contains an item ID, skill ID, cloned evidence history, Bayesian score, display category, change explanation, evidence summary, and deterministic ten-segment display. The score is:

`(1 + correct responses) / (3 + correct responses + misses)`

The hidden Beta(1,2) prior is not displayed as learner history. With no responses the score is `null`, never zero. Time gaps are retained in the evidence history but do not change the score by themselves.

Display-only categories:

- **Unseen:** no response evidence; score is `null`.
- **Needs review:** 0.000–0.299.
- **Demonstrated:** 0.300–0.649.
- **Strong evidence:** 0.650–1.000.

There is deliberately no “mastered,” “permanent,” or “complete” category. These category boundaries are UX hypotheses, not internal mastery thresholds.

For groups, the bar averages every requested item-skill. Unseen items contribute empty space instead of being silently omitted, while attempted/unseen counts remain visible. This rewards breadth without confusing an unseen item with a scored failure.

## Display experiments

### Option A — simple segmented bar

```text
Location
████████░░
```

This is fast to scan but fails the comprehension test by itself: a learner cannot tell whether it means course completion, recent accuracy, permanent mastery, or current evidence.

### Option B — label + bar

```text
Location
Strong evidence
████████░░
```

This is the best default summary. “Strong evidence” constrains the meaning without claiming permanence. A short information affordance would still be needed in any future user test.

### Option C — skill breakdown

```text
Ohio

Location
Strong evidence
████████░░

Identification
Strong evidence
███████░░░

Capital
Strong evidence
███████░░░

Relationships
Needs review
██░░░░░░░░
```

This is the best diagnostic view because it shows what to practice. It is too dense as the only overview for 50 states, so it should be progressive disclosure rather than the default grid.

## Twelve required histories

| History | Score | Category | Segmented display | Why it changed |
| --- | ---: | --- | --- | --- |
| Never attempted | — | Unseen | ░░░░░░░░░░ | No retrieval evidence yet. Unseen is intentionally different from a 0% score. |
| One correct answer | 0.500 | Demonstrated | █████░░░░░ | A first correct response added positive evidence and set demonstrated-knowledge progress to 50%. |
| Three correct answers | 0.667 | Strong evidence | ███████░░░ | A correct response added positive evidence, moving progress from 60% to 67%. |
| Perfect first exposure | 0.500 | Demonstrated | █████░░░░░ | A first correct response added positive evidence and set demonstrated-knowledge progress to 50%. |
| One correct followed by five misses | 0.222 | Needs review | ██░░░░░░░░ | A miss added contradictory evidence, moving progress from 25% to 22%. Earlier successful evidence was kept. |
| Five correct followed by one miss | 0.667 | Strong evidence | ███████░░░ | A miss added contradictory evidence, moving progress from 75% to 67%. Earlier successful evidence was kept. |
| Ten correct followed by one miss | 0.786 | Strong evidence | ████████░░ | A miss added contradictory evidence, moving progress from 85% to 79%. Earlier successful evidence was kept. |
| Persistent Ohio failure | 0.182 | Needs review | ██░░░░░░░░ | A miss added contradictory evidence, moving progress from 20% to 18%. Earlier successful evidence was kept. |
| One state in a perfect 50-state pass | 0.500 | Demonstrated | █████░░░░░ | A first correct response added positive evidence and set demonstrated-knowledge progress to 50%. |
| Long absence without new evidence | 0.667 | Strong evidence | ███████░░░ | No new response was recorded during the 365-day absence, so demonstrated-knowledge progress stayed at 67%. |
| Long absence followed by a correct answer | 0.714 | Strong evidence | ███████░░░ | A correct response after a 365-day absence added positive evidence, moving progress from 67% to 71%. |
| Long absence followed by a miss | 0.571 | Demonstrated | ██████░░░░ | A miss after a 365-day absence added contradictory evidence, moving progress from 67% to 57%. Earlier successful evidence was kept. |

“One correct answer” and “perfect first exposure” are intentionally numerically identical for one skill: both contain one successful retrieval. The latter becomes meaningfully different only at group scope, where every skill or item in the exposure can be shown as demonstrated.

## User comprehension

A naked bar is not self-explanatory. A learner is more likely to understand the construct when the persistent heading says **Demonstrated knowledge**, the adjacent state says **Unseen / Needs review / Demonstrated / Strong evidence**, and a change explanation names the new evidence. Avoid a percent sign as the dominant visual: “50%” invites a course-completion or test-grade interpretation that the model cannot support.

The group view needs two readings at once: evidence strength and breadth. “50 of 50 demonstrated” answers breadth; the half-filled bars answer evidence depth. Neither should substitute for the other.

## Psychological behavior

- **Acknowledges success:** one correct retrieval immediately changes Unseen to Demonstrated and fills five segments.
- **Avoids overstating mastery:** one correct never becomes Strong evidence, and no display says mastered.
- **Avoids unfair loss:** absence alone leaves the bar unchanged. A later miss moves the score only because it is new contradictory evidence, and the explanation says earlier successes were retained.
- **Makes weaknesses obvious:** Needs review uses both a text label and a distinct visual treatment; skill breakdown identifies the weak skill rather than labeling all of Ohio weak.

A potential emotional problem remains: after three correct answers, one later miss moves 0.667 to 0.571 and crosses from Strong evidence to Demonstrated. The plain Beta model is order-insensitive and the categorical boundary makes that small continuous change look larger. User testing should specifically probe that transition before any production consideration.

## Perfect-pass scenario: all 50 state locations correct once

The prototype shows:

- **50 of 50** state-location skills attempted;
- **50 Demonstrated**, 0 Unseen, 0 Needs review, 0 Strong evidence;
- **0.500 aggregate evidence score** and `█████░░░░░`;
- every state individually labeled **Demonstrated** with a half-filled bar.

**Would this make a learner who knows the United States feel recognized?** With the breadth statement—“50 of 50 state locations demonstrated”—yes, it recognizes the concrete accomplishment without pretending a single pass proves durable knowledge. With only a 50% bar, no: that could feel like a failing grade after perfection. The breadth badge or completion statement is therefore essential, and the bar should be secondary.

This result also reveals a model/UX tension: Beta(1,2) deliberately discounts a single correct answer, so perfect observed accuracy produces only 0.500 evidence per item. The prototype should validate that tension; it should not fix it by changing the prior or thresholds in this task.

## Persistent weakness scenario: Ohio

History: miss, miss, correct, miss, miss, miss, miss, miss.

- Score: **0.182**
- Category: **Needs review**
- Display: `██░░░░░░░░`
- Explanation: A miss added contradictory evidence, moving progress from 20% to 18%. Earlier successful evidence was kept.

**Would a learner understand why Ohio needs more practice?** The label and explanation make the direction clear, but the final-event explanation alone is insufficient context. Showing **1 correct / 7 misses** beside it makes the reason concrete. The skill-level view is also important: the product should say “Ohio — Location needs review,” not imply that every fact about Ohio is weak.

## Ohio skill experiment

| Skill | Evidence | Score | Category | Display |
| --- | --- | ---: | --- | --- |
| Location | 10 correct / 1 misses | 0.786 | Strong evidence | ████████░░ |
| Identification | 3 correct / 0 misses | 0.667 | Strong evidence | ███████░░░ |
| Capital | 5 correct / 1 misses | 0.667 | Strong evidence | ███████░░░ |
| Relationships | 1 correct / 5 misses | 0.222 | Needs review | ██░░░░░░░░ |

The group average is **0.585 (Demonstrated)**, but the breakdown is more useful than that average because it exposes Relationships as the actionable weakness.

## Recommendation

Advance a **label + bar summary with an expandable skill breakdown** into learner interviews or an instrumented mockup, still outside production. In those tests:

1. Lead with breadth recognition after a perfect pass.
2. Describe the construct as demonstrated knowledge, never mastery or a grade.
3. Keep absence neutral; explain only evidence-driven changes.
4. Always pair Needs review with the skill name and evidence counts.
5. Test category-boundary drops for perceived unfairness.

Do not choose a final schema, recalibrate the prior, change thresholds, or connect this artifact to learner state based on this prototype alone.

## Artifact boundaries

- JSON: `reports/bayesian-progress-visualization-prototype.json`
- Developer page: `tools/bayesian-progress-prototype.html`
- Generator: `scripts/run-bayesian-progress-prototype.mjs`
- Focused validation: `scripts/check-bayesian-progress-prototype.mjs`

The HTML file is intentionally unlinked from `index.html`, app menus, and normal navigation.
