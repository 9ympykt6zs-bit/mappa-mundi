# U.S. Memory Trail long-horizon mastery report

This O6.3 report observes the production U.S. Memory Trail item-state model for 200 deterministic sessions. It does not change or endorse the current thresholds, scheduling, priorities, learner-state semantics, or content.

## Executive summary

- Near-perfect learners reached 25% mastery at 89 (88–90), 50% at 97 (97–97), 75% at 102 (101–102), 90% at 104 (104–104), and 95% at 108 (107–113). None reached 100% by session 200.
- All 100 items were first introduced for near-perfect learners at 39 (39–39). At that point all 100 (100–100) items had at least one correct demonstration, with 138 (138–138) correct and 4 (4–4) incorrect demonstrations overall, but 0 (0–0) items were currently mastered.
- The single-weak learner encountered Ohio 184 (184–184) times—every session from its introduction through session 200. Ohio continuously occupied the weak-review opportunity, and its unmet prerequisite kept Columbus unintroduced; the other 98 introduced items nevertheless reached mastery by session 150 in every seed.
- The current Memory Trail state has no separate domain-level “I know the United States” or full-error-free-pass state. Broad demonstrated competence and scheduler item mastery therefore cannot be represented as separate accomplishments by this model.
- Mastery is not necessarily absorbing: diagnostic histories record when a mastered item lapses after later evidence and whether it recovers.

## Experiment

- Six matched planner seeds, five required learner profiles, and 200 sessions per run (30 runs total).
- Checkpoints: 25, 50, 75, 100, 150, 200.
- Planner and answer seeds are separate; each matched seed group shares its planner seed and deterministic answer stream.
- “Mastered” means the status emitted by the current production U.S. Memory Trail planner. This reporter does not restate or alter the transition threshold.

## Mastery curves

Values are median (minimum–maximum) across six planner seeds. Learning includes the source statuses “introduced” and “learning”; unknown statuses, if any, remain separately validated in JSON.

| Profile | Session | Introduced | Unseen | Learning | Review | Relearning | Mastered | Mastered % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | 25 | 63 (63–63) | 37 (37–37) | 57.5 (56–58) | 5.5 (5–7) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| perfect | 50 | 100 (100–100) | 0 (0–0) | 77 (76–78) | 22 (21–23) | 0 (0–0) | 1 (1–1) | 1 (1–1) |
| perfect | 75 | 100 (100–100) | 0 (0–0) | 1 (1–1) | 89.5 (88–90) | 0 (0–0) | 9.5 (9–11) | 9.5 (9–11) |
| perfect | 100 | 100 (100–100) | 0 (0–0) | 2 (2–2) | 30 (29–31) | 0 (0–0) | 68 (67–69) | 68 (67–69) |
| perfect | 150 | 100 (100–100) | 0 (0–0) | 1 (0–1) | 4 (2–6) | 0 (0–0) | 95 (94–97) | 95 (94–97) |
| perfect | 200 | 100 (100–100) | 0 (0–0) | 2 (1–3) | 2 (1–4) | 0 (0–0) | 95.5 (93–97) | 95.5 (93–97) |
| single-weak-item | 25 | 64 (64–64) | 36 (36–36) | 59 (58–60) | 5 (4–6) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| single-weak-item | 50 | 99 (99–99) | 1 (1–1) | 59 (59–60) | 40 (38–40) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| single-weak-item | 75 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 94 (93–95) | 0 (0–0) | 4 (3–5) | 4 (3–5) |
| single-weak-item | 100 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 12.5 (12–13) | 0 (0–0) | 85.5 (85–86) | 85.5 (85–86) |
| single-weak-item | 150 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 0 (0–0) | 0 (0–0) | 98 (98–98) | 98 (98–98) |
| single-weak-item | 200 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 0 (0–0) | 0 (0–0) | 98 (98–98) | 98 (98–98) |
| regional-weakness | 25 | 60.5 (55–64) | 39.5 (36–45) | 56 (50–59) | 5 (4–5) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| regional-weakness | 50 | 100 (100–100) | 0 (0–0) | 91 (89–96) | 8.5 (4–11) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| regional-weakness | 75 | 100 (100–100) | 0 (0–0) | 87.5 (79–89) | 10.5 (10–16) | 0 (0–0) | 2 (1–6) | 2 (1–6) |
| regional-weakness | 100 | 100 (100–100) | 0 (0–0) | 82.5 (73–86) | 13 (9–17) | 0 (0–0) | 4.5 (2–11) | 4.5 (2–11) |
| regional-weakness | 150 | 100 (100–100) | 0 (0–0) | 79.5 (71–90) | 13.5 (4–16) | 0 (0–0) | 8 (3–14) | 8 (3–14) |
| regional-weakness | 200 | 100 (100–100) | 0 (0–0) | 76 (74–86) | 14.5 (4–20) | 0 (0–0) | 9 (4–15) | 9 (4–15) |
| mixed | 25 | 61 (59–63) | 39 (37–41) | 57 (55–60) | 4 (3–5) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| mixed | 50 | 100 (100–100) | 0 (0–0) | 89.5 (81–94) | 9 (6–18) | 0 (0–0) | 1 (0–2) | 1 (0–2) |
| mixed | 75 | 100 (100–100) | 0 (0–0) | 72 (69–77) | 20 (18–24) | 0 (0–0) | 7 (4–10) | 7 (4–10) |
| mixed | 100 | 100 (100–100) | 0 (0–0) | 66.5 (63–72) | 16 (13–19) | 0 (0–0) | 17.5 (12–20) | 17.5 (12–20) |
| mixed | 150 | 100 (100–100) | 0 (0–0) | 74.5 (65–80) | 17 (9–18) | 0 (0–0) | 11.5 (6–18) | 11.5 (6–18) |
| mixed | 200 | 100 (100–100) | 0 (0–0) | 74 (68–77) | 17 (8–21) | 0 (0–0) | 10.5 (7–16) | 10.5 (7–16) |
| random | 25 | 52.5 (43–54) | 47.5 (46–57) | 50.5 (42–52) | 2 (1–3) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| random | 50 | 98 (89–100) | 2 (0–11) | 94.5 (89–97) | 2 (0–4) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| random | 75 | 100 (100–100) | 0 (0–0) | 83.5 (75–88) | 14.5 (12–22) | 0 (0–0) | 1.5 (0–4) | 1.5 (0–4) |
| random | 100 | 100 (100–100) | 0 (0–0) | 78 (75–81) | 12.5 (11–19) | 0 (0–0) | 7.5 (6–11) | 7.5 (6–11) |
| random | 150 | 100 (100–100) | 0 (0–0) | 74.5 (70–80) | 13.5 (12–20) | 0 (0–0) | 9 (4–17) | 9 (4–17) |
| random | 200 | 100 (100–100) | 0 (0–0) | 72.5 (71–78) | 15.5 (9–18) | 0 (0–0) | 12 (8–16) | 12 (8–16) |

