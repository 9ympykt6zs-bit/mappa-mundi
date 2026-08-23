# U.S. Connections Content Audit

## Decision status

The audit led to a product decision to exclude all four-region Census membership questions from learner-facing U.S. Connections. The 50 memberships remain available as Atlas and reporting metadata. U.S. Connections now contains 252 prompt instances representing 202 distinct concepts: 100 capital prompts representing 50 bidirectional capital relationships, plus 152 retained Atlas relationships.

## Executive summary

U.S. Connections has a sound foundation: it retrieves relationships between states and capitals, neighboring countries, coasts, rivers, Great Lakes, and mountain ranges. Most of those relationships can strengthen a learner's connected map of the United States. The strongest current material is concrete and map-verifiable: capital pairs, international boundaries, coastal relationships, and Great Lake adjacency. River and mountain relationships are also worthwhile, but they need more deliberate teaching and more precise semantics than a single state-to-feature fact can provide.

The four U.S. Census regions are the clear content outlier. They are an official statistical classification, not a relationship a learner can reliably infer from shape, distance, direction, or physical geography. Cases such as Oklahoma, Maryland, and Delaware being in the Census "South," or Alaska and Hawaii being in the Census "West," are correct only within that named classification. The app exposes a state's Census region in the optional Atlas, but it does not teach the classification as a system before assessment. The learner-facing state and capital Journeys instead use 11 practical learning groups with names such as "Southern Plains / Southwest" and "Atlantic South." A learner can therefore understand Oklahoma's location and still miss the Census answer. These questions should leave the core U.S. Connections assessment unless and until Mappa Mundi intentionally teaches why Census regions exist, how their boundaries work, and how they differ from other valid regional schemes.

The audit also found a gap between the activity's promise and its inventory at the time of review. That pool contained 302 question instances representing 252 distinct relationship concepts:

- 100 state-capital questions: 50 relationships asked in both directions;
- 50 Census-region memberships;
- 17 state-to-country international boundaries;
- 25 state-to-coast relationships;
- 36 state-to-major-river relationships;
- 13 state-to-Great-Lake relationships; and
- 61 state-to-mountain-range relationships.

All 202 non-capital questions ask from a state to one related feature. U.S. Connections does not currently include state-to-state borders, relative direction, spatial ordering, or routes. Those more generative forms exist or are envisioned in Mental Map and Reconstruction, but their absence means U.S. Connections presently emphasizes relationship recall more than geographic reasoning. In particular, its internal presentation category "borders and neighbors" contains international-country borders, not neighboring-state questions.

The recommended direction is to keep concrete, visible relationships; teach or contextualize physical-feature associations before assessing them; replace Census-region recall with genuinely spatial relationships; and organize future content by the kind of reasoning it develops rather than by whichever metadata happens to exist in the Atlas.

## Audit scope and method

This audit reviews the question producers currently included in the U.S. Connections production pool and compares them with the surrounding Atlas, Journey, Mental Map, Reconstruction, and Expedition experiences. It evaluates educational fit, not only factual correctness.

"Taught elsewhere" is used strictly here. A fact shown in an optional Atlas profile is **available for exploration**, but that does not guarantee guided exposure or retrieval preparation. Likewise, learning the location and name of a river or mountain range can support a later state-feature question, but it does not necessarily teach every state the feature intersects.

The audit does not independently re-source every geographic fact. Several categories below therefore include a recommendation for a separate factual and terminology review, especially where boundaries or broad physical extents are nuanced.

## Content inventory

