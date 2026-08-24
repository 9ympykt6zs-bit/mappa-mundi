# Geographic Visualization Principles

## Purpose

Mappa Mundi presents the same places and geographic features across Study activities, Connections, Mental Map, Reconstruction, progress feedback, Expeditions, and future regional or world content. These contexts may ask learners to do different kinds of thinking, but they should still feel like parts of one geographic learning system.

This document defines product and design guidance for maintaining that coherence. It does not prescribe a particular renderer, data format, map library, or implementation plan.

## Geographic Consistency Rule

When the same geographic object appears in multiple contexts, Mappa Mundi should reuse the same underlying geographic representation and visual vocabulary whenever possible.

Activities may emphasize different learning goals, but they should not create competing interpretations of the same geographic object. A river, mountain range, capital, border, or coast should remain recognizably the same geographic concept whether the learner encounters it during Study, answers a Connections question, reasons in Mental Map, uses it during Reconstruction, or reviews feedback.

Consistency does not require every activity to look identical. A locating activity may suppress labels before retrieval, a Study activity may emphasize a selected feature, and post-answer feedback may add contextual labels or semantic correct/incorrect states. Those differences should change emphasis, assistance, or feedback—not the underlying geography or the meaning of its visual language.

### Mountains

A mountain range should use a consistent visual language everywhere, including:

- the same family of mountain symbols, ridge treatment, or other established style;
- a consistent approximate geographic location and extent;
- consistent labels and naming conventions;
- a consistent interpretation of what the represented feature means.

If the source describes only an approximate range location, each activity should preserve that approximation rather than presenting it elsewhere as a precise physical boundary. An activity should not replace an established mountain representation with unrelated markers or raw geometry merely because it needs a different feedback state.

### Rivers

Rivers should use consistent:

- line treatment and directional or flow conventions where applicable;
- names and naming conventions;
- geographic placement;
- interpretation of relationships such as flowing through a place, bordering it, or forming part of its boundary.

Different activities may highlight a river or mute surrounding geography, but they should not imply different courses or different meanings for the same state-river relationship.

### Capitals

Capitals should use consistent:

- marker style;
- real geographic location;
- names and naming conventions.

A capital may receive stronger emphasis in a capital-learning activity or post-answer feedback, but it should remain anchored to the same place and use the same recognizable visual vocabulary throughout the product.

### Borders and geographic relationships

Geographic relationships need consistent terminology and visual conventions as well as consistent source data. This includes:

- state boundaries;
- international boundaries;
- coastal relationships;
- water-related boundaries and relationships.

The product should not use the same visual treatment for relationships with materially different meanings, nor use different terms for the same relationship without a clear educational reason. For example, a river crossing a state and a river forming its border should not silently become interchangeable, and an international boundary should remain distinct from a coastline or maritime relationship.

Contextual geography should remain secondary to answer or reference geography. It may be muted, labeled, or made more legible to support orientation, but it should not acquire semantic feedback colors or other conventions that change its meaning.

## Guidance for new visualizations

Before adding a new geographic visualization:

1. Check whether the geographic object or relationship already appears elsewhere in Mappa Mundi.
2. Reuse its existing data and rendering vocabulary where practical.
3. Prefer extending an established visual system with a new emphasis or feedback state over creating a separate activity-specific interpretation.
4. If a new representation is necessary, document why the existing representation is unsuitable and how the new one preserves geographic meaning.

Reviews should consider consistency across contexts, not only whether the new visualization works in isolation. Useful review questions include:

- Does the feature occupy the same geographic place in every context?
- Would a learner recognize it as the same object?
- Do labels and relationship terms retain the same meaning?
- Is an activity-specific difference serving retrieval, teaching, accessibility, or feedback rather than creating a conflicting geography?

## Related design guidance

- [Expedition Learning Model](expedition-learning-model.md) describes how distinct activities contribute to one coherent learner journey without being homogenized.
- [Learning Support and Hint Philosophy](learning-support-and-hints.md) explains why assistance and feedback may change emphasis while preserving the underlying geographic task.
- [MapLibre Migration Plan](maplibre-migration-plan.md) provides technical context for separating geographic rendering from educational activity state; it is not the product authority for this principle.
