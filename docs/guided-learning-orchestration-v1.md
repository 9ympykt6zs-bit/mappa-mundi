# Guided Learning Orchestration v1

## Purpose

Guided Learning coordinates a sequence of existing learning activities. It does not replace their gameplay, scoring, evidence, rendering, or persistence. The learning rhythm is **Teach → Retrieve → Integrate → Continue**, with handoffs from Guided Learning to an existing activity and back to the existing Guided planner.

## Generated physical-feature blocks

The orchestration configuration uses stable block IDs and five bounded block types:

- `guided-section`: the fallback that resumes the existing Guided Learning planner;
- `reconstruction-checkpoint`: the existing New England Regional Reconstruction activity;
- `physical-feature-introduction`: a focused teaching view using the feature family's existing rendering;
- `physical-feature-practice`: the existing Memory Trail engine targeted to one feature;
- `connection-checkpoint`: the existing U.S. Connections engine targeted to one authored relationship, when one exists.

Rivers, lakes, and mountain ranges are generated from the shared U.S. atlas, canonical concept contracts, existing activity targets, and authored state–feature relationships. Each supported feature follows **Introduce → Retrieve → optional Connection → Return**. The configuration does not duplicate activity mechanics or geographic facts. Great Salt Lake deliberately omits the Connection step because none is authored.

The original White Mountains slice and its New England Reconstruction dependency remain intact. The generalized contract adds the other safely supported physical features without changing Reconstruction itself.

## Covered prerequisites

`covered` is a deterministic instructional-prerequisite signal. A concept is covered when canonical evidence contains either:

- an independent correct retrieval (`correct`); or
- a supported/guided successful outcome (`assisted`).

Incorrect-only history, merely opening an activity, and unrelated evidence do not count. State context can be supplied by trustworthy state-location or state-naming evidence. This signal does not claim mastery, readiness, demonstration, or a numeric progress threshold.

By default, introduction requires coverage for every U.S. state in the feature's authored atlas relationships. Configuration may supply a smaller explicit `introductionPrerequisiteStateIds` override for later instructional tuning. Such an override affects introduction timing only: it does not edit atlas relationships, remove later Connections, or redefine geographic truth. No feature uses an override in the current curriculum.

## Queue and interleaving

When several physical features become eligible, the queue is ordered by the milestone at which each feature first had all introduction prerequisites covered, with stable atlas-authored order as the tie-breaker. The same evidence and state therefore produce the same queue.

While unfinished non-physical Guided Learning curriculum remains, two newly introduced physical sequences do not run consecutively. Completing a full physical sequence returns to the Guided planner and requires one real Guided session or non-physical orchestration checkpoint before another new feature begins. Opening the coordinator or an activity does not satisfy that requirement. An in-progress feature always finishes its own introduction, retrieval, and optional Connection before another feature can start.

When the existing political Guided curriculum has no unseen items left, the remaining physical backlog may drain one complete sequence at a time. Each sequence still returns through the coordinator; no parallel activity engine is created.

## Geographic representation and cameras

Physical-feature identity is independent of political borders. Geometry metadata distinguishes:

- `full`: the available source adequately represents the feature, including cross-border continuation where applicable;
- `scope-limited`: the source truthfully represents the present learning scope without claiming the feature ends at that boundary;
- `incomplete`: the source is too misleading for orchestration.

The renderer reuses source geometry without country clipping. Foreign geography becoming visible does not create foreign curriculum relationships or evidence. Scope-limited features remain usable and visibly classified as such in developer trace data. St. Lawrence River is deferred because its source is incomplete. Coasts are deferred because they currently have relationship questions but no standalone locating/identifying learning path.

Guided physical views use a feature-first camera. The coordinator resolves the real source geometry, including authored visual continuation, calculates bounds, expands them by a family-appropriate amount for political context, and fits the viewport with a maximum zoom. Mountain, river, and lake profiles differ, and mobile uses different panel-aware padding. Learner pan and zoom remain available.

A per-feature camera override contract supports a center, zoom, bearing, and pitch when later visual review finds automatic fitting inadequate. Automatic fit is the default, and no current feature is manually tuned.

## Handoffs and evidence ownership

The orchestrator selects an eligible block from the deterministic queue, records only a minimal block cursor and pacing marker, launches the existing activity, and returns to the existing Guided Learning planner afterward.

- Reconstruction owns its evaluation and canonical reconstruction evidence. Submission completes the checkpoint even when the reconstruction is imperfect.
- A physical introduction records an existing canonical `assisted` locating outcome only after the learner acknowledges the teaching view. Opening or leaving the view alone records no exposure.
- Memory Trail owns physical-feature retrieval and its canonical evidence.
- U.S. Connections owns question scoring, feedback, hint behavior, and canonical relationship evidence. The orchestration contract only filters the existing pool by stable challenge ID.

The orchestration store contains completed or pending block IDs, the pacing marker, and the Guided Learning return context. It is not a learner-history database. Canonical evidence remains the durable shared history, and the existing Guided Learning scheduler remains the authority for the next Guided Learning session.

Reset All Learning Progress clears the orchestration store. Reset United States Guided Learning also clears its associated orchestration cursor while retaining canonical history under the existing scoped-reset authority.

## Observability and determinism

The Learning Inspector export includes the current block, every block's eligibility and prerequisite evidence, the previous and intended next blocks, the external destination, completion status, return context, and fallback reason. Its physical-feature trace also includes concept and family identity, geometry representation, prerequisite source and coverage, first-eligible milestone, queue position, pacing reason, generated block IDs, camera mode and calculated values, cross-border metadata, and return behavior.

The same evidence, Guided Learning state, and configuration always produce the same selection. No orchestration choice uses randomness.

## Deliberate limits

This v1 slice does not define remediation policy, route challenges, coast instruction, replacement St. Lawrence geometry, a new gameplay engine, or a replacement for evidence-driven top-level continuation. Introduction timing overrides and camera overrides remain available for later human playtesting rather than being guessed in advance.
