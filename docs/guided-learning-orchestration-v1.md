# Guided Learning Orchestration v1

## Purpose

Guided Learning coordinates a sequence of existing learning activities. It reuses their gameplay, evidence, rendering, and persistence, with the approved Guided-only anchored Reconstruction scoring described below. The learning rhythm is **Teach → Retrieve → Integrate → Continue**, with handoffs from Guided Learning to an existing activity and back to the existing Guided planner.

## Generated physical-feature blocks

The orchestration configuration uses stable block IDs and five bounded block types:

- `guided-section`: the fallback that resumes the existing Guided Learning planner;
- `reconstruction-checkpoint`: ten section-aligned contiguous-state groups, using Reconstruction with locked prior context after checkpoint 1;
- `physical-feature-introduction`: a focused teaching view using the feature family's existing rendering;
- `physical-feature-practice`: the existing Memory Trail engine targeted to a small learned comparison cohort;
- `connection-checkpoint`: the existing U.S. Connections engine targeted to one authored relationship, when one exists.

Rivers, lakes, and mountain ranges are generated from the shared U.S. atlas, canonical concept contracts, existing activity targets, and authored state–feature relationships. A Guided physical sequence follows **Show → Name → Highlight → Guided tap** for each member of a two- or three-feature batch, then **Retrieve → Return**. During teaching, one new feature is named and highlighted at a time while the other batch geography remains available as context. The learner must tap the highlighted feature before teaching advances. Connections remain available when Evidence-Driven Continuation specifically identifies that family, but individual Connection blocks no longer interrupt the introduction-to-retrieval sequence. The configuration does not duplicate activity mechanics or geographic facts. Great Salt Lake deliberately has no Connection block because none is authored.

White Mountains retains its original checkpoint completion dependency. That stable checkpoint now matches the first five-state Guided section; Vermont joins checkpoint 2. See [Guided Reconstruction checkpoints](guided-reconstruction-checkpoints.md) for the ten-group sequence, targeted routing, legacy-progress compatibility, and Guided-only anchored evaluation. Standalone Reconstruction scoring remains unchanged.

## Physical learning cohorts

Physical retrieval requires meaningful alternatives: each authored Guided cohort contains two or three compatible targets. When the first target in an eligible cohort is selected, the whole cohort is introduced together, one feature at a time, and immediately handed to a locating checkpoint containing the same members. Guided Learning removes teaching highlights and labels before each independent response.

The inventory and scheduler audit produced thirteen bounded cohorts covering all 34 supported targets:

- Rivers use western, central, and eastern groups of two or three. The central cohort contains Mississippi, Missouri, and Arkansas; the eastern cohort contains Ohio and St. Lawrence.
- Lakes use upper Great Lakes and eastern/interior groups of three, including Great Salt Lake in the latter.
- Mountain ranges use eight regional groups of two or three: Northeast, major West, southern Appalachians, the broader Appalachian system, Pacific, interior West, central, and Alaska.
- The Northeast group remains the product-approved White/Green/Adirondack subset of the broader authored Eastern Mountains activity. The other bounded groups are Guided curriculum groupings over existing canonical targets and geometry; they do not redefine the source activities.

The first New England Reconstruction checkpoint is the global entry milestone for physical geography. Lower-48 features intentionally do not wait for every state they cross to be introduced: physical geography can scaffold later political geography while authored state relationships continue to supply accurate teaching text and Connections. Alaska Range and Brooks Range retain an Alaska-state gate because their disconnected viewport is a genuine navigation and context boundary.

### Demonstrate, then space

Guided physical cohort practice is a bounded retrieval checkpoint rather than an ordinary fixed-length Memory Trail session. Each currently taught member receives one independent locating attempt. A first-attempt correct answer removes that member from the immediate target set. An initial miss receives the existing corrective feedback and one later retry, after the remaining initial targets where possible. A correct retry finishes that member; a second miss also finishes the immediate checkpoint while preserving both incorrect retrieval events for later review. Thus a three-member all-correct cohort contains three questions, and a cohort with one initial miss contains at most four.

Checkpoint completion means the learner was taught and had a real retrieval opportunity; it does not declare mastery. The persisted orchestration state records only deterministic review timing derived from those real outcomes. A completed Guided Learning session or non-physical orchestration checkpoint advances a durable learning-event counter. Targets with an incorrect outcome become due after one intervening event; first-attempt successes become due after two. A due weak target may bring already spaced comparison members so review never becomes a one-answer loop. New eligible cohorts are selected before repeat review, preventing an old due subset from starving unseen content.

