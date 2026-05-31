# Mappa Mundi Project Guidance

Mappa Mundi is a geography learning app. The long-term goal is not just to quiz users, but to guide them through learning the world with adaptive practice, cumulative review, and checkpoint challenges.

Core product direction:
- Learn Your World = guided study and practice.
- Challenge Yourself = journeys, checkpoints, achievements, and evaluations.
- Memory Trail is a practice engine, not the whole cumulative system.
- Journeys should eventually function as checkpoint evaluations.
- The app should remember what a learner has seen, what they know, what they are forgetting, and what they are ready to learn next.

Learning design principles:
- Do not give away the answer before asking for retrieval.
- Separate guided exposure from retrieval practice.
- Keep success rates high, roughly 80–90%.
- Introduce new targets gradually.
- Review weak and due targets.
- Avoid frustrating repeated misses.
- End sessions on success when possible.
- Prefer small chunks of 3–5 active targets.
- Auto-zoom to the current practice window, not the whole world, when needed.

Implementation principles:
- Make changes in small deployable slices.
- Avoid large unrelated refactors.
- Keep Study, Journey, and Memory Trail behavior distinct.
- Preserve existing Journey progress unless explicitly asked to change it.
- Prefer modular helper functions and tunable constants.
- Add debug flags for complex learning logic.
- Do not add backend/accounts/subscriptions unless explicitly requested.