The companion JSON also reports encounters, correct responses, misses, streak distributions, stability, retrievability, due backlog, review/relearning backlog, and Census-region mastery at every checkpoint.

## Milestones

| Profile | All introduced | First mastered | 25% | 50% | 75% | 90% | 95% | 100% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | 39 (39–39) | 49 (49–49) | 89 (88–90) | 97 (97–97) | 102 (101–102) | 104 (104–104) | 108 (107–113) | Not reached |
| single-weak-item | Not reached | 59 (49–66) | 90.5 (90–91) | 95 (95–95) | 99 (99–99) | 101 (101–101) | 102 (102–102) | Not reached |
| regional-weakness | 46 (43–47) | 59 (44–63) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |
| mixed | 46 (39–47) | 34.5 (28–64) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |
| random | 54.5 (49–58) | 58.5 (42–71) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |

Milestones shown as “Not reached” did not occur in 200 sessions. Seed-sensitivity labels are recorded in JSON using descriptive ranges only: highly stable (range width ≤2), moderately seed-sensitive (≤10), strongly seed-sensitive (>10), or censored when only some seeds reach a milestone.

## Diagnostic item histories

The table uses long-planner-001 as a readable representative trace; all six runs remain in JSON. Maine is the strong early state, Hawaii the late state, and Augusta (capital:augusta-me) the representative capital.

