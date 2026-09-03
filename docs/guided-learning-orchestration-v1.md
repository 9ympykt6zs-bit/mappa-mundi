# Guided Learning Orchestration v1

## Purpose

Guided Learning coordinates a sequence of existing learning activities. It does not replace their gameplay, scoring, evidence, rendering, or persistence. The learning rhythm is **Teach → Retrieve → Integrate → Continue**, with handoffs from Guided Learning to an existing activity and back to the existing Guided planner.

## Generated physical-feature blocks

The orchestration configuration uses stable block IDs and five bounded block types:

- `guided-section`: the fallback that resumes the existing Guided Learning planner;
- `reconstruction-checkpoint`: the existing New England Regional Reconstruction activity;
- `physical-feature-introduction`: a focused teaching view using the feature family's existing rendering;
- `physical-feature-practice`: the existing Memory Trail engine targeted to a small learned comparison cohort;
- `connection-checkpoint`: the existing U.S. Connections engine targeted to one authored relationship, when one exists.

Rivers, lakes, and mountain ranges are generated from the shared U.S. atlas, canonical concept contracts, existing activity targets, and authored state–feature relationships. A feature can follow **Show → Name → Highlight → Guided tap → Retrieve → optional Connection → Return**, but retrieval runs only when at least two compatible features have been introduced. During teaching, one new feature is named and highlighted at a time while the other cohort geography remains available as context. The learner must tap the highlighted feature before teaching advances. A valid Connection may follow an individual introduction while cohort retrieval waits for another member. The configuration does not duplicate activity mechanics or geographic facts. Great Salt Lake deliberately omits the Connection step because none is authored.

The original White Mountains slice and its New England Reconstruction dependency remain intact. The generalized contract adds the other safely supported physical features without changing Reconstruction itself.

## Physical learning cohorts

Physical retrieval requires meaningful alternatives: two introduced members minimum and three preferred when a safe small authored grouping supports them. Introduction and retrieval readiness are separate. Each feature keeps its own political prerequisites, so an eligible member may be taught without prematurely introducing a cohort neighbor. If only one member is introduced, it remains available for later cohort practice and the one-answer retrieval loop is skipped. When two or three compatible members are available, Guided Learning removes the teaching highlight and starts mixed locating prompts such as “Find the Green Mountains.” The target is not highlighted or labeled before the independent response.

The authored-data audit found:

- Rivers already define `western-rivers` and `central-eastern-rivers` Memory Trail sections. The western group is the authored three-feature Colorado/Columbia/Rio Grande cohort. The supported central/eastern members are presented in deterministic groups of up to three; St. Lawrence remains excluded because its geometry is incomplete.
- The Eastern Mountains activity is one broad eight-feature activity and does not contain a small Northeast subsection. The product-approved White Mountains, Green Mountains, and Adirondack Mountains subset is therefore recorded explicitly as a bounded subgroup of that authored activity, rather than described as pre-existing authored curriculum.
- Midwestern Mountains is an authored three-feature activity, and Alaska Mountains is an authored two-feature activity; both are safe cohorts.
- Western Mountains is too broad for novice cohort retrieval, the remaining Eastern Mountains lack an approved small subgroup, and Lakes currently provide one broad six-feature activity with no authored small group. Those retrieval groupings are deferred instead of fabricating distractors. Their introductions and eligible Connections remain available.

For the Northeast cohort, White Mountains retains its Maine/New Hampshire prerequisite, Green Mountains retains Vermont, and Adirondack Mountains retains New York. White and Green can therefore be introduced and retrieved together before New York is covered. Adirondacks joins a later comparison/retrieval set after its own prerequisite becomes covered. If all three are eligible initially, all three are introduced together.

### Demonstrate, then space

Guided physical cohort practice is a bounded retrieval checkpoint rather than an ordinary fixed-length Memory Trail session. Each currently taught member receives one independent locating attempt. A first-attempt correct answer removes that member from the immediate target set. An initial miss receives the existing corrective feedback and one later retry, after the remaining initial targets where possible. A correct retry finishes that member; a second miss also finishes the immediate checkpoint while preserving both incorrect retrieval events for later review. Thus a three-member all-correct cohort contains three questions, and a cohort with one initial miss contains at most four.

