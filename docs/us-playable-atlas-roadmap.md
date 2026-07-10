# United States Playable Atlas Roadmap

This roadmap defines the first vertical slice for turning Mappa Mundi into a playable atlas. The United States experience should prove the core product loop before expanding the same model to the world.

## Objectives

- Make the United States experience feel like a persistent atlas the learner gradually reveals and masters.
- Use existing U.S. content first: states, capitals, regions, rivers, lakes, and mountain ranges.
- Add structured geographic relationships before adding large amounts of new content.
- Build three spatial mechanics that teach more than identification.
- Create one polished U.S. Expedition that combines atlas discovery, teaching, practice, and a final mission.
- Keep the completed U.S. experience strong enough to become the long-term free edition.

## Product Scope

The vertical slice should include:

- Personal U.S. atlas with place entries and visible learning states.
- U.S. relationship model for borders, capitals, regions, and physical-feature connections.
- Mastery model for recognition, naming, locating, and relationships.
- Border Chain, Compass Challenge, and Map Reconstruction mechanics.
- "Across the United States" Expedition.
- Daily Trail and Memory Trail integration.
- Practical onboarding and public-beta readiness checks.

## Milestones

| Milestone | Target window | Status | Implementation objective | Acceptance criteria |
|---|---|---|---|---|
| 1. Stable foundation | Weeks 1-2 | Not started | Create a canonical U.S. data model and relationship layer for states, capitals, regions, rivers, lakes, and mountain ranges. Start separating playable-atlas work from the current journey flow where needed. | The app can answer relationship questions in code, such as which states border Tennessee, which states touch the Mississippi River, which capital belongs to Louisiana, which mountain ranges are associated with Colorado, and which region contains Maine. |
| 2. Personal U.S. atlas | Weeks 3-4 | Not started | Add a dedicated U.S. atlas surface with entries for states and physical features. Show capital, region, neighbors, connected features, and learning state. | Learning a state in Daily Trail or Memory Trail visibly and permanently changes the atlas. The user can browse learned places without starting another quiz. |
| 3. Meaningful mastery | Weeks 5-6 | Not started | Track separate mastery dimensions for recognition, naming, locating, and relationships. Add a U.S. knowledge-map overview and regional/national summaries. | A place cannot be mastered from one correct identification. The app can show what the learner knows, what is weak, and what should be practiced next. |
| 4. Border Chain | Week 7 | Not started | Add a mode where the learner selects every state bordering a target state. Feed results into relationship mastery. | The mode teaches adjacency and feels distinct from standard identification. Feedback clearly explains missed and extra border selections. |
| 5. Compass Challenge | Week 8 | Not started | Add direction and relative-position questions using states, capitals, regions, and physical features. | The learner must reason spatially, such as choosing what lies west of Arkansas or northeast of a target place, rather than merely recognizing a highlighted shape. |
| 6. Map Reconstruction | Weeks 9-10 | Not started | Add a reconstruction mechanic for one U.S. region first, with snapping, tolerance, and correction feedback. Expand only if the regional version is reliable. | A child and an adult can understand the interaction without outside explanation. It works on mobile without fragile dragging or layout problems. |
| 7. Expedition framework | Week 11 | Not started | Build a reusable Expedition sequence model that supports introduction, atlas discovery, teaching moments, multiple mechanics, checkpoints, and a final mission. | A new Expedition can be created mostly from structured content instead of custom JavaScript. |
| 8. Across the United States Expedition | Week 12 | Not started | Create one polished Expedition crossing the country through regions, states, capitals, rivers, lakes, mountain ranges, borders, and directional reasoning. | A new user can play for 20-30 minutes and describe the experience as exploration or a game, not only a sequence of quizzes. |
| 9. Onboarding and navigation | Week 13 | Not started | Make the first-run path and main navigation coherent around Atlas, Daily Trail, and Expeditions. Update wording for curious learners of all ages. | A new user understands the next action within about 30 seconds and can resume in the right place later. |
| 10. Public-beta readiness | Week 14 plus buffer | Not started | Complete mobile testing, browser testing, progress migration/corruption checks, basic analytics, performance work, accessibility basics, and bug triage. | Five outside users can complete onboarding, an Expedition, and a Daily Trail session without help. |

## Progress Gates

| Date checkpoint | Required result |
|---|---|
| End of Week 4 | Personal atlas visibly responds to learning. |
| End of Week 6 | Mastery system is credible and integrated. |
| End of Week 10 | Three distinct spatial mechanics work. |
| End of Week 14 | One complete Expedition works for outside users. |

If a gate slips by more than two weeks, reduce scope before pushing every later milestone out.

## Scope Exclusions

Do not include these in the first U.S. vertical slice:

- Payment processing.
- Account creation or cross-device sync unless beta testing cannot work without it.
- Global physical geography expansion.
- Public leaderboards.
- User-generated Expeditions.
- Classroom dashboards.
- Family profiles.
- Native mobile apps.
- Large batches of new conventional quiz activities.
- Elaborate achievements, streak systems, or cosmetic reward economies.

## Free Edition Direction

The finished U.S. experience should become the permanent free edition:

- Complete U.S. atlas.
- All 50 states and capitals.
- Existing U.S. physical features.
- Daily Trail and Memory Trail.
- Border Chain, Compass Challenge, and Map Reconstruction.
- "Across the United States" Expedition.
- Genuine mastery tracking.

The paid world edition should sell a larger world built on the same systems, not remove artificial limits from the U.S. experience.
