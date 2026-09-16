# Reconstruction screen lifecycle audit

Status: accepted

## Lead brief

- Objective: identify why a Reconstruction surface can remain visible after its owning route/activity changes, then define a lifecycle fix that preserves valid saved progress and intentional resume.
- Specialist role: temporary UI / UX lifecycle specialist, read-only. The assignment covered Guided and standalone Reconstruction, root screen state, the persistent panel, child-contract restoration, navigation exits, and controller cleanup. Pointer and Magic Mouse follow-up remained with the Lead.
- Boundaries: no styling-only workaround, no progress deletion, no scoring/evidence changes, no subdelegation, and no commit.
- Acceptance: identify the authoritative visibility owner, enumerate bypass paths, distinguish live UI state from persistence, and recommend navigation and reload coverage.

## Handoff

The persistent `#map-reconstruction-panel` is an absolute application-shell sibling rather than a child of each route. Before this correction, only `exitMapReconstruction()` destroyed `mapReconstructionController`, hid the panel, restored `#map`, and removed mode classes. `showAppScreen()` and several direct `currentAppScreen` assignments changed the underlying application without invoking that exit path. Settings reproduced the bug directly, while Explore opened beneath the higher Reconstruction layer. A live `activeGuidedLearningOrchestrationBlock` could also remain associated with the abandoned visible activity.

Persistence was not itself the visibility flag. The Guided child launch contract restores only during intentional Guided entry, and the Lower 48 store contains reconstruction progress without an open/visible bit. These durable records should remain. The repair therefore centralizes live screen ownership instead of deleting saves: any transition away from `map-reconstruction` destroys the controller and active gesture state, empties and hides the panel, restores map accessibility, clears Reconstruction shell modes, and releases the live Guided block reference. The durable child contract remains available for a later explicit Guided resume.

The Lead audited pointer ownership after the Magic Mouse clue. Regional and Lower 48 controllers now explicitly release pointer capture during drag cleanup. Lower 48 restores the last stable session if a placed-piece drag is interrupted, refuses wheel camera changes while a piece, drawer, or pointer gesture owns input, converts a second pointer into pinch only after restoring the dragged piece, and cancels active interactions on `pagehide`. Controller destruction remains the common route/unmount cleanup.

## Lead acceptance

Accepted after diff review and desktop/mobile browser validation. Coverage includes standalone Settings, Explore, Home and another activity; Guided Home and Back before and after submission; post-course return; reload inside and after leaving; explicit Guided and Lower 48 resume; browser Back/Forward during an active desktop drag; pointer cancellation; release outside the map; wheel input during dragging; and navigation while regional and Lower 48 pieces are captured. Results and commands are recorded in [testing](../testing.md).
