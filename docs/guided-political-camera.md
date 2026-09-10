# Guided political camera

United States Guided Learning preserves regional context while correcting only a measurably distant state view.

Camera precedence is:

1. An exact authored Guided camera for the active cohort. The Utah/Arizona camera is the current authored example.
2. The responsive bounds fit for the active teaching cohort, with the existing interface-safe padding.
3. A complete-state correction only when the calculated cohort camera is below zoom 4.7 and the corrected state fit would improve the zoom by at least 0.2.

The section camera gives the learner regional context and remains the search area for `name_to_place` locating prompts, where focusing the requested state would reveal the answer.

The fallback applies only to lower-48 `guided` teaching and visible `place_to_name` identification. Capital prompts resolve their related state. It fits the complete target state with prompt-safe padding, caps that correction at zoom 4.7, and leaves the section camera in place when the correction would provide less than a 0.2 zoom gain. The 4.7 value is a threshold and upper bound for this correction; it is not a universal minimum and does not make every state fill the viewport.

The correction can settle below 4.7 when the responsive safe frame cannot contain the complete state at that zoom. No state-specific overrides were added for this regression. Measured desktop and mobile views retain contextual section framing for northeastern states; the compact Montana and Wyoming views receive the bounded correction because their cohort cameras are demonstrably distant.

Alaska and Hawaii stay outside the lower-48 prompt-focus policy. Section 11 preserves their authored disconnected-geography cameras. Standalone activities, Daily Trail, Journey, physical geography, and Reconstruction retain their own camera contracts.

The decision logic lives in `src/united-states-guided-political-camera.js`; runtime scheduling lives in `src/maplibre-poc.js`; bounds fitting remains in `src/maplibre/maplibre-activity-runner.js`.
