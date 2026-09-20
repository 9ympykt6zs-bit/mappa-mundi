# Engineering orchestration

The designated Lead receives development requests, owns architecture and cross-cutting work, and accepts all integrated changes. Temporary specialists execute bounded assignments and return control to the Lead. This document establishes a working protocol, not an installed scheduler or autonomous background service.

## Capability audit — 2026-09-05

Evidence comes from the current session's callable tool schemas, a successful `collaboration.list_agents` call (only `/root` running), a successful Codex `list_projects` call identifying Mappa Mundi as a local Git project, and `git worktree list` identifying one checkout. Recheck after an environment change; exposed operations are not guarantees of successful execution.

| Capability | Verified availability and limits |
| --- | --- |
| Direct subagents | `collaboration.spawn_agent`, `send_message`, `followup_task`, `interrupt_agent`, `list_agents`, and `wait_agent` are exposed. Runtime listing succeeded. Spawning/messaging were not exercised during setup because a throwaway specialist would add cost without useful work. |
| Capacity | Session instructions expose four total slots including the Lead. Project policy still defaults to one active specialist. |
| Context and models | Spawn supports `fork_turns: "none"`, a bounded turn count, or `"all"`. Full-history forks inherit model/effort and cannot override them. Compact briefs can select an exposed model. |
| Direct model choices | The spawn schema lists `gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, and `gpt-5.5`. Luna is described as fast and affordable and is the initial preference for suitable routine assignments, generally with medium reasoning and `fork_turns: "none"`. Actual credit rates and successful model dispatch were not measured. Escalate only when task complexity or results justify it. |
| Shared files | Direct subagents share the Lead's directory and filesystem. Spawn has no worktree-isolation parameter. Completed edits are already in the checkout; they do not need cherry-picking. |
| Separate Codex tasks | `create_thread`, `fork_thread`, `read_thread`, `send_message_to_thread`, and `wait_threads` are exposed. Create is for explicitly requested user-owned tasks, not the default subtask mechanism. Thread schema additionally lists `gpt-5.4-mini`; this does not make it a direct-spawn option. |
| Worktrees and handoff | Create/fork schemas offer worktree environments. `handoff_thread` and `get_handoff_status` are exposed; handoff moves another task and cannot move the calling task. Git worktree listing succeeded. Creation, movement, merging, and write permissions were not exercised. |
| Operational limits | Shell/file tools are available, with restricted network and filesystem permissions. No deployment, cloud agent access, isolated subagent checkout, or unattended continuation is established by this audit. |

Official references describe [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents) and [Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees). Local tool contracts determine which operations this session can actually request; general documentation does not establish account access.

## Routing and cost discipline

1. Read `AGENTS.md`, the short engineering state, Git status, and the relevant implementation. Clarify only missing information that affects the outcome.
2. Keep small fixes and tightly coupled architectural work with the Lead. Delegate only when specialist focus, bounded context, or independent expertise outweighs briefing and review overhead. State that reason briefly when delegating.
3. Choose one temporary role and write a compact brief using `handoffs/TEMPLATE.md`. Pass relevant paths and contracts rather than the entire history. Record a task-specific handoff file for delegated work that must survive interruption or cross a task/worktree boundary; do not create records for every trivial direct edit.
4. Prefer the efficient supported model that can meet acceptance criteria. Do not substitute an unlisted model or treat published API prices as Codex credit costs. Avoid redundant research, duplicate full suites, and repeated status polling.
5. Dispatch one specialist. The Lead may perform independent read-only inspection or planning; avoid competing edits. Specialists may not spawn other agents without returning the proposed need to the Lead. Parallel agents require prior explanation of the compelling benefit, independent boundaries, and collision avoidance unless the user explicitly requests them.

## Specialist roles

| Role | Typical scope | Boundaries |
| --- | --- | --- |
| UI / UX | Interface, interactions, responsive layout, maps/cameras, navigation, accessibility, frontend polish | Preserve learning semantics and evidence timing; shared shell or mode changes require Lead review across affected flows. |
| Content / Learning Systems | Geography/data, activities, quizzes, adaptive learning, educational design, regional expansion | Reuse shared regional contracts; separate exposure from retrieval; do not duplicate planners/stores or silently change scoring/progress. |
| Infrastructure / Quality | Architecture implementation, APIs, persistence, tests, performance, deployment, security, refactoring, technical debt; authentication when requested | Lead retains architectural decisions; backend/accounts/subscriptions require explicit user scope. Deployment is not implied by an implementation assignment. |

Roles may overlap, but each assignment has one objective and explicit file ownership. Changes outside scope should be proposed in the handoff before implementation.

## Integration and acceptance

1. Capture the starting revision and dirty files before delegation. Inspect `git diff` and new files after completion; check that only authorized changes occurred and acceptance criteria hold.
2. For shared-checkout work, review edits in place. Do not reset/revert unrelated work, and do not assume another task's edits are yours. Resolve ambiguity before destructive cleanup.
3. For an explicitly used worktree, record its path, branch/base revision, and actual starting contents. Uncommitted Lead files may not be present. Review and integrate the intended patch/commits into the Lead checkout, resolve conflicts, then test there. Do not equate worker test results with integrated acceptance.
4. Fix issues directly or send one bounded correction back to the specialist. Finish review before starting the next specialist.
5. Follow `testing.md`: focused assertions during implementation; `npm test` after application integration; affected Playwright specs for browser changes, including desktop/mobile when applicable. Shared navigation, persistence, or broad runtime changes warrant broader browser coverage. For documentation-only changes, verify links, claims, and diff hygiene; do not add application tests solely for prose.
6. Before pushing meaningful application changes to `main`, run the feature-specific checks, `npm run test:critical-path`, and `git diff --check`. Treat any failure as a blocked push until it is resolved or positively identified as an unrelated environment failure and documented.
7. Distinguish failed assertions, blocked environment checks, and unrun checks. Do not report simulated/browser-hook results as visual, real-device, accessibility, or pedagogical validation.
8. Update `engineering-state.md` and affected domain docs when the actual state changes. Record nontrivial architectural decisions with rationale and consequences in the relevant domain document; link from engineering state. Keep handoff records concise and mark accepted only after Lead review and testing.
9. Give the user one concise outcome/validation/limitations summary.

## Fallback if direct delegation disappears

Report exactly which tool or operation is missing or failing. If completing the work directly is cheaper, do so. Otherwise, use a repository handoff and a separate Codex task when the user has explicitly requested that task. Resolve the saved project through `list_projects`; default to a worktree for this Git repository, unless the user requests the saved checkout. Carry the brief and required uncommitted context explicitly. Track the returned task ID (a pending client ID is not a ready task ID), wait for completion, inspect its work, integrate, and test. If task creation/control is also unavailable, supply the same handoff for a user-opened task and state the limitation. Never pretend a written brief has been dispatched.
