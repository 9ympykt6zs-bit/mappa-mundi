# U.S. Memory Trail long-horizon mastery report

This O6.3 report observes the production U.S. Memory Trail item-state model for 200 deterministic sessions. It does not change or endorse the current thresholds, scheduling, priorities, learner-state semantics, or content.

## Executive summary

- Near-perfect learners reached 25% mastery at 90 (88–92), 50% at 97 (97–98), 75% at 101.5 (101–102), 90% at 104 (104–104), and 95% at 108 (108–108). None reached 100% by session 200.
- All 100 items were first introduced for near-perfect learners at 39 (39–39). At that point all 100 (100–100) items had at least one correct demonstration, with 138 (138–138) correct and 4 (4–4) incorrect demonstrations overall, but 0 (0–0) items were currently mastered.
- The single-weak learner encountered Ohio 184 (184–184) times—every session from its introduction through session 200. Ohio continuously occupied the weak-review opportunity, and its unmet prerequisite kept Columbus unintroduced; the other 98 introduced items nevertheless reached mastery by session 150 in every seed.
- After complete introduction, the one-slot fairness lane was used 55 (54–60) times for near-perfect learners and 154 (153–157) times for regional-weakness learners. These selections can shift item encounters, lapses, regional totals, and mastery timing; the regenerated tables report those changes directly while weak remediation keeps the other nine cumulative slots.
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
| perfect | 50 | 100 (100–100) | 0 (0–0) | 76 (76–77) | 23 (22–23) | 0 (0–0) | 1 (1–1) | 1 (1–1) |
| perfect | 75 | 100 (100–100) | 0 (0–0) | 1 (1–1) | 90 (88–91) | 0 (0–0) | 9 (8–11) | 9 (8–11) |
| perfect | 100 | 100 (100–100) | 0 (0–0) | 2 (2–2) | 30 (28–33) | 0 (0–0) | 68 (65–70) | 68 (65–70) |
| perfect | 150 | 100 (100–100) | 0 (0–0) | 1 (0–2) | 5 (2–5) | 0 (0–0) | 94 (94–97) | 94 (94–97) |
| perfect | 200 | 100 (100–100) | 0 (0–0) | 2 (1–3) | 2.5 (1–3) | 0 (0–0) | 95.5 (95–97) | 95.5 (95–97) |
| single-weak-item | 25 | 64 (64–64) | 36 (36–36) | 59 (58–60) | 5 (4–6) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| single-weak-item | 50 | 99 (99–99) | 1 (1–1) | 58 (58–59) | 41 (39–41) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| single-weak-item | 75 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 94 (93–95) | 0 (0–0) | 4 (3–5) | 4 (3–5) |
| single-weak-item | 100 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 12 (11–13) | 0 (0–0) | 86 (85–87) | 86 (85–87) |
| single-weak-item | 150 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 0 (0–0) | 0 (0–0) | 98 (98–98) | 98 (98–98) |
| single-weak-item | 200 | 99 (99–99) | 1 (1–1) | 1 (1–1) | 0 (0–0) | 0 (0–0) | 98 (98–98) | 98 (98–98) |
| regional-weakness | 25 | 60.5 (55–64) | 39.5 (36–45) | 56 (50–59) | 5 (4–5) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| regional-weakness | 50 | 100 (100–100) | 0 (0–0) | 92.5 (88–95) | 7.5 (5–12) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| regional-weakness | 75 | 100 (100–100) | 0 (0–0) | 83 (79–85) | 15.5 (13–20) | 0 (0–0) | 1 (0–2) | 1 (0–2) |
| regional-weakness | 100 | 100 (100–100) | 0 (0–0) | 77.5 (73–83) | 20.5 (15–23) | 0 (0–0) | 2.5 (1–5) | 2.5 (1–5) |
| regional-weakness | 150 | 100 (100–100) | 0 (0–0) | 57.5 (48–66) | 38.5 (31–47) | 0 (0–0) | 4 (0–8) | 4 (0–8) |
| regional-weakness | 200 | 100 (100–100) | 0 (0–0) | 27 (22–33) | 68.5 (66–73) | 0 (0–0) | 3.5 (0–9) | 3.5 (0–9) |
| mixed | 25 | 61 (59–63) | 39 (37–41) | 57 (55–60) | 4 (3–5) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| mixed | 50 | 100 (100–100) | 0 (0–0) | 90 (85–95) | 9 (5–14) | 0 (0–0) | 1 (0–2) | 1 (0–2) |
| mixed | 75 | 100 (100–100) | 0 (0–0) | 69.5 (67–76) | 25.5 (20–28) | 0 (0–0) | 5 (2–7) | 5 (2–7) |
| mixed | 100 | 100 (100–100) | 0 (0–0) | 65.5 (60–71) | 24 (21–29) | 0 (0–0) | 9.5 (6–15) | 9.5 (6–15) |
| mixed | 150 | 100 (100–100) | 0 (0–0) | 59 (52–62) | 31.5 (28–40) | 0 (0–0) | 9.5 (5–16) | 9.5 (5–16) |
| mixed | 200 | 100 (100–100) | 0 (0–0) | 48.5 (36–51) | 42 (39–55) | 0 (0–0) | 8.5 (7–12) | 8.5 (7–12) |
| random | 25 | 52.5 (43–54) | 47.5 (46–57) | 50.5 (42–52) | 2 (1–3) | 0 (0–0) | 0 (0–0) | 0 (0–0) |
| random | 50 | 98 (89–100) | 2 (0–11) | 95.5 (89–97) | 2 (0–3) | 0 (0–0) | 0 (0–1) | 0 (0–1) |
| random | 75 | 100 (100–100) | 0 (0–0) | 85 (79–90) | 14 (7–17) | 0 (0–0) | 2 (1–4) | 2 (1–4) |
| random | 100 | 100 (100–100) | 0 (0–0) | 80 (78–81) | 13.5 (12–15) | 0 (0–0) | 7 (5–8) | 7 (5–8) |
| random | 150 | 100 (100–100) | 0 (0–0) | 63.5 (55–71) | 29.5 (20–39) | 0 (0–0) | 8 (5–11) | 8 (5–11) |
| random | 200 | 100 (100–100) | 0 (0–0) | 40 (28–44) | 50.5 (45–62) | 0 (0–0) | 10.5 (7–11) | 10.5 (7–11) |