After every target in a lower-48 family has been introduced, a repeatable family pool selects three or four targets. It prioritizes due weak targets, fills remaining positions with spaced targets, and rotates membership as well as order across generations. Alaska ranges use a separate two-target regional pool so they are never mixed into a lower-48 camera. Once at least two targets have been introduced in each of mountains, rivers, and lakes, a mixed lower-48 pool can select three or four already introduced targets with all three families represented. Its synthetic runtime activity maps each target to its original canonical entity type, so mixed presentation does not change evidence meaning.

Within each checkpoint, target order and membership are stable functions of cohort identity, learning-event count, and review generation. Identical state reproduces the same result, while later generations avoid repeating the complete prior set when alternatives exist and never repeat a target immediately when another initial target remains. This deterministic variation is scoped to Guided physical checkpoints; ordinary Memory Trail and other Guided Learning families retain their existing planners.

## Covered prerequisites

`covered` is a deterministic instructional-prerequisite signal. A concept is covered when canonical evidence contains either:

- an independent correct retrieval (`correct`); or
- a supported/guided successful outcome (`assisted`).

Incorrect-only history, merely opening an activity, and unrelated evidence do not count. State context can be supplied by trustworthy state-location or state-naming evidence. This signal does not claim mastery, readiness, demonstration, or a numeric progress threshold.

Authored state relationships remain geographic truth and continue to drive teaching and Connection content. They are separate from introduction eligibility. Lower-48 physical targets use the first Reconstruction checkpoint as their instructional prerequisite; Alaska ranges additionally require Alaska coverage. Configuration still supports explicit per-feature state prerequisites where a future technical or pedagogical dependency requires one.

## Queue and interleaving

When several physical cohorts become eligible, the queue uses explicit Guided curriculum order with stable atlas-authored order as the tie-breaker. Selecting any unintroduced member expands the block to the remaining two- or three-target cohort. Immediate practice is treated as the in-progress continuation of that cohort and therefore runs before unrelated work. The same evidence and state produce the same queue.

While unfinished non-physical Guided Learning curriculum remains, two completed physical sequences do not run consecutively. Completing cohort retrieval or spaced review returns to the Guided planner and requires one real Guided session or non-physical orchestration checkpoint before another physical sequence begins. Opening the coordinator or an activity does not satisfy that requirement. A requested physical family filters both introductions and its family review pool; mixed review is available only to untargeted Guided selection.

When the existing political Guided curriculum has no unseen items left, the remaining physical backlog may drain one complete sequence at a time. Each sequence still returns through the coordinator; no parallel activity engine is created.

## Geographic representation and cameras

Physical-feature identity is independent of political borders. Geometry metadata distinguishes:

- `full`: the available source adequately represents the feature, including cross-border continuation where applicable;
- `scope-limited`: the source truthfully represents the present learning scope without claiming the feature ends at that boundary;
- `incomplete`: the source is too misleading for orchestration.

The renderer reuses source geometry without country clipping. Foreign geography becoming visible does not create foreign curriculum relationships or evidence. Scope-limited features remain usable and visibly classified as such in developer trace data. St. Lawrence uses a source-backed full named course from the Lake Ontario outlet through the international reach and Canadian continuation; its curriculum relationship and evidence remain tied to New York. See [St. Lawrence River locating geometry](st-lawrence-river-geometry.md). Coasts are deferred because they currently have relationship questions but no standalone locating/identifying learning path.

Guided physical views use stable regional cameras so teaching and retrieval preserve a consistent search space. Lower-48 cohorts use the existing national camera unless an authored cohort override is present. Alaska ranges use their regional preset. Learner pan and zoom remain available.

A per-feature or cohort camera override contract supports a center, zoom, bearing, and pitch when visual review shows the default search space is inadequate. The Northeast Mountains cohort uses longitude `-76.24`, latitude `40.39`, and zoom `5.16` (bearing and pitch `0`). The eastern-rivers cohort uses longitude `-77.2`, latitude `44.4`, zoom `4.05` on desktop and `3.2` on compact/mobile layouts so Ohio, St. Lawrence, and the cross-border continuation remain visible. These overrides remain authoritative through target-to-target teaching and focused retrieval. Legacy activity-section, practice-window, and small-target camera moves are suppressed for the Guided entry. Target-to-target transitions preserve a learner-adjusted teaching or retrieval view; the teaching-to-retrieval handoff reestablishes the authored baseline. Standalone activity cameras are unchanged.