| Concept | Example question | Educational value | Concern | Recommendation |
| --- | --- | --- | --- | --- |
| State to capital | "What is the capital of Oklahoma?" | Builds a durable political-place association and reinforces state identity. | Conventional knowledge rather than spatial reasoning; answer can become isolated trivia if never connected to location. | **Keep.** Preserve both prompt directions and connect feedback to the state's location when useful. |
| Capital to state | "Oklahoma City is the capital of which state?" | Tests the same relationship from the harder reverse direction and reduces one-way memorization. | Still mainly associative recall. | **Keep.** It complements state-to-capital retrieval well. |
| Census-region membership | "Which U.S. Census region includes Oklahoma?" | Can teach one official way federal statistics group states. | Administrative metadata, not naturally inferable geography; not explicitly taught; conflicts with the app's 11 learner-facing regional groups. | **Remove/replace** from core Connections. Retain as Atlas reference unless a future lesson explicitly teaches regional schemes. |
| International boundary | "Which country shares an international border with Texas?" | Connects the U.S. map to Canada and Mexico and supports boundary reasoning. | Current records mix land and water international boundaries while nearby Atlas language refers to "land neighbors"; edge cases need clear terminology. | **Keep, with revision.** Define land versus water boundary explicitly and verify labels against the intended relationship. |
| Coast | "Which of these bodies of water borders Florida's coast?" | Reinforces continental orientation and the Atlantic, Pacific, Arctic, and Gulf relationships. | Some states have multiple correct coastal relationships; one-edge questions can imply a unique answer and some coastal definitions are nuanced. No dedicated state-coast teaching path exists. | **Keep, with revision.** Teach on the map, signal when multiple relationships exist, and review coastal definitions. |
| Major river through a state | "Which major river flows through Missouri?" | Connects political areas to visible physical systems and can support routes, settlement, and regional understanding. | "Flows through" may collapse rivers crossing a state with rivers running along or forming its boundary. Feature location is taught, but every state-river edge is not. | **Revise.** Use precise relationship language and precede assessment with state-aware river context. |
| Great Lake bordering a state | "Which Great Lake borders Michigan?" | Strong, visible adjacency that links state position to a coherent water system. | Michigan and New York border multiple Great Lakes; one-edge questions can feel incomplete even when distractors avoid another true answer. | **Keep, with minor revision.** Prefer set-based or explicitly non-exhaustive formulations after lake introduction. |
| Mountain range in a state | "Which mountain range is located in Colorado?" | Connects states to regional landforms and can support climate, water, and movement reasoning. | Mountain extents are broad and less binary than political boundaries; many states have multiple ranges; all 61 edges are not explicitly taught. | **Revise.** Curate high-value associations, teach the visible footprint, and use wording that acknowledges overlap. |

## Question categories

### State-capital relationships

**Current purpose.** Associate each of the 50 states with its capital. Every pair is asked in both directions, producing 100 prompts from 50 concepts.

**Classification.** Useful conventional geographic and civic knowledge that benefits from teaching and context. It is not, by itself, strong evidence of spatial reasoning.

**Taught before assessment.** Yes, in the dedicated U.S. Capitals Journey and in state/capital learning activities. The Across the United States Expedition also places capital learning before U.S. Connections in its guided path. Direct entry can still bypass that sequence, so U.S. Connections should not assume every learner arrived through the Expedition.

**Reinforcement.** Strong for place association and state identity; moderate for location knowledge when the state remains the map reference; weak for adjacency, direction, and mental-map construction.

**Strengths.** The bidirectional prompts avoid purely one-way memorization. Each state has one stable answer, and the relationship is culturally useful and unambiguous.

**Weaknesses.** A learner can memorize a city-state pair without knowing where either belongs spatially. Capitals and Census regions currently share one presentation category despite having very different educational status.

**Recommendation.** Keep both directions. Treat capitals as a foundational political-place relationship, not as proof of higher-order geographic reasoning. Separate capital reporting or presentation from administrative region recall.

### Census-region relationships

**Current purpose.** Ask which of the four U.S. Census regions—Northeast, Midwest, South, or West—contains each state.

**Classification.** Administrative/statistical metadata and potentially confusing when presented as simply "the" geographic region.

**Taught before assessment.** No explicit teaching sequence was found. The optional U.S. Atlas displays a state's region as a profile fact, but the state and capital Journeys use 11 different, pedagogically sized regional groups. Optional lookup is not adequate preparation for retrieval of all 50 Census memberships.

**Reinforcement.** Some coarse location grouping, but little spatial relationship or mental-map development. A learner cannot reason from Oklahoma's neighbors or position to the official Census answer unless the classification boundary has already been memorized.

**Strengths.** The source is internally consistent and covers every state. The four-region scheme can be useful when reading federal datasets or comparing broad statistics.

**Weaknesses.** It tests knowledge of an external naming convention rather than geographic structure. Multiple regional schemes are legitimate, while the prompt gives no reason this one matters. It also creates direct product-language friction: Oklahoma is learned in "Southern Plains / Southwest" but assessed as Census "South." Corrective feedback states the classification but does not explain it.

**Recommendation.** Remove or replace these prompts in the core U.S. Connections pool. Keep Census region as clearly labeled Atlas metadata. If regional systems become a future learning objective, teach them explicitly as one classification among several, explain their purpose, and assess comparison or interpretation rather than unexplained membership recall.

### State borders and neighbors

