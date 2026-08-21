# Expeditions

Expeditions are Mappa Mundi's guided orchestration layer. They arrange existing learning and exploration modes into a coherent entry, resume, and progression path; they are not a gameplay engine and do not own learner state.

## Framework boundary

`src/expedition-framework.js` accepts a structured Expedition definition and a flat evidence snapshot. It validates stable step IDs, launch references, and prerequisites, then derives each step as `locked`, `available`, `in-progress`, or `complete`. It also identifies the recommended next step and calculates milestone progress.

The framework has no storage access and does not know about U.S. activities. A geography-specific runtime adapter is responsible for projecting existing evidence into the metric names used by its configuration. A future Expedition can therefore reuse the same read model and UI while supplying different steps, launches, and evidence metrics.

## Across the United States

`src/across-united-states-expedition.js` composes nine existing experiences:

1. optional, non-scored U.S. Atlas exploration;
2. regional state teaching through the United States Journey;
3. adaptive state/capital recall through U.S. Memory Trail;
4. capital teaching through the existing U.S. Capitals Journey;
5. rivers, lakes, and mountains through existing Journey activities;
6. borders, coasts, regions, capitals, and physical relationships through U.S. Connections;
7. directional, ordering, adjacency, and route reasoning through Mental Map;
8. a regional Map Reconstruction checkpoint;
9. the existing Lower 48 reconstruction capstone as the final mission.

The configuration does not duplicate these activities or change their mechanics. Direct-entry menu buttons remain available.

## Evidence and progression

The production adapter in `src/maplibre-poc.js` derives Expedition state from:

- Journey step completion in `atlasQuestProgress`;
- `hasStarted` and introduced-item counts in U.S. Memory Trail's existing progress;
- distinct canonical attempt IDs for U.S. Connections, general Mental Map, regional reconstruction, and the Lower 48 capstone.

Evidence earned through a direct-entry path counts immediately. A later step with sufficient existing evidence is reported complete even when earlier Expedition milestones are incomplete. This prevents the Expedition from creating contradictory or duplicate progress.

Atlas exploration is deliberately optional and non-blocking because it is not scored. The initial thresholds are configuration values: two regional Journey steps, eight introduced U.S. Memory Trail items, two capital Journey steps, one physical-feature Journey step, three U.S. Connections attempts, two general Mental Map attempts, one regional reconstruction attempt, and one Lower 48 attempt. These thresholds define the first production orchestration slice and remain tunable without changing the framework.

Launching an activity from the Expedition records only an in-memory return destination. Exiting Atlas, U.S. Memory Trail, Journey gameplay, Mental Map/U.S. Connections, or Reconstruction returns to the freshly derived Expedition hub. No Expedition progress is written.

## Current boundary

This slice establishes the reusable model, primary U.S. entry/hub, evidence-derived resume state, activity launch composition, and return path. It does not yet add narrative transitions, teaching interstitials, achievements, a separate Expedition completion record, or a second-region graduation configuration. The existing activity completion and canonical evidence systems remain authoritative.
