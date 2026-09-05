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

## Engineering ownership and durable context

- The designated Lead task owns request triage, architectural decisions, cross-cutting changes, integration, review, and the final user summary. Other tasks do not automatically become Leads.
- Start with this file and [engineering state](docs/engineering-state.md). Read only the domain documentation needed for the assignment. Use code to verify dated claims; conversation history is not the source of project truth.
- Follow [engineering orchestration](docs/engineering-orchestration.md) for delegation, capability checks, model selection, and integration. This is engineering coordination, distinct from the app's guided-learning orchestration.
- Complete simple tasks directly. Before delegating, compare implementation effort with briefing, context, review, and integration costs. Use focused temporary specialists only when there is a meaningful advantage.
- Default to one specialist at a time. Parallel specialists require an explicit user request or a compelling reason explained to the user beforehand, with independent scope and file ownership. Specialists must return to the Lead before further delegation.
- Conceptual specialties are UI / UX; Content / Learning Systems; and Infrastructure / Quality. These are assignment roles, not permanent agents or architectural silos.
- For bounded routine delegation, prefer an available efficient model with a compact briefing. Verify the current tool's supported models; do not assume thread and subagent model lists match.
- Every delegation needs an objective, relevant files/context, allowed changes and exclusions, acceptance criteria, testing expectations, and a concise handoff. Use [the handoff template](docs/handoffs/TEMPLATE.md).
- Review the actual diff, resolve issues, and test the integrated result before acceptance. Preserve unrelated user changes and existing learner/Journey progress. Never treat a specialist's success claim as verification.
- Update engineering state and affected domain documentation when actual architecture, behavior, constraints, or verification changes. Keep historical records dated; do not turn old test passes or plans into present facts.
- Report one concise completion summary with the outcome, validation, and material limitations. Do not create background monitors, permanent agent teams, or new user-owned tasks merely to implement this policy.
