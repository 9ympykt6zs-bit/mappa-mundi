# Learning progress reset authority

Canonical evidence is Mappa Mundi's durable shared learning history. Scored modes append equivalent learner evidence to that history for reporting, orchestration, and cross-mode interpretation. Daily Trail, U.S. Memory Trail, Journey, activity, and Reconstruction stores may continue to own their distinct scheduling, resume, and progression state; those stores are not competing cross-mode evidence authorities.

## Reset policy

Scoped controls remain scoped:

- **Restart Activity** clears progress for the current activity.
- **Reset All Daily Trail Progress** clears only Daily Trail scheduling, goals, and learning progression.
- **Reset United States Memory Trail** clears only that trail's scheduling and progression.
- Journey difficulty resets and Reconstruction “start over” actions likewise clear only their named mode state.

None of those actions deletes canonical evidence. A learner's durable history therefore does not disappear merely because one practice mode is restarted.

**Reset All Learning Progress** is the sole global learning reset. It requires a separate explicit confirmation and reloads the application after successful removal so no stale in-memory learner state survives. It is intentionally global across Mappa Mundi rather than U.S.-only.

## Cleared-store manifest

`src/learning-progress-reset.js` owns the fixed allowlist. The global reset clears exactly these persisted learner-state stores:

| Store | Storage key | Learner-state responsibility |
| --- | --- | --- |
| Journey progress | `atlasQuestProgress` | Active Journey, step, difficulty completion, and resume |
| Activity progress | `geography-memory-activity-progress` | Completed targets within ordinary activities |
| Completed activities | `geography-memory-completed-activities` | Activity-level completion registry |
| Daily Trail | `mappaDailyTrailProgress` | Goals, item learning state, scheduling, checkpoints, and session resume |
| U.S. Memory Trail | `mappaUnitedStatesMemoryTrailProgress` | State/capital item learning state, scheduling, and session resume |
| Place mastery | `mappaPlaceMastery` | Legacy mastery-signal counters |
| Canonical evidence | `mappaMundiCanonicalEvidence` | Durable cross-mode attempt history |
| Canonical Progress Report cohort | `mappaProgressReportCanonicalCohort` | Versioned canonical-read-path enrollment metadata |
| Lower 48 Reconstruction | `mappa-mundi-map-reconstruction-lower-48` | Capstone reconstruction resume snapshot |

The reset attempts every manifest entry even if one removal fails, then reports failure rather than reloading. The operation is deterministic and idempotent. A new persisted learner-state store must be deliberately added to this manifest and its focused test; broad prefix deletion or `localStorage.clear()` is prohibited.

## Preserved settings and preferences

Because the reset removes only the manifest above, it preserves map/study/audio settings, selected difficulty, mute state, onboarding state, legacy layer preferences, developer presentation overrides, and unknown future preference keys. In particular, it does not clear `atlasQuestSettings`, `geography-memory-difficulty-mode`, `atlasQuestAudioMuted`, or `atlasQuestOnboardingSeen`.

## Verification

`scripts/check-learning-progress-reset.mjs` pins the nine-store manifest, unique/frozen ordering, deterministic replay, idempotence, storage-failure continuation, scoped canonical retention, runtime wiring, explicit labels, and preservation of known plus unknown preference keys.

The Playwright reset flows run on desktop and mobile-sized Chromium. They verify explicit confirmation/cancellation, scoped Daily Trail and U.S. Memory Trail retention of canonical history, activity restart retention of canonical history, global removal of every manifest key, preference survival after reload, and absence of runtime errors.