| Profile | Item | Introduced | Encounters | Correct | Misses | First mastery | Lapses | Recovery | Status transitions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| perfect | state:ohio | 17 | 18 | 17 | 1 | 59 | 0 | None | 17:unseen→learning, 25:learning→review, 59:review→mastered |
| perfect | state:wyoming | 26 | 12 | 12 | 0 | 100 | 0 | None | 26:unseen→learning, 57:learning→review, 100:review→mastered |
| perfect | state:maine | 1 | 12 | 12 | 0 | 77 | 0 | None | 1:unseen→learning, 20:learning→review, 77:review→mastered |
| perfect | state:hawaii | 38 | 16 | 15 | 1 | 101 | 0 | None | 38:unseen→learning, 61:learning→review, 83:review→learning, 88:learning→review, 101:review→mastered |
| perfect | capital:augusta-me | 3 | 12 | 12 | 0 | 74 | 0 | None | 3:unseen→learning, 15:learning→review, 74:review→mastered |
| single-weak-item | state:ohio | 17 | 184 | 0 | 184 | Not reached | 0 | None | 17:unseen→learning |
| single-weak-item | state:wyoming | 25 | 16 | 16 | 0 | 98 | 0 | None | 25:unseen→learning, 54:learning→review, 98:review→mastered |
| single-weak-item | state:maine | 1 | 18 | 18 | 0 | 71 | 0 | None | 1:unseen→learning, 16:learning→review, 71:review→mastered |
| single-weak-item | state:hawaii | 36 | 16 | 16 | 0 | 101 | 0 | None | 36:unseen→learning, 59:learning→review, 101:review→mastered |
| single-weak-item | capital:augusta-me | 3 | 18 | 18 | 0 | 71 | 0 | None | 3:unseen→learning, 13:learning→review, 71:review→mastered |
| regional-weakness | state:ohio | 17 | 85 | 29 | 56 | Not reached | 0 | None | 17:unseen→learning, 70:learning→review, 81:review→learning, 92:learning→review, 103:review→learning, 116:learning→review, 120:review→learning, 131:learning→review, 134:review→learning, 144:learning→review, 150:review→learning, 176:learning→review, 184:review→learning |
| regional-weakness | state:wyoming | 25 | 1 | 1 | 0 | Not reached | 0 | None | 25:unseen→learning |
| regional-weakness | state:maine | 1 | 3 | 3 | 0 | Not reached | 0 | None | 1:unseen→learning, 98:learning→review |
| regional-weakness | state:hawaii | 35 | 1 | 1 | 0 | Not reached | 0 | None | 35:unseen→learning |
| regional-weakness | capital:augusta-me | 3 | 3 | 3 | 0 | Not reached | 0 | None | 3:unseen→learning, 13:learning→review |
| mixed | state:ohio | 17 | 2 | 2 | 0 | Not reached | 0 | None | 17:unseen→learning |
| mixed | state:wyoming | 28 | 2 | 2 | 0 | Not reached | 0 | None | 28:unseen→learning |
| mixed | state:maine | 1 | 3 | 3 | 0 | Not reached | 0 | None | 1:unseen→learning, 59:learning→review |
| mixed | state:hawaii | 44 | 13 | 10 | 3 | 98 | 0 | None | 44:unseen→learning, 60:learning→review, 78:review→learning, 84:learning→review, 98:review→mastered |
| mixed | capital:augusta-me | 3 | 3 | 3 | 0 | Not reached | 0 | None | 3:unseen→learning, 59:learning→review |
| random | state:ohio | 18 | 57 | 31 | 26 | Not reached | 0 | None | 18:unseen→learning, 59:learning→review, 65:review→learning, 88:learning→review, 91:review→learning, 98:learning→review, 108:review→learning, 112:learning→review, 122:review→learning, 127:learning→review, 135:review→learning, 140:learning→review, 153:review→learning, 158:learning→review, 165:review→learning, 173:learning→review, 181:review→learning, 185:learning→review, 197:review→learning |
| random | state:wyoming | 30 | 2 | 1 | 1 | Not reached | 0 | None | 30:unseen→learning |
| random | state:maine | 1 | 55 | 32 | 23 | 80 | 2 | 87→103, 123→180 | 1:unseen→learning, 10:learning→review, 58:review→learning, 70:learning→review, 80:review→mastered, 87:mastered→review, 88:review→learning, 92:learning→review, 103:review→mastered, 123:mastered→review, 124:review→learning, 128:learning→review, 134:review→learning, 138:learning→review, 144:review→learning, 153:learning→review, 157:review→learning, 171:learning→review, 180:review→mastered |
| random | state:hawaii | 43 | 1 | 1 | 0 | Not reached | 0 | None | 43:unseen→learning |
| random | capital:augusta-me | 3 | 4 | 3 | 1 | Not reached | 0 | None | 3:unseen→learning, 93:learning→review |

## Perfect-run analysis

For the near-perfect profile, the first complete curriculum encounter occurs at 39 (39–39). At that point every item has at least one correct demonstration; the learner has made 138 (138–138) correct and 4 (4–4) incorrect demonstrations, but only 0 (0–0) items are currently mastered.

The planner does not define a “full pass” over all introduced material, so the report cannot honestly claim one occurred. It can show that every item has been encountered and whether every item has at least one correct demonstration. The U.S. Memory Trail state contains item progress and a curriculum cursor, but no separate journey/domain-complete achievement. This is evidence of a representation gap between broad accomplishment and long-term scheduled item mastery; whether the product should add such an accomplishment is a product decision, not an O6.3 implementation change.

## Review load after complete introduction

