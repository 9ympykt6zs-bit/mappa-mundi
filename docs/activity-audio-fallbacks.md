# Intentional activity audio fallbacks

| Activity | Phrase key | Rendered text | Reason | Intentional | Handling |
| --- | --- | --- | --- | --- | --- |
| Mental Map | `generated-route:question` | Generated neighboring-state route question | The start and destination pair changes at runtime. | Yes | Browser speech reads the complete generated sentence. |
| Mental Map | `generated-route:explanation` | Generated neighboring-state route explanation | The destination state changes at runtime. | Yes | Browser speech reads the complete generated sentence. |
| Mental Map | `result:answer-sequence` | Mental Map selected-answer and route sequence | The learner-created state sequence is unbounded. | Yes | Browser speech reads the complete result line. |
| Mental Map | `result:route-metrics` | Mental Map route crossing comparison | Route and shortest-path counts vary with a learner-created route. | Yes | Browser speech reads the complete route note. |
| Mental Map | `fallback:mental-map-invalid-transition` | Mental Map invalid route transition | The state pair comes from the learner-created route. | Yes | Browser speech reads the complete runtime sentence. |
| Map Reconstruction | `fallback:reconstruction-result-summary` | Map Reconstruction combined result summary | Four bounded counts have many possible combined sentences. | Yes | Browser speech reads the complete runtime sentence. |
| Map Reconstruction | `fallback:lower48-score-summary` | Lower 48 score and percentage summary | Several scores can each range from zero through one hundred. | Yes | Browser speech reads the complete runtime sentence. |

Run `npm run audio:activities:fallbacks` to print this report directly from the
canonical registry. Validation fails when a fallback lacks a reason or recommended
handling.
