# Guided political camera

United States Guided Learning uses two related camera scopes for state and capital sections.

The section camera first frames the current teaching cohort. It gives the learner regional context and remains the search area for name-to-place locating prompts, where focusing the requested state would reveal the answer.

For lower-48 `guided` teaching prompts and `place_to_name` identification prompts, the runtime then fits the complete current state with prompt-level padding. Capital prompts resolve their related state and use the same state geometry. The fit can zoom as far as 7.25 for small states. The intended minimum is 4.7 whenever that zoom still permits the complete state to remain visible.

A 390px portrait viewport cannot contain the full east-west extent of Montana or Minnesota at MapLibre zoom 4.7 while retaining the interface-safe frame. Those cases use the highest complete-state bounds fit instead of cropping the geography. This is a geometric viewport constraint, not an authored per-state override. Desktop views and feasible mobile states meet or exceed 4.7.

Alaska and Hawaii stay outside the lower-48 prompt-focus policy. Section 11 preserves their authored disconnected-geography cameras. Standalone activities, Daily Trail, Journey, physical geography, and Reconstruction retain their own camera contracts.

The decision logic lives in `src/united-states-guided-political-camera.js`; runtime scheduling lives in `src/maplibre-poc.js`; bounds fitting remains in `src/maplibre/maplibre-activity-runner.js`.