| Profile | First 25 post-introduction sessions: reviews/session | Last 25 sessions: reviews/session | Decline observed |
| --- | ---: | ---: | ---: |
| perfect | 9.64 (9.64–9.64) | 10 (10–10) | 0 of 6 |
| single-weak-item | Not reached | Not reached | 0 of 0 |
| regional-weakness | 9.68 (9.68–9.68) | 10 (10–10) | 0 of 6 |
| mixed | 9.68 (9.68–9.68) | 10 (10–10) | 0 of 6 |
| random | 9.68 (9.64–9.68) | 10 (10–10) | 0 of 6 |

Per-session JSON distinguishes new, weak, older, recent, due, and other review reasons and counts reconstructed competing review items. A decline is descriptive only; lower review load does not automatically mean better pedagogy.

## Persistent Ohio weakness

- Ohio encounters by session 200: 184 (184–184).
- Other items mastered at session 200: single-weak 98 (98–98) of the other 99 curriculum items; near-perfect 94.5 (93–96). The single-weak run has only 98 other introduced items because Columbus remains prerequisite-blocked.
- Single-weak 25/50/75/90/95/100% milestones: 25% 90.5 (90–91); 50% 95 (95–95); 75% 99 (99–99); 90% 101 (101–101); 95% 102 (102–102); 100% Not reached.
- The representative item history shows whether Ohio continues taking the weak-review slot, while post-introduction review totals expose effects on other items. Finite deterministic evidence cannot prove permanent monopolization.

## Regional mastery

Final session-200 values are median (minimum–maximum), normalized by each region's curriculum item count in the percentage column.

| Profile | Census region | Mastered items | Mastered % |
| --- | --- | ---: | ---: |
| perfect | Northeast | 17 (15–17) | 94.4 (83.3–94.4) |
| perfect | Midwest | 23.5 (22–24) | 97.9 (91.7–100) |
| perfect | South | 30.5 (29–32) | 95.35 (90.6–100) |
| perfect | West | 25 (24–26) | 96.2 (92.3–100) |
| single-weak-item | Northeast | 18 (18–18) | 100 (100–100) |
| single-weak-item | Midwest | 22 (22–22) | 91.7 (91.7–91.7) |
| single-weak-item | South | 32 (32–32) | 100 (100–100) |
| single-weak-item | West | 26 (26–26) | 100 (100–100) |
| regional-weakness | Northeast | 1 (0–4) | 5.6 (0–22.2) |
| regional-weakness | Midwest | 0 (0–2) | 0 (0–8.3) |
| regional-weakness | South | 4.5 (2–7) | 14.05 (6.3–21.9) |
| regional-weakness | West | 2 (0–6) | 7.65 (0–23.1) |
| mixed | Northeast | 3.5 (1–5) | 19.45 (5.6–27.8) |
| mixed | Midwest | 1 (0–3) | 4.2 (0–12.5) |
| mixed | South | 3 (1–4) | 9.4 (3.1–12.5) |
| mixed | West | 3.5 (2–7) | 13.45 (7.7–26.9) |
| random | Northeast | 4.5 (3–7) | 25 (16.7–38.9) |
| random | Midwest | 2 (1–5) | 8.3 (4.2–20.8) |
| random | South | 2 (0–5) | 6.25 (0–15.6) |
| random | West | 3 (0–4) | 11.5 (0–15.4) |

The regional-weakness profile can therefore be compared with the matched near-perfect profile without confusing raw Midwest totals with the region's larger item count. Weak-review pressure and curriculum timing remain separate fields in JSON.

### Regional-weakness pressure after all items are introduced

| Region | Candidate opportunities | Review selections | Weak-review selections | Selection/opportunity |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 2790 (2772–2844) | 21.5 (5–48) | 0 (0–0) | 0.008 (0.0018–0.0172) |
| Midwest | 3720 (3689–3792) | 1401 (1286–1487) | 155 (154–158) | 0.375 (0.3457–0.397) |
| South | 4960 (4924–5056) | 91 (47–153) | 0 (0–0) | 0.018 (0.0093–0.0308) |
| West | 4027 (3978–4106) | 35 (13–95) | 0 (0–0) | 0.009 (0.0033–0.0238) |

This window begins only after all 100 items are introduced, so the large Midwest review pressure is not attributed to earlier curriculum arrival. The very low mastery outside the Midwest shows that persistent Midwest weakness also coincides with delayed mastery elsewhere; the report establishes the trajectory, not whether that tradeoff is desirable.

## Open questions

- Should broad successful coverage produce a user-facing accomplishment distinct from durable scheduler mastery?
- Is a 7-correct/4-streak mastery transition and subsequent lapse behavior appropriate for this product? O6.3 measures it but does not decide.
- Is the long tail of non-mastered items after sustained strong performance desirable spacing or excessive review friction?
- How should one persistent weak item affect curriculum completion and other-item review opportunity?
- Would human response time, confidence, or Journey evidence change the intended mastery interpretation? Those signals are outside this simulation.
