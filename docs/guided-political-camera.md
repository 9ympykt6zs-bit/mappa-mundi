# Guided political camera

United States Guided Learning uses a predictable zoom band for state-focused lower-48 teaching and visible identification.

The authored or responsive section camera still establishes the learning context:

1. An exact authored Guided camera for the active cohort. The Utah/Arizona camera is the current authored example.
2. The responsive bounds fit for the active teaching cohort, with the existing interface-safe padding.

The lower-48 state-focused step then clamps that calculated zoom to `4.7 <= zoom <= 5.5`. Values already inside the band remain unchanged. If the contextual zoom is below 4.7, the camera uses the current state's bounds-fit center before applying 4.7 so a large western state is not left at the edge of a magnified cohort view. For in-range values and values reduced to 5.5, it preserves the contextual center. This retains neighboring geography around small states while preventing them from filling the viewport.

The clamp applies to `guided` teaching and visible `place_to_name` identification. Capital prompts resolve their related state and use the same rule. Four authored `guidedStateFocusCamera` records refine only the `guided` teaching destinations for Utah, Salt Lake City, Montana, and Helena in `assets/maps/data/us-states-capitals-09.json` and `assets/maps/data/us-states-capitals-10.json`. Each has a desktop and compact destination. Salt Lake City uses a slightly closer zoom than Utah while retaining the same center. These targets still obey the 4.7–5.5 clamp. Arizona, Phoenix, and the other section members continue to use their existing cohort camera. The authored coordinates do not affect the broader cohort fit, visible identification, hidden-answer locating, or transition timing.

The section camera remains the search area for `name_to_place` locating prompts, where focusing the requested state would reveal the answer.

Alaska and Hawaii stay outside the lower-48 clamp. Section 11 preserves their existing disconnected-geography state cameras. Honolulu's three-city teaching fit has a Hawaii-only final zoom cap of 9.0 on desktop and 8.2 on compact layouts; this cap is applied to the computed destination because the globe fit can return a closer zoom than its `maxZoom` option. Alaska's city fit is unchanged. Standalone activities, Daily Trail, Journey, physical geography, and Reconstruction retain their own camera contracts.

The decision logic lives in `src/united-states-guided-political-camera.js`; runtime scheduling lives in `src/maplibre-poc.js`; bounds fitting remains in `src/maplibre/maplibre-activity-runner.js`.
