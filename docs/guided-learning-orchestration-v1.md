# Guided Learning Orchestration v1

## Purpose

Guided Learning is the coordinator for a small sequence of existing learning activities. It does not replace their gameplay, scoring, evidence, rendering, or persistence. The v1 slice proves a repeatable handoff:

**Guided Learning → external learning block → Guided Learning**

The intended learning rhythm is **Teach → Retrieve → Integrate → Continue**. This slice establishes the contracts needed for that rhythm without defining the full United States curriculum.

## Implemented blocks

The orchestration configuration uses stable, ordered block IDs and five bounded block types:

- `guided-section`: the fallback that resumes the existing Guided Learning planner;
- `reconstruction-checkpoint`: the existing New England Regional Reconstruction activity;
- `physical-feature-introduction`: a focused White Mountains teaching view using the existing Mountain Ranges rendering;
- `physical-feature-practice`: the existing Memory Trail engine targeted to the White Mountains;
- `connection-checkpoint`: the existing U.S. Connections engine targeted to the authored Maine–White Mountains relationship.

The White Mountains were selected because they have existing authored geometry, canonical mountain-range identity, direct relationships to Maine and New Hampshire, and prerequisites that fit the beginning of the current state sequence. No feature data or relationship was invented for orchestration.

## Covered prerequisites

`covered` is a deterministic instructional-prerequisite signal. A concept is covered when canonical evidence contains either:

- an independent correct retrieval (`correct`); or
- a supported/guided successful outcome (`assisted`).

Incorrect-only history, merely opening an activity, and unrelated evidence do not count. State context can be supplied by trustworthy state-location or state-naming evidence. This signal does not claim mastery, readiness, demonstration, or a numeric progress threshold.

## Handoffs and evidence ownership

The orchestrator selects an eligible block in stable authored order, records only a minimal block cursor, launches the existing activity, and returns to the existing Guided Learning planner afterward.

- Reconstruction owns its evaluation and canonical reconstruction evidence. Submission completes the checkpoint even when the reconstruction is imperfect.
- The physical introduction records an existing canonical `assisted` locating outcome only after the learner acknowledges the teaching view. Opening or leaving the view alone records no exposure.
- Memory Trail owns physical-feature retrieval and its canonical evidence.
- U.S. Connections owns question scoring, feedback, hint behavior, and canonical relationship evidence. The orchestration contract only filters the existing pool by stable challenge ID.

The orchestration store contains completed/pending block IDs and the Guided Learning return context. It is not a learner-history database. Canonical evidence remains the durable shared history, and the existing Guided Learning scheduler remains the authority for the next Guided Learning session.

Reset All Learning Progress clears the orchestration store. Reset United States Guided Learning also clears its associated orchestration cursor while retaining canonical history under the existing scoped-reset authority.

## Observability and determinism

The Learning Inspector export includes the current block, every block's eligibility and prerequisite evidence, the previous and intended next blocks, the external destination, completion status, return context, and fallback reason. The same evidence, Guided Learning state, and configuration always produce the same selection; checkpoint insertion does not use randomness.

## Deliberate limits

This v1 slice does not define the full U.S. orchestration curriculum, remediation policy, route challenges, coast instruction, a new gameplay engine, or a replacement for evidence-driven top-level continuation. Additional blocks should be authored only when their prerequisite relationships and targeted activity entries are trustworthy.