Checkpoint completion means the learner was taught and had a real retrieval opportunity; it does not declare mastery. The persisted orchestration state records only deterministic review timing derived from those real outcomes. A completed Guided Learning session or non-physical orchestration checkpoint advances a durable learning-event counter. Targets with an incorrect outcome become due after one intervening event; first-attempt successes become due after two. A due weak target may bring one already spaced comparison member so review never becomes a one-answer loop. Later review is a new repeatable Guided Learning block, not an extension of the introduction session.

Within each checkpoint, target order is a stable function of cohort identity and review generation. Identical state reproduces the same order, while later generations avoid repeating the complete prior order and never repeat a target immediately when another initial target remains. This ordering rule is intentionally scoped to Guided physical cohorts; ordinary Memory Trail and other Guided Learning families retain their existing planners.

## Covered prerequisites

`covered` is a deterministic instructional-prerequisite signal. A concept is covered when canonical evidence contains either:

- an independent correct retrieval (`correct`); or
- a supported/guided successful outcome (`assisted`).

Incorrect-only history, merely opening an activity, and unrelated evidence do not count. State context can be supplied by trustworthy state-location or state-naming evidence. This signal does not claim mastery, readiness, demonstration, or a numeric progress threshold.

By default, introduction requires coverage for every U.S. state in the feature's authored atlas relationships. Configuration may supply a smaller explicit `introductionPrerequisiteStateIds` override for later instructional tuning. Such an override affects introduction timing only: it does not edit atlas relationships, remove later Connections, or redefine geographic truth. No feature uses an override in the current curriculum.

## Queue and interleaving

When several physical features become eligible, the queue is ordered by the milestone at which each feature first had all introduction prerequisites covered, with stable atlas-authored order as the tie-breaker. The same evidence and state therefore produce the same queue.

While unfinished non-physical Guided Learning curriculum remains, two completed physical sequences do not run consecutively. Completing cohort retrieval or the final eligible integration step returns to the Guided planner and requires one real Guided session or non-physical orchestration checkpoint before another new physical sequence begins. Opening the coordinator or an activity does not satisfy that requirement. When retrieval is deferred because only one cohort member is introduced, normal political Guided Learning continues rather than forcing a trivial physical activity.

When the existing political Guided curriculum has no unseen items left, the remaining physical backlog may drain one complete sequence at a time. Each sequence still returns through the coordinator; no parallel activity engine is created.

## Geographic representation and cameras

Physical-feature identity is independent of political borders. Geometry metadata distinguishes:

- `full`: the available source adequately represents the feature, including cross-border continuation where applicable;
- `scope-limited`: the source truthfully represents the present learning scope without claiming the feature ends at that boundary;
- `incomplete`: the source is too misleading for orchestration.

The renderer reuses source geometry without country clipping. Foreign geography becoming visible does not create foreign curriculum relationships or evidence. Scope-limited features remain usable and visibly classified as such in developer trace data. St. Lawrence River is deferred because its source is incomplete. Coasts are deferred because they currently have relationship questions but no standalone locating/identifying learning path.

Guided physical views use a feature-first camera. The coordinator resolves the real source geometry, including authored visual continuation, calculates bounds, expands them by a family-appropriate amount for political context, and fits the viewport with a maximum zoom. Mountain, river, and lake profiles differ, and mobile uses different panel-aware padding. Learner pan and zoom remain available.

A per-feature or cohort camera override contract supports a center, zoom, bearing, and pitch when visual review finds automatic fitting inadequate. The Northeast Mountains cohort uses the approved authored override at longitude `-76.24`, latitude `40.39`, and zoom `5.16` (bearing and pitch `0`). It remains authoritative through target-to-target teaching and focused retrieval. Legacy activity-section, practice-window, and small-target camera moves are suppressed for that Guided entry. Target-to-target transitions preserve a learner-adjusted teaching or retrieval view; the teaching-to-retrieval handoff reestablishes the approved Northeast baseline instead of the standalone national camera. Learner pan and zoom remain enabled. Other cohorts retain automatic feature fitting until a camera is intentionally authored; no provisional regional cameras are invented. Standalone Mountain Ranges behavior is unchanged.

## Handoffs and evidence ownership

The orchestrator selects an eligible block from the deterministic queue, records only a minimal block cursor and pacing marker, launches the existing activity, and returns to the existing Guided Learning planner afterward.