The companion JSON also reports encounters, correct responses, misses, streak distributions, stability, retrievability, due backlog, review/relearning backlog, and Census-region mastery at every checkpoint.

## Milestones

| Profile | All introduced | First mastered | 25% | 50% | 75% | 90% | 95% | 100% |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| perfect | 39 (39–39) | 49 (49–49) | 90 (88–92) | 97 (97–98) | 101.5 (101–102) | 104 (104–104) | 108 (108–108) | Not reached |
| single-weak-item | Not reached | 59 (49–66) | 91 (91–92) | 95 (95–95) | 99 (99–99) | 101 (101–101) | 102 (102–102) | Not reached |
| regional-weakness | 46 (43–47) | 66 (46–83) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |
| mixed | 46 (39–47) | 34.5 (28–71) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |
| random | 53.5 (50–58) | 57.5 (42–70) | Not reached | Not reached | Not reached | Not reached | Not reached | Not reached |

Milestones shown as “Not reached” did not occur in 200 sessions. Seed-sensitivity labels are recorded in JSON using descriptive ranges only: highly stable (range width ≤2), moderately seed-sensitive (≤10), strongly seed-sensitive (>10), or censored when only some seeds reach a milestone.

## Diagnostic item histories

The table uses long-planner-001 as a readable representative trace; all six runs remain in JSON. Maine is the strong early state, Hawaii the late state, and Augusta (capital:augusta-me) the representative capital.

