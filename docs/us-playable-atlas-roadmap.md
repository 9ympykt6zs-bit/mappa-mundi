# United States Playable Atlas Roadmap

This roadmap defines the first vertical slice for turning Mappa Mundi into a playable atlas. The United States experience should prove the core product loop before expanding the same model to the world.

## Objectives

- Make the United States experience feel like a persistent atlas the learner gradually reveals and masters.
- Use existing U.S. content first: states, capitals, regions, rivers, lakes, and mountain ranges.
- Add structured geographic relationships before adding large amounts of new content.
- Build recall-first and spatial mechanics that teach more than identification.
- Create one polished U.S. Expedition that combines atlas discovery, teaching, practice, and a final mission.
- Keep the completed U.S. experience strong enough to become the long-term free edition.

## Product Scope

The vertical slice should include:

- Personal U.S. atlas with place entries and visible learning states.
- U.S. relationship model for borders, capitals, regions, and physical-feature connections.
- Mastery model for recognition, naming, locating, and relationships.
- Mental Map Challenge and Map Reconstruction mechanics, with directional and border-graph utilities shared across Mental Map question categories.
- "Across the United States" Expedition.
- Daily Trail and Memory Trail integration.
- Practical onboarding and public-beta readiness checks.

## Milestones

| Milestone | Target window | Status | Implementation objective | Acceptance criteria |
|---|---|---|---|---|
| 1A. Canonical atlas data | Weeks 1-2 | Complete | Create a canonical U.S. data model and relationship layer for states, capitals, regions, rivers, lakes, and mountain ranges. | The app can answer relationship questions in code, such as which states border Tennessee, which states touch the Mississippi River, which capital belongs to Louisiana, which mountain ranges are associated with Colorado, and which region contains Maine. |
| 1B. Read-only atlas queries | Weeks 1-2 | Complete | Provide a UI-independent query adapter that returns safe state profiles, relationships, regional lists, and state search results from canonical atlas data. | Future UI can retrieve a state's capital, region, borders, connected features, and postal-abbreviation search results without accessing mutable canonical records. |
| 2A. Read-only U.S. atlas prototype | Weeks 3-4 | Complete | Add a dedicated U.S. atlas browsing surface with neutral state selection and read-only geographic profiles from the canonical atlas query adapter. | A user can open the United States Atlas, select a state, and browse its capital, region, neighbors, and existing connected physical features on desktop or mobile. |
| 2B. Atlas geographic context | Weeks 3-4 | Complete | Expand state profiles with typed international land neighbors, coasts, maritime neighbors, and major bordering waters. | The atlas distinguishes land borders from coasts and maritime relationships, including Alaska's Bering Strait relationship to Russia. |
| 2C. Personal U.S. atlas learning state | Weeks 3-4 | Complete | Read existing Daily Trail and United States Memory Trail state progress into the atlas as a read-only learning snapshot. | Every state has an unexplored, discovered, learning, strong, or mastered atlas status; the map, profile, and summary update without changing either learning system. |
| 3A. Mental Map Challenge prototype | Week 5 | Complete | Provide one recall-first activity for geographic recall, relationship recall, directional reasoning, ordered spatial reasoning, and route reasoning while retaining border graph, shortest-path, and Compass direction utilities. | The learner answers without geographic hints, submits, and then sees the atlas, reference states, physical features, and directional guides as visual correction and explanation. |
| 3. Meaningful mastery | Weeks 5-6 | Not started | Track separate mastery dimensions for recognition, naming, locating, and relationships. Add a U.S. knowledge-map overview and regional/national summaries. | A place cannot be mastered from one correct identification. The app can show what the learner knows, what is weak, and what should be practiced next. |
| 4. Relationship challenge expansion | Week 7 | Not started | Expand Mental Map Challenge with adjacency and relationship questions powered by the retained Border Chain graph utilities. Feed future results into relationship mastery. | Questions teach adjacency without exposing the map before recall; feedback clearly explains missed and extra relationships afterward. |
| 5. Directional Mental Map categories | Week 8 | Complete (consolidated) | Fold single-direction, relative-position, and directional-ordering questions into Mental Map Challenge while retaining Compass definitions, evaluation utilities, and geometry-backed arrows as internal infrastructure. | Direction questions rotate with other Mental Map categories in the same map-hidden answer flow and reveal reference states and arrows after submission. |
| 6. Map Reconstruction | Weeks 9-10 | Complete (Lower 48) | Ten regional reconstruction activities now cover every contiguous state exactly once using the shared tolerant placement, correction, and accessible interaction system. | A child and an adult can rebuild any Lower 48 region without outside explanation, including mobile interaction, correction replay, and geometry-aware piece selection. |
| 7. Expedition framework | Week 11 | Not started | Build a reusable Expedition sequence model that supports introduction, atlas discovery, teaching moments, multiple mechanics, checkpoints, and a final mission. | A new Expedition can be created mostly from structured content instead of custom JavaScript. |
| 8. Across the United States Expedition | Week 12 | Not started | Create one polished Expedition crossing the country through regions, states, capitals, rivers, lakes, mountain ranges, borders, and directional reasoning. | A new user can play for 20-30 minutes and describe the experience as exploration or a game, not only a sequence of quizzes. |
| 9. Onboarding and navigation | Week 13 | Not started | Make the first-run path and main navigation coherent around Atlas, Daily Trail, and Expeditions. Update wording for curious learners of all ages. | A new user understands the next action within about 30 seconds and can resume in the right place later. |
| 10. Public-beta readiness | Week 14 plus buffer | Not started | Complete mobile testing, browser testing, progress migration/corruption checks, basic analytics, performance work, accessibility basics, and bug triage. | Five outside users can complete onboarding, an Expedition, and a Daily Trail session without help. |

## Progress Gates

The core Mental Map learning pattern is:

1. Recall without a map.
2. Submit an answer.
3. Reveal the atlas as visual feedback.

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

## Beyond The Lower 48

Alaska and Hawaii are intentionally excluded from regional Map Reconstruction. Their geographic separation, Alaska's true scale, and the arbitrary inset layouts used by standard U.S. maps would teach cartographic convention rather than meaningful relative placement.

A future activity tentatively titled **Beyond the Lower 48** may teach silhouette recognition, correct orientation, Alaska's relationship to Canada and the continental United States, Hawaii's central-Pacific location, true state-scale comparisons, and why conventional maps use insets. Alaska and Hawaii should not be reduced to an artificial two-piece reconstruction region.

## Free Edition Direction

The finished U.S. experience should become the permanent free edition:

- Complete U.S. atlas.
- All 50 states and capitals.
- Existing U.S. physical features.
- Daily Trail and Memory Trail.
- Mental Map Challenge, including directional reasoning, and Map Reconstruction.
- "Across the United States" Expedition.
- Genuine mastery tracking.

The paid world edition should sell a larger world built on the same systems, not remove artificial limits from the U.S. experience.