**Current purpose.** Despite a "borders and neighbors" presentation label, current U.S. Connections questions cover state-to-country international boundaries only. State-to-state adjacency is present in the Atlas data and is used elsewhere for Mental Map routes and Reconstruction, but it is not a current U.S. Connections question category.

**Classification.** State adjacency is intuitive, high-value geographic knowledge. International boundaries are also meaningful, though some water-boundary cases require context.

**Taught before assessment.** Neighboring states and international neighbors are visible in optional Atlas profiles. State locations are taught by Journey and Memory Trail, which makes adjacency increasingly inferable, but there is no dedicated Connections introduction for the 17 international edges.

**Reinforcement.** Strong potential for location, topology, routes, and mental-map construction. The current country-border subset primarily reinforces national context, not the internal connected structure of the United States.

**Strengths.** Canada and Mexico relationships are stable, visible, and useful. They connect state learning to the wider continent.

**Weaknesses.** The current international-border data includes Great Lakes boundary states while an Atlas note and empty-state language describe international neighbors as land neighbors. That inconsistency can make otherwise correct questions confusing. The category name also implies neighboring-state content that it does not deliver.

**Recommendation.** Keep international-boundary questions after defining land and water boundaries consistently. Add state-to-state adjacency to a future relationship taxonomy, preferably through neighbor sets, routes, or constrained reasoning rather than 50-state trivia repetition. Align category labels with actual content.

### Coasts

**Current purpose.** Associate coastal states with the Atlantic Ocean, Pacific Ocean, Arctic Ocean, or Gulf of Mexico.

**Classification.** Intuitive geographic knowledge with high value for orientation, though detailed coastal definitions sometimes require context.

**Taught before assessment.** The oceans are taught in foundational content, and coast relationships appear in optional Atlas profiles. There is no standalone guided activity that systematically teaches state-to-coast relationships before U.S. Connections.

**Reinforcement.** Strong for continental orientation and location. Moderate for mental-map development, especially when learners group a sequence of states along one coast.

**Strengths.** Relationships are map-visible, reusable, and connected to weather, trade, settlement, and regional systems. Florida and Alaska correctly support more than one coastal relationship in the underlying inventory.

**Weaknesses.** Each prompt assesses only one edge. Because other true coast answers for the same state are omitted from that question's distractors, the prompt is technically answerable but can imply a single coastline. Connecticut, Maryland, New York, and similar cases also warrant a transparent convention about sounds, bays, and ocean-facing coastline.

**Recommendation.** Keep, but teach the convention and consider future "select all," coast-sequence, or route-along-a-coast forms. Review edge cases for consistent geographic terminology.

### Major rivers

**Current purpose.** Associate states with one of eight scored major rivers. The pool contains 36 state-river relationships.

**Classification.** Useful physical geography that requires teaching and visual context.

**Taught before assessment.** The United States Journey includes a U.S. Rivers activity before Connections in the Expedition path. That activity teaches river names and locations. It does not explicitly establish every state-river relationship, and direct entry can bypass it. The Atlas lists related rivers per state.

**Reinforcement.** Strong potential for location, connected systems, direction of flow, state boundaries, settlement, and regional reasoning. The current single-edge recall form realizes only part of that potential.

**Strengths.** Rivers cross political boundaries and naturally connect distant places. They are among the best foundations for explaining why regions and cities developed as they did.

**Weaknesses.** The prompt uniformly says a river "flows through" the state. In geographic use, a river may cross a state's interior, run along it, or form part of its boundary. The atlas model distinguishes `flowsThrough` from `bordersState` for some records, but the scored inventory still needs a factual review for consistent use of those terms. Multiple river relationships per state are also tested as isolated edges.

**Recommendation.** Retain the concept but revise its instructional and semantic model before expanding it. Distinguish "crosses," "runs along/forms a border," and broader river-system relationships. Prefer map-supported reasoning such as tracing a river through ordered states or identifying downstream connections.

### Great Lakes

**Current purpose.** Associate states with the five Great Lakes through 13 state-lake border relationships. Great Salt Lake is taught in the lakes activity but is intentionally not part of this Great Lakes question type.

**Classification.** Intuitive and useful physical adjacency that benefits from initial teaching.

**Taught before assessment.** The U.S. Lakes activity teaches the names and locations of the five Great Lakes and Great Salt Lake. The Atlas shows bordering waters for a selected state. The complete set of state-lake edges is not separately introduced.