| Profile | Item | Introduced | Encounters | Correct | Misses | First mastery | Lapses | Recovery | Status transitions |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| perfect | state:ohio | 17 | 17 | 16 | 1 | 59 | 0 | None | 17:unseen→learning, 25:learning→review, 59:review→mastered |
| perfect | state:wyoming | 26 | 12 | 12 | 0 | 100 | 0 | None | 26:unseen→learning, 56:learning→review, 100:review→mastered |
| perfect | state:maine | 1 | 12 | 12 | 0 | 77 | 0 | None | 1:unseen→learning, 20:learning→review, 77:review→mastered |
| perfect | state:hawaii | 38 | 97 | 90 | 7 | 107 | 5 | 112→116, 124→129, 135→139, 159→163, 176→180 | 38:unseen→learning, 61:learning→review, 83:review→learning, 88:learning→review, 101:review→learning, 103:learning→review, 107:review→mastered, 112:mastered→review, 113:review→learning, 114:learning→review, 116:review→mastered, 124:mastered→review, 125:review→learning, 126:learning→review, 129:review→mastered, 135:mastered→review, 136:review→learning, 137:learning→review, 139:review→mastered, 159:mastered→review, 160:review→learning, 161:learning→review, 163:review→mastered, 176:mastered→review, 177:review→learning, 178:learning→review, 180:review→mastered |
| perfect | capital:augusta-me | 3 | 12 | 12 | 0 | 74 | 0 | None | 3:unseen→learning, 15:learning→review, 74:review→mastered |
| single-weak-item | state:ohio | 17 | 184 | 0 | 184 | Not reached | 0 | None | 17:unseen→learning |
| single-weak-item | state:wyoming | 25 | 16 | 16 | 0 | 96 | 0 | None | 25:unseen→learning, 54:learning→review, 96:review→mastered |
| single-weak-item | state:maine | 1 | 18 | 18 | 0 | 73 | 0 | None | 1:unseen→learning, 16:learning→review, 73:review→mastered |
| single-weak-item | state:hawaii | 36 | 16 | 16 | 0 | 102 | 0 | None | 36:unseen→learning, 59:learning→review, 102:review→mastered |
| single-weak-item | capital:augusta-me | 3 | 18 | 18 | 0 | 71 | 0 | None | 3:unseen→learning, 13:learning→review, 71:review→mastered |
| regional-weakness | state:ohio | 17 | 92 | 29 | 63 | 124 | 1 | 140→unrecovered | 17:unseen→learning, 87:learning→review, 90:review→learning, 104:learning→review, 108:review→learning, 116:learning→review, 124:review→mastered, 140:mastered→review, 141:review→learning, 194:learning→review |
| regional-weakness | state:wyoming | 25 | 3 | 3 | 0 | Not reached | 0 | None | 25:unseen→learning, 158:learning→review |
| regional-weakness | state:maine | 1 | 5 | 4 | 1 | Not reached | 0 | None | 1:unseen→learning, 48:learning→review, 200:review→learning |
| regional-weakness | state:hawaii | 35 | 3 | 3 | 0 | Not reached | 0 | None | 35:unseen→learning, 184:learning→review |
| regional-weakness | capital:augusta-me | 3 | 5 | 5 | 0 | Not reached | 0 | None | 3:unseen→learning, 13:learning→review |
| mixed | state:ohio | 17 | 64 | 23 | 41 | Not reached | 0 | None | 17:unseen→learning, 84:learning→review, 92:review→learning, 115:learning→review, 119:review→learning, 135:learning→review, 143:review→learning, 178:learning→review, 186:review→learning |
| mixed | state:wyoming | 28 | 3 | 3 | 0 | Not reached | 0 | None | 28:unseen→learning, 153:learning→review |
| mixed | state:maine | 1 | 8 | 7 | 1 | 165 | 0 | None | 1:unseen→learning, 68:learning→review, 165:review→mastered |
| mixed | state:hawaii | 44 | 7 | 6 | 1 | Not reached | 0 | None | 44:unseen→learning, 65:learning→review |
| mixed | capital:augusta-me | 3 | 4 | 4 | 0 | Not reached | 0 | None | 3:unseen→learning, 53:learning→review |
| random | state:ohio | 18 | 16 | 11 | 5 | 103 | 0 | None | 18:unseen→learning, 75:learning→review, 84:review→learning, 88:learning→review, 103:review→mastered |
| random | state:wyoming | 30 | 6 | 3 | 3 | Not reached | 0 | None | 30:unseen→learning |
| random | state:maine | 1 | 45 | 27 | 18 | 92 | 2 | 101→145, 153→unrecovered | 1:unseen→learning, 10:learning→review, 68:review→learning, 81:learning→review, 92:review→mastered, 101:mastered→review, 102:review→learning, 107:learning→review, 123:review→learning, 128:learning→review, 145:review→mastered, 153:mastered→review, 154:review→learning, 182:learning→review, 191:review→learning, 198:learning→review |
| random | state:hawaii | 43 | 3 | 3 | 0 | Not reached | 0 | None | 43:unseen→learning, 191:learning→review |
| random | capital:augusta-me | 3 | 8 | 4 | 4 | Not reached | 0 | None | 3:unseen→learning, 59:learning→review, 138:review→learning |

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