## Handoffs and evidence ownership

The orchestrator selects an eligible block from the deterministic queue, records only a minimal block cursor and pacing marker, launches the existing activity, and returns to the existing Guided Learning planner afterward.

- Reconstruction owns its evaluation and canonical reconstruction evidence. Submission completes the checkpoint even when the reconstruction is imperfect.
- A physical introduction records one existing canonical `assisted` locating outcome only after the learner taps the currently named and highlighted feature. A wrong tap during this supported teaching step leaves the highlight active and records no independent incorrect outcome. Previously introduced comparison members do not receive duplicate exposure. Opening or leaving the view alone records no exposure.
- Memory Trail owns physical-feature retrieval and its canonical evidence. Guided physical practice uses its locating interaction only; teaching highlights and answer-revealing labels are removed before the prompt.
- U.S. Connections owns question scoring, feedback, hint behavior, and canonical relationship evidence. The orchestration contract only filters the existing pool by stable challenge ID.

The orchestration store contains completed or pending block IDs, the pacing marker, the Guided Learning return context, the current physical teaching cursor and taught member IDs, the member IDs already included in cohort retrieval, the learning-event counter, and each cohort or review pool's next eligibility milestone. Review progress stores the previous deterministic order and membership plus outcome-derived due data; canonical evidence remains the durable authority for the actual attempt history. The teaching cursor allows an interrupted cohort to resume at the first untaught member. Store version 6 accepts valid prior cohort progress while discarding identifiers that no longer belong to a configured cohort or review pool. The store is not a second mastery model, and the existing Guided Learning scheduler remains the authority for the next Guided Learning session.

Reset All Learning Progress clears the orchestration store. Reset United States Guided Learning also clears its associated orchestration cursor while retaining canonical history under the existing scoped-reset authority.

### Evidence-driven entry and durable child provenance

For the primary **Learn the United States** action, Evidence-Driven Continuation selects the smallest useful learning need; Guided Learning remains responsible for choosing the eligible block, activity, and bounded target subset that delivers it. A physical-family or supported Connections need therefore enters Guided orchestration instead of launching the corresponding full Journey family. This routing does not remove the full Lakes, Rivers, Mountain Ranges, Connections, Reconstruction, Label Map, or Journey activities from deliberate manual navigation.

An external Guided child has a separate minimal serializable launch contract. It records the entry source, parent orchestration block, child destination/activity, exact target or challenge subset, relevant cohort/region identifiers, launch reason, completion status, and Guided return destination. It never stores callbacks. The contract makes the intended subset authoritative after reload: an incomplete child re-enters with the same bounded targets, while a completed child re-enters at a valid **Continue Guided Learning** handoff without emitting evidence again. Returning normally clears the contract, and manual or Journey launches clear stale Guided provenance before opening their full authored activity.

Guided child reuse does not write Journey completion. Journey progress remains owned by an explicit Journey launch, while shared canonical attempt evidence retains its existing meaning and source provenance.

## Observability and determinism

The Learning Inspector export includes the current block, every block's eligibility and prerequisite evidence, the previous and intended next blocks, the external destination, completion status, return context, and fallback reason. Its physical-feature trace also includes concept and family identity, cohort ID and grouping status, geometry representation, prerequisite source and coverage, queue position, pacing reason, generated block IDs, camera mode and calculated values, cross-border metadata, and return behavior. Cohort and review-pool traces expose introduced and retrieved members, current eligibility and deferred reason, due and weak targets, prior and selected membership, mixed-family thresholds, cameras, and pending targets. The active teaching trace adds the phase, current target, taught and untaught members, guided-locating interaction, active-highlight status, assisted evidence semantics, and camera source. During retrieval it reports the deterministic checkpoint order, initial and retry outcomes, remaining immediate targets, current target, and confirms that no pre-answer highlight is active.

The same evidence, Guided Learning state, and configuration always produce the same selection. No orchestration choice uses randomness.

## Deliberate limits

This v1 slice defines bounded physical batches, one-retry remediation, event-based category and mixed review, and the responsibility boundary between evidence-driven entry and Guided delivery. It does not build a general spaced-repetition system, alter ordinary Memory Trail completion rules, change state/capital Guided Learning, change continuation readiness formulas, define route challenges, add coast instruction, or create a new gameplay engine. Alaska review remains region-specific.