- Reconstruction owns its evaluation and canonical reconstruction evidence. Submission completes the checkpoint even when the reconstruction is imperfect.
- A physical introduction records one existing canonical `assisted` locating outcome only after the learner taps the currently named and highlighted feature. A wrong tap during this supported teaching step leaves the highlight active and records no independent incorrect outcome. Previously introduced comparison members do not receive duplicate exposure. Opening or leaving the view alone records no exposure.
- Memory Trail owns physical-feature retrieval and its canonical evidence. Guided physical practice uses its locating interaction only; teaching highlights and answer-revealing labels are removed before the prompt.
- U.S. Connections owns question scoring, feedback, hint behavior, and canonical relationship evidence. The orchestration contract only filters the existing pool by stable challenge ID.

The orchestration store contains completed or pending block IDs, the pacing marker, the Guided Learning return context, the current physical teaching cursor and taught member IDs, the member IDs already included in cohort retrieval, the learning-event counter, and each cohort's next review-eligibility milestone. The review cursor stores the previous deterministic order and whether the latest real retrieval contained a miss; canonical evidence remains the durable authority for the actual attempt history. The teaching cursor allows an interrupted cohort to resume at the first untaught member. The store is not a second mastery model, and the existing Guided Learning scheduler remains the authority for the next Guided Learning session.

Reset All Learning Progress clears the orchestration store. Reset United States Guided Learning also clears its associated orchestration cursor while retaining canonical history under the existing scoped-reset authority.

### Evidence-driven entry and durable child provenance

For the primary **Learn the United States** action, Evidence-Driven Continuation selects the smallest useful learning need; Guided Learning remains responsible for choosing the eligible block, activity, and bounded target subset that delivers it. A physical-family or supported Connections need therefore enters Guided orchestration instead of launching the corresponding full Journey family. This routing does not remove the full Lakes, Rivers, Mountain Ranges, Connections, Reconstruction, Label Map, or Journey activities from deliberate manual navigation.

An external Guided child has a separate minimal serializable launch contract. It records the entry source, parent orchestration block, child destination/activity, exact target or challenge subset, relevant cohort/region identifiers, launch reason, completion status, and Guided return destination. It never stores callbacks. The contract makes the intended subset authoritative after reload: an incomplete child re-enters with the same bounded targets, while a completed child re-enters at a valid **Continue Guided Learning** handoff without emitting evidence again. Returning normally clears the contract, and manual or Journey launches clear stale Guided provenance before opening their full authored activity.

Guided child reuse does not write Journey completion. Journey progress remains owned by an explicit Journey launch, while shared canonical attempt evidence retains its existing meaning and source provenance.

## Observability and determinism

The Learning Inspector export includes the current block, every block's eligibility and prerequisite evidence, the previous and intended next blocks, the external destination, completion status, return context, and fallback reason. Its physical-feature trace also includes concept and family identity, cohort ID and grouping status, geometry representation, prerequisite source and coverage, first-eligible milestone, queue position, pacing reason, generated block IDs, camera mode and calculated values, cross-border metadata, and return behavior. A cohort trace exposes authored and supported members, each member's prerequisite status, introduced and retrieved members, whether retrieval is ready, its deferred reason, the current retrieval subset, the cohort camera and source, and members still waiting on prerequisites. It also reports the current learning-event milestone, each review candidate's outcome-derived priority and due milestone, whether intervening learning is satisfied, and the selected spaced-review set. The active teaching trace adds the phase, current target, taught and untaught members, guided-locating interaction, active-highlight status, assisted evidence semantics, and camera source. During retrieval it reports the deterministic checkpoint order, initial and retry outcomes, remaining immediate targets, current target, and confirms that no pre-answer highlight is active.

The same evidence, Guided Learning state, and configuration always produce the same selection. No orchestration choice uses randomness.

## Deliberate limits

This v1 slice defines only the bounded one-retry physical-cohort remediation rule, event-based review eligibility, and the responsibility boundary between evidence-driven entry and Guided delivery. It does not build a general spaced-repetition system, alter ordinary Memory Trail completion rules, change state/capital Guided Learning, change continuation readiness formulas, define route challenges, add coast instruction, replace St. Lawrence geometry, or create a new gameplay engine. Introduction timing overrides and camera overrides remain available for later human playtesting rather than being guessed in advance.