Per-session JSON distinguishes new, weak, fairness, older, recent, due, and other review reasons and counts reconstructed competing review items. A decline is descriptive only; lower review load does not automatically mean better pedagogy.

## Persistent Ohio weakness

- Ohio encounters by session 200: 184 (184–184).
- Other items mastered at session 200: single-weak 98 (98–98) of the other 99 curriculum items; near-perfect 94.5 (94–96). The single-weak run has only 98 other introduced items because Columbus remains prerequisite-blocked.
- Single-weak 25/50/75/90/95/100% milestones: 25% 91 (91–92); 50% 95 (95–95); 75% 99 (99–99); 90% 101 (101–101); 95% 102 (102–102); 100% Not reached.
- The representative item history shows whether Ohio continues taking the weak-review slot, while post-introduction review totals expose effects on other items. Finite deterministic evidence cannot prove permanent monopolization.

## Regional mastery

Final session-200 values are median (minimum–maximum), normalized by each region's curriculum item count in the percentage column.

| Profile | Census region | Mastered items | Mastered % |
| --- | --- | ---: | ---: |
| perfect | Northeast | 17 (15–18) | 94.4 (83.3–100) |
| perfect | Midwest | 23 (22–24) | 95.8 (91.7–100) |
| perfect | South | 32 (31–32) | 100 (96.9–100) |
| perfect | West | 24.5 (23–26) | 94.25 (88.5–100) |
| single-weak-item | Northeast | 18 (18–18) | 100 (100–100) |
| single-weak-item | Midwest | 22 (22–22) | 91.7 (91.7–91.7) |
| single-weak-item | South | 32 (32–32) | 100 (100–100) |
| single-weak-item | West | 26 (26–26) | 100 (100–100) |
| regional-weakness | Northeast | 0.5 (0–2) | 2.8 (0–11.1) |
| regional-weakness | Midwest | 1.5 (0–2) | 6.25 (0–8.3) |
| regional-weakness | South | 1.5 (0–3) | 4.7 (0–9.4) |
| regional-weakness | West | 0.5 (0–2) | 1.9 (0–7.7) |
| mixed | Northeast | 3 (1–5) | 16.7 (5.6–27.8) |
| mixed | Midwest | 0 (0–2) | 0 (0–8.3) |
| mixed | South | 3 (2–6) | 9.4 (6.3–18.8) |
| mixed | West | 2 (1–3) | 7.7 (3.8–11.5) |
| random | Northeast | 2.5 (1–4) | 13.9 (5.6–22.2) |
| random | Midwest | 1 (0–2) | 4.2 (0–8.3) |
| random | South | 3 (1–6) | 9.4 (3.1–18.8) |
| random | West | 3 (1–4) | 11.5 (3.8–15.4) |

The regional-weakness profile can therefore be compared with the matched near-perfect profile without confusing raw Midwest totals with the region's larger item count. Weak-review pressure and curriculum timing remain separate fields in JSON.

### Regional-weakness pressure after all items are introduced

| Region | Candidate opportunities | Review selections | Weak-review selections | Selection/opportunity |
| --- | ---: | ---: | ---: | ---: |
| Northeast | 2790 (2772–2844) | 42 (35–52) | 0 (0–0) | 0.015 (0.0126–0.0183) |
| Midwest | 3720 (3689–3792) | 1338 (1301–1373) | 155 (154–158) | 0.358 (0.3497–0.3681) |
| South | 4960 (4924–5056) | 98.5 (75–115) | 0 (0–0) | 0.02 (0.0152–0.0232) |
| West | 4027 (3978–4106) | 70.5 (59–90) | 0 (0–0) | 0.018 (0.0148–0.0226) |

This window begins only after all 100 items are introduced, so the large Midwest review pressure is not attributed to earlier curriculum arrival. The very low mastery outside the Midwest shows that persistent Midwest weakness also coincides with delayed mastery elsewhere; the report establishes the trajectory, not whether that tradeoff is desirable.

## Open questions

- Should broad successful coverage produce a user-facing accomplishment distinct from durable scheduler mastery?
- Is a 7-correct/4-streak mastery transition and subsequent lapse behavior appropriate for this product? O6.3 measures it but does not decide.
- Is the long tail of non-mastered items after sustained strong performance desirable spacing or excessive review friction?
- How should one persistent weak item affect curriculum completion and other-item review opportunity?
- Would human response time, confidence, or Journey evidence change the intended mastery interpretation? Those signals are outside this simulation.
