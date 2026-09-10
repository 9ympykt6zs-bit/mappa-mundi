# Guided political camera

United States Guided Learning uses a predictable zoom band for state-focused lower-48 teaching and visible identification.

The authored or responsive section camera still establishes the learning context:

1. An exact authored Guided camera for the active cohort. The Utah/Arizona camera is the current authored example.
2. The responsive bounds fit for the active teaching cohort, with the existing interface-safe padding.

The lower-48 state-focused step then clamps that calculated zoom to `4.7 <= zoom <= 5.5`. Values already inside the band remain unchanged. If the contextual zoom is below 4.7, the camera uses the current state's bounds-fit center before applying 4.7 so a large western state is not left at the edge of a magnified cohort view. For in-range values and values reduced to 5.5, it preserves the contextual center. This retains neighboring geography around small states while preventing them from filling the viewport.

The clamp applies to `guided` teaching and visible `place_to_name` identification. Capital prompts resolve their related state and use the same rule. No per-state overrides are part of this policy.

The section camera remains the search area for `name_to_place` locating prompts, where focusing the requested state would reveal the answer.

Alaska and Hawaii stay outside the lower-48 clamp. Section 11 preserves their existing disconnected-geography cameras. Standalone activities, Daily Trail, Journey, physical geography, and Reconstruction retain their own camera contracts.

The decision logic lives in `src/united-states-guided-political-camera.js`; runtime scheduling lives in `src/maplibre-poc.js`; bounds fitting remains in `src/maplibre/maplibre-activity-runner.js`.