**Reinforcement.** Strong for state position, adjacency, and regional mental-map development. It can also support later reasoning about the Great Lakes as a connected system.

**Strengths.** The relationships are concrete and visually verifiable. They connect state geometry to an important physical system rather than an arbitrary label.

**Weaknesses.** A state can border several lakes. Repeated one-edge multiple-choice questions do not help the learner organize the full set and can sound underdetermined without the answer choices.

**Recommendation.** Keep. Stage it after lake recognition and evolve toward set-building, shoreline tracing, or connected-system questions. Make clear whether a prompt asks for one valid lake or the complete set.

### Mountain ranges

**Current purpose.** Associate states with 20 scored mountain ranges through 61 state-range relationships.

**Classification.** Useful physical geography requiring teaching and context; potentially confusing at fine granularity because range extents are not crisp administrative boundaries.

**Taught before assessment.** The U.S. Mountain Ranges activity teaches the names and approximate mapped footprints of the same 20 ranges, and the Expedition places physical-feature work before Connections. It does not explicitly drill all 61 state memberships. Atlas profiles list the curated associations.

**Reinforcement.** Moderate to strong for regional location and landscape recognition. It becomes much stronger geographic reasoning when connected to orientation, watersheds, climate barriers, routes, or nested mountain systems.

**Strengths.** The shared physical-feature inventory gives the relationships a visible basis. Major systems such as the Rockies and Appalachians help organize large portions of the country.

**Weaknesses.** "Located in" presents a broad range footprint as a binary membership. Some states have several valid ranges, and the inventory mixes continent-scale systems with smaller ranges such as the Tetons, Olympics, and Black Hills. Memorizing 61 independent edges can become taxonomy-heavy without an organizing visual model.

**Recommendation.** Revise rather than remove. Prioritize high-value anchor relationships, use the mapped footprint during teaching and feedback, and acknowledge that ranges span or overlap states. Add finer-grained ranges only when they deepen a coherent regional model.

## Cross-category findings

### One-edge questions hide many-to-many structure

Coasts, rivers, Great Lakes, and mountain ranges are many-to-many relationships. The generator removes other true targets for the reference state from the distractor set, so each individual question remains answerable. Educationally, however, repeated "Which..." prompts can imply that the chosen relationship is unique. Future formats should distinguish "name one," "select all," and "identify the complete set."

### Exposure is not the same as teaching

The Atlas is a valuable reference and exploration surface. Its optional first position in the Expedition does not guarantee that a learner opened every state profile or noticed every relationship. Capital pairs receive explicit instruction; physical features receive name-and-location instruction; Census regions, international boundaries, and state-coast edges mostly receive passive exposure. U.S. Connections should either provide an appropriate introduction path or limit assessment to relationships the learner has had a meaningful chance to learn.

### Current Connections evidence is mostly associative recall

Every non-capital prompt starts with a state and asks for one related feature. That is legitimate retrieval, but it does not by itself show that the learner can navigate adjacency, compare positions, construct a route, or reconstruct the map. U.S. Connections should remain distinct from Mental Map and Reconstruction, while its content taxonomy should point toward relationships that those higher-order modes can reuse.

## Proposed future taxonomy

The following taxonomy organizes relationships by educational function. It is a product-content direction, not an implementation commitment.

### 1. Place associations

Stable pairs that establish political and named-place foundations:

- state and capital;
- state and major identifying physical feature;
- feature and the principal region it helps define.

These support recall but should not be treated as the highest level of geographic understanding.

### 2. Topology and adjacency

Relationships about what touches or connects:

- neighboring states;
- international land and water boundaries;
- states bordering a Great Lake;
- coastal states and bodies of water;
- rivers that cross or form state boundaries.

This should distinguish `touches`, `crosses`, `contains`, and `forms a boundary` instead of collapsing them into generic membership.

### 3. Relative position and orientation

Relationships that build an internal coordinate system:

- north, south, east, and west of another state or feature;
- between two places;
- coastal or river sequences;
- ordering places along an axis;
- contiguous versus noncontiguous relationships.

These are more inferable and transferable than administrative labels.

### 4. Connected paths and routes

Relationships that require combining several known edges:

- routes through adjacent states;
- border chains;
- river paths through successive states;
- routes constrained by a coast, range, or region.

This category provides stronger evidence of a connected mental map than one-edge recall.

### 5. Physical systems

Relationships explaining how land and water work together:

- river course, boundary, tributary, and drainage relationships;
- Great Lakes connections and outflow;
- mountain systems, divides, rain shadows, and headwaters;
- coast, gulf, bay, and watershed systems.

