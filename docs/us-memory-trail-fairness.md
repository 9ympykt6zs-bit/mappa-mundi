# U.S. Memory Trail cumulative-review fairness

The U.S. Memory Trail reserves at most one of its ten cumulative-review slots for fairness. This is a starvation guard around the existing adaptive ranking, not a replacement ranking or a new learner-state model.

## Rule

The planner first applies its existing cumulative-review eligibility rule: only introduced, learning, review, or mastered items enter the pool. It then builds the ordinary ten-item adaptive plan using the existing weak, due, miss-count, last-seen, seeded-tie, and curriculum-order comparison.

If an eligible due item remains outside that plan, the planner replaces only the tenth adaptive selection with the waiting candidate that has the earliest due session, then the oldest last-seen session. Existing seeded tie-breaking and curriculum order resolve any remaining tie. The emitted plan records that one item in `fairnessReviewItems`; Selection Trace and the Learning Inspector identify it as `fairness-review` with `longest-waiting-eligible-due-item` evidence.

The lane remains empty when every eligible due item already fits in the adaptive plan. It never makes an unseen or prerequisite-blocked item eligible, and an item whose due session is still in the future cannot use the fairness lane. Learning sessions and new-item batches do not call the fairness selector.

## Verification

`scripts/check-united-states-memory-trail-fairness.mjs` verifies deterministic production-planner behavior:

- one continuously failed item remains selected while fifteen other due items all receive review;
- with ten continuously weak items, nine of ten slots retain weak adaptive pressure in every session while the fairness lane reaches all twenty initially waiting due items;
- the first fairness selection is the longest-waiting due item and seeded replay is exact;
- the initial 3-item New England introduction remains unchanged and emits no fairness selection;
- a lane is not forced when all due items fit in the normal plan;
- seventy future-due mastered items receive no slots while thirty due non-mastered items are available.

The neutral 10,000-selection report remains within its regional and state/capital bounds, and its controlled mastered-pressure checks continue to pass. The matched-seed and 200-session reports were regenerated after the behavior change. Their fairness counts and changed mastery, lapse, region, and deferral observations are reported rather than normalized back to the earlier trajectories.

## Scope

This guard establishes eventual opportunity for continuously eligible due items once U.S. Memory Trail reaches cumulative review. It does not change prerequisite semantics, guarantee that blocked unseen content becomes eligible, or establish the equivalent property for Daily Trail; that planner requires separate eligibility and starvation analysis.