These should be introduced visually before retrieval and should emphasize why the relationship matters.

### 6. Spatial synthesis

Tasks that combine identity, location, topology, and scale:

- reconstructing a region;
- identifying a misplaced state from its neighbors;
- choosing a route and explaining constraints;
- relating a physical feature to several political areas.

Mental Map and Reconstruction are natural homes for these tasks; U.S. Connections can provide the component relationships without replacing those mechanics.

### Reference classifications

Administrative and statistical schemes—such as Census regions—should be kept outside the core progression taxonomy by default. They may be useful reference knowledge or the subject of an explicitly taught comparison lesson, but structured data availability alone should not make them assessment targets.

## Content gaps

The current pool would better support geographic reasoning with the following relationships:

- **State-to-state adjacency.** Neighbor sets, shared-border identification, and "which state connects these two?" questions are the most direct missing relationship type.
- **Routes and border chains.** Multi-step paths reveal whether individual adjacency facts form a usable mental map.
- **Relative direction.** East/west, north/south, between, and ordering questions make location knowledge relational rather than isolated.
- **Explicit river semantics.** Learners should distinguish a river crossing a state from running along its boundary, then trace upstream/downstream or drainage connections.
- **Complete relationship sets.** Selecting all Great Lakes, coasts, rivers, or major ranges associated with a state would reveal structure that one-edge prompts hide.
- **Physical-to-political synthesis.** Questions could connect ranges to headwaters, rivers to coasts, or lakes to international boundaries after the component facts are taught.
- **Noncontiguous-state reasoning.** Alaska and Hawaii deserve relationships based on their actual North Pacific, Arctic, and continental contexts rather than forced analogues to Lower 48 adjacency.
- **Scale and nested systems.** Large mountain systems and smaller ranges should be related explicitly so that learners do not encounter them as a flat list of equivalent memberships.

## Recommended changes

These recommendations concern future content direction only; this audit does not change the current question pool.

### Keep

- Both directions of every state-capital relationship.
- International-boundary relationships with Canada and Mexico, after terminology is made consistent.
- State-to-coast relationships as map-visible continental orientation.
- Great Lake adjacency after lake recognition.
- Major river and mountain relationships as educational concepts, subject to the revisions below.

### Revise

- Separate capitals from Census regions in the learner-facing taxonomy.
- Rename presentation categories so "neighbors" is used only when adjacency is actually assessed.
- Define land border, water boundary, coast, crosses, flows through, runs along, contains, and overlaps consistently.
- Make many-to-many prompts explicit: one valid relationship versus the complete set.
- Add guided exposure for relationships currently available only through optional Atlas exploration.
- Curate river and mountain edges by national or regional learning value rather than treating every stored association as equally important.
- Connect physical-feature recall to sequences, systems, and reasons the feature matters.

### Remove or replace

- Remove four-region Census membership recall from core U.S. Connections.
- Replace it with state adjacency, relative position, ordering, or route-ready relationships that a learner can understand from the map.
- Do not replace Census regions with a different unexplained regional classification; the issue is the assessment of arbitrary membership without purpose or teaching.

### Investigate further

- Fact-check all 36 scored river relationships and classify each as crossing the interior, running along a boundary, or both.
- Reconcile the international-boundary records with Atlas wording that currently describes international neighbors as land neighbors, especially Great Lakes states.
- Document the coast convention for sounds, bays, Gulf coastline, and Arctic coastline, then review all 25 edges against it.
- Review the 61 mountain associations for scale, overlap, and instructional importance.
- Observe learners to determine whether one-edge questions are interpreted as exclusive when a state has multiple true rivers, lakes, coasts, or ranges.
- Decide what minimum exposure should precede a Connections assessment when learners enter directly rather than through the Expedition.

## Conclusion

U.S. Connections should help a learner answer, "How does this place relate to the places and physical systems around it?" Most of the existing source material can support that goal. The immediate product distinction is between relationships grounded in the map and classifications grounded in an external convention. Capitals are worth teaching as stable political associations; coasts, boundaries, lakes, rivers, and mountains are worth developing as visible connected geography. Census-region membership is valid reference metadata, but without explicit purpose and instruction it is not good evidence of geographic understanding.

The long-term opportunity is not simply to add more relationship facts. It is to help learners combine a smaller set of well-taught relationships into direction, adjacency, routes, systems, and a durable mental map of the United States.
