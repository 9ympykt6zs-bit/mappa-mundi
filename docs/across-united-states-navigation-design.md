# Across the United States Navigation Design

## Purpose and status

This document specifies a proposed learner-facing navigation model for **Across the United States**. It translates the documented progression philosophy into a concrete screen hierarchy without changing the activities, learner state, evidence, scoring, Progress Report, or current behavior underneath it.

This is a design specification, not a description of functionality that is already built. It intentionally separates the target learner experience from the smallest safe first implementation.

The design follows:

- [Across the United States Progression Redesign](across-united-states-progression-redesign.md);
- [Regional Demonstration Model](regional-demonstration-model.md);
- [Expedition Learning Model](expedition-learning-model.md);
- [Learning Support and Hint Philosophy](learning-support-and-hints.md);
- [Geographic Visualization Principles](geographic-visualization-principles.md).

## Product problem

The current experience exposes Journey, Memory Trail, Connections, Mental Map, Reconstruction, individual physical-feature activities, and final missions as peer destinations. These are meaningful systems, but their names describe product architecture or gameplay mechanics more often than learner intent.

The redesigned screen should let a learner answer two questions within a few seconds:

1. **What am I trying to understand?**
2. **What would be useful for me to do next?**

The top level should therefore contain four learning objectives, one prominent recommendation, and one secondary prior-knowledge pathway. It should not become a dashboard or reproduce the activity catalog as large cards.

## Learner-facing progression

The screen should communicate this conceptual sequence:

> **Learn the Map → Understand the Landscape → Connect the Map → Use Everything Together**

These are learning dependencies, not mandatory gates. All available areas remain accessible. The ordering explains why an earlier area may make a later one easier; it does not imply that the learner must complete every activity in order.

The four learner-facing areas are as follows.

### 1. Learn States & Capitals

**Learner goal:** Build the political and spatial map of the United States.

Includes:

- state locations;
- state identification and names;
- capitals and state-capital associations;
- regional map reconstruction.

Regional reconstruction belongs here as a learning method, not only as a final assessment. Building a region helps the learner understand how state shapes, neighbors, and relative positions form a connected mental map.

Underlying Journey, Memory Trail, capital-learning, and reconstruction mechanics may remain distinct. The learner should not need to understand those distinctions from the home screen.

**Short explanation:** “Learn where the states are, what they're called, and their capitals.”

### 2. Learn Physical Features

**Learner goal:** Understand the physical landscape of the United States.

Includes:

- mountain ranges;
- rivers;
- lakes and Great Lakes;
- coasts and major bordering waters;
- other supported major physical systems.

This area adds the physical framework around and through the political map. It is useful preparation for later Connections questions, but it does not become a hard prerequisite.

Geographic objects should retain their established data, location, labels, and visual vocabulary across learning and feedback contexts.

**Short explanation:** “Learn the mountains, rivers, lakes, and coasts that shape the United States.”

### 3. Learn Connections

**Learner goal:** Understand how places and geographic features relate.

Includes:

- state-capital relationships;
- borders and adjacency where supported;
- relationships between states and physical features;
- routes;
- relative position and direction;
- geographic and spatial reasoning.

This area may use Connections and Mental Map mechanics underneath. It must not reintroduce Census-region questions.

The interface may recommend earlier preparation without blocking entry. For example:

> Connections are easier when you understand the physical map. We recommend Physical Features first, but you can continue.

The recommendation should present two clear actions: **Explore Physical Features** and **Continue to Connections**. Neither action should be styled as an error recovery.

**Short explanation:** “See how states, capitals, borders, rivers, mountains, and other places relate to one another.”

### 4. Explore the United States

**Learner goal:** Use knowledge from the other areas together.

This is the future integrated U.S. Journey or Expedition layer. It may combine:

- label placement;
- identifying targets from spoken or written prompts;
- regional reconstruction;
- physical geography;
- Connections questions;
- routes;
- higher-order spatial reasoning.

The area should feel like one coherent geographic journey, not a fourth submenu full of unrelated activity names. Existing mechanics can be composed without being replaced or homogenized.

**Short explanation:** “Use everything you've learned in combined geographic challenges.”

## Guided freedom behavior

All four objective areas should appear available. The home screen may communicate recommendation, preparation, progress, or demonstrated knowledge, but should not use prerequisite padlocks between them.

Guidance may include:

- **Recommended next** — a useful next experience based on existing information;
- **Currently learning** — the area with recent or active learning;
- **Useful preparation** — a non-blocking explanation of why another area may help;
- **Demonstrated** — future recognition of broad integrated regional knowledge;
- **Continue anyway** — an ordinary action when the learner chooses a later area.

Avoid visual conventions that imply inaccessible content when access is actually open. A sequence line or numbered order should not make later areas look disabled.

The same principle applies globally: progress in the United States must never determine whether a learner can enter Europe, Central America, South America, or another available region.

## Home-screen hierarchy

The page should use the following priority order:

1. **Region identity:** Across the United States.
2. **Primary recommendation:** one prominent Continue or Recommended next action.
3. **Four objective areas:** the dominant navigation choices.
4. **Show What I Know:** a clear but secondary prior-knowledge pathway.
5. **Progress Report and secondary utilities:** available without turning the page into a dashboard.

The recommendation reduces repeated menu inspection for returning learners. The four objectives preserve agency and make the system understandable for new learners.

## Primary recommendation

The primary action should answer:

> What would be useful for me to do next?

Recommended presentation:

- eyebrow: **Recommended next** or **Continue learning**;
- learner-facing destination, such as **Practice Midwest states and capitals**;
- one short reason, such as **Keep building the regional map you started**;
- one dominant **Continue** button;
- optional text link to choose another area.

The recommendation should name the learning goal or concrete task, not expose an internal selector or scheduler decision.

Existing learner information that could eventually inform this presentation includes:

- current or recently used Across the United States destination;
- existing Journey step completion;
- existing U.S. Memory Trail introduction and practice state;
- existing canonical evidence for states, capitals, physical features, Connections, Mental Map, and Reconstruction where available;
- existing Expedition-derived step states and recommended next step;
- activity resume state;
- existing Progress Report read models.

This list identifies possible inputs, not a new adaptive algorithm. The first version should reuse current deterministic recommendation behavior where it is reliable and map the result into learner-facing objective language. Recommendations remain guidance; the learner can always choose another area.

## Progress presentation

The home screen should communicate enough progress to orient the learner without becoming a miniature Progress Report.

Each objective may display one compact state:

- **Not started** — no meaningful learning activity is available in the current read model;
- **Learning** — the learner has begun building knowledge in the area;
- **Showing progress** — evidence indicates meaningful development, without claiming broad regional competence;
- **Demonstrated** — future high-bar recognition from the regional demonstration pathway.

These labels require future product calibration before they can become authoritative. The UI must not derive **Demonstrated** from activity completion, time spent, or scheduler mastery.

The following concepts remain distinct:

| Concept | Meaning | Home-screen treatment |
| --- | --- | --- |
| Accumulated learning progress | Evidence from ordinary instruction, practice, support, and retrieval | May inform a compact objective state and recommendation |
| Individual activity completion | Completion or resume state owned by one activity | May appear inside the relevant objective submenu |
| Regional Demonstrated status | Optional recognition of broad integrated knowledge | Region-level status; never inferred from one activity |
| Internal scheduler mastery | Operational estimate used to choose practice | Not shown as regional completion or permission |

The home screen may link to **View Progress Report** for detail. It should not reproduce per-category scores, histories, or mastery calculations.

## Prior-knowledge entry point

The target design includes a secondary action labeled **Show What I Know**.

Supporting text should make its purpose and optional nature clear:

> Already know the United States? Try an integrated challenge to demonstrate your knowledge.

The control should remain visually secondary to Continue and the four learning objectives. It must not look like an entrance exam or a requirement for accessing other content.

The eventual pathway represents a voluntary, high-bar, non-gating regional demonstration. Success may recognize the United States as Demonstrated. An unsuccessful attempt must not restrict access and may support recommendations for useful learning areas.

Until a truthful regional demonstration flow, qualification rule, and evidence treatment exist, production UI should not present an enabled action that claims it can award Demonstrated status. The location may be reserved in the design, but a misleading or dead-end control is worse than temporarily omitting it.

## Contextual explanations

Each major objective needs a concise learner-facing explanation of what happens when it is selected.

### Desktop and pointer interfaces

On hover, reveal the objective's one-sentence explanation quickly and unobtrusively. Keyboard focus must reveal the same text and keep it available for as long as focus remains on the item.

Recommended treatment:

- keep the objective card itself visually compact;
- show the explanation in a small anchored preview panel or stable detail strip near the objective grid;
- use a short transition rather than a delayed tooltip;
- hide the pointer-triggered explanation when the pointer leaves both the item and its explanation region;
- retain the explanation during keyboard focus;
- associate the explanation programmatically with the focused control;
- do not place essential access or progress information exclusively inside the hover treatment.

A stable shared detail strip is preferable to four floating tooltips if it reduces motion and overlap. The selected card should receive a subtle visual emphasis while its description is shown.

### Touch and mobile interfaces

The least cluttered equivalent is an always-visible one-line subtitle inside each objective row. It requires no extra tap, avoids ambiguous info icons, and lets the learner compare all four choices without opening and closing explanations.

On narrow screens, the title, compact progress state, and subtitle should remain visible together. If a subtitle wraps, it should normally be limited to two lines. Do not require a first tap to explain and a second tap to navigate unless later usability testing shows that accidental navigation is a material problem.

### Secondary activities

Submenu activities should use explanatory subtitles when their learner-facing label is ambiguous or when two choices have meaningfully different learning purposes. They do not all require hover panels. Familiar, concrete actions such as **Practice capitals** or **Build the Midwest map** may be self-explanatory.

Contextual help should clarify choice, not add a second paragraph to every row.

## Underlying activity mapping

The redesign reorganizes presentation while retaining the current systems and mechanics.

| Current activity or system | New parent objective | Keep current internal name visible? | Role | Learner-facing treatment |
| --- | --- | --- | --- | --- |
| United States Journey regional state steps | Learn States & Capitals | No at top level; optional in secondary details | Learning and guided practice | **Learn state locations and names** or a regional task such as **Learn the Midwest** |
| U.S. Memory Trail | Learn States & Capitals | Usually no; retain only where the name is useful to returning learners | Learning, adaptive practice, and review | **Practice states & capitals** with resume context |
| U.S. Capitals Journey / capital learning | Learn States & Capitals | No at top level | Learning and practice | **Learn state capitals** |
| Regional Map Reconstruction | Learn States & Capitals | Use “Build a regional map”; “Reconstruction” may remain secondary | Learning and assessment | Region choices grouped under **Build the map** |
| U.S. Rivers activity | Learn Physical Features | No at top level | Learning and practice | **Learn major rivers** |
| U.S. Lakes activity | Learn Physical Features | No at top level | Learning and practice | **Learn major lakes** |
| U.S. Mountain Ranges activity | Learn Physical Features | No at top level | Learning and practice | **Learn mountain ranges** |
| Coast and bordering-water content where currently supported | Learn Physical Features | No internal system name | Learning and practice | **Learn coasts and waters** |
| U.S. Connections | Learn Connections | “Connections” may remain as a secondary activity label because it matches the concept | Learning, practice, and assessment | **Practice geographic connections** |
| Mental Map Challenge | Learn Connections | Not at top level; may remain as a named advanced practice choice | Practice and assessment of reasoning | **Routes & spatial reasoning** or another task-specific label |
| Lower 48 Reconstruction capstone | Explore the United States | No at top level; identify it as an advanced map challenge | Assessment and integrated application | **Rebuild the Lower 48** |
| Current Expedition/final mission orchestration | Explore the United States and the overall container | Do not expose framework terminology | Guided progression and assessment composition | Present as a coherent U.S. journey, not a list of framework steps |
| United States Atlas | Contextual support across all four objectives | “Atlas” may remain visible as a familiar secondary destination | Exploration and reference; not scored | **Explore the U.S. Atlas** in secondary navigation |
| Progress Report | Secondary utility, not a learning objective | Yes | Reporting | **View Progress Report** outside the four-card hierarchy |

An activity may support more than one role without appearing in multiple top-level places. For example, regional reconstruction is primarily housed under Learn States & Capitals because it builds the mental map, while a later reconstruction capstone belongs in Explore as an integrated assessment.

## Submenu behavior

Opening an objective should show one recommended action first, followed by a small number of learner-facing choices grouped by purpose. It should not reveal every activity implementation as an equally weighted card.

Recommended hierarchy inside an objective:

1. objective title and one-sentence goal;
2. Continue or recommended next action;
3. two to four meaningful learning/practice choices;
4. optional region picker or advanced practice section;
5. compact progress link.

Returning from an activity should return to the objective context or the Across the United States home with a refreshed recommendation, using existing return behavior where possible.

## Trail/path evaluation

The trail is a navigation and motivation layer, not the curriculum. Three models were considered.

| Criterion | Simple objective navigation | Branching trail/path | Hybrid objective path |
| --- | --- | --- | --- |
| Clarity | Excellent: four obvious goals | Variable: branches require interpretation | Excellent if the path remains visually light |
| Guided freedom | Strong: all choices can look available | Risk of implying locks and mandatory order | Strong: order is visible without disabling choices |
| Mobile usability | Strong: stacked rows/cards | Weak to moderate: paths become tall, dense, or horizontally awkward | Strong: stacked objectives with a compact sequence cue |
| Future world scalability | Strong: reusable region template | Moderate: every region may require bespoke trail layout | Strong: reusable shell with region-specific objective content |
| Progress communication | Good with compact states | Visually expressive but easy to overstate completion | Good: compact status plus ordered relationship |
| Recommendation | Clear dedicated Continue panel | May compete with the next trail node | Clear dedicated Continue panel plus subtle path emphasis |
| Prior-knowledge pathway | Easy to keep secondary and independent | Harder to place without looking like a bypass around locks | Easy to place outside the objective sequence |
| Visual complexity | Low | High | Low to moderate |

### Recommended model: a restrained hybrid

Use objective-based navigation as the primary information architecture, with a subtle ordered path connecting the four objectives. The path may use numbers, a light connecting line, or a short sequence caption. It must not use lock imagery or make later objectives appear unavailable.

This hybrid preserves the motivational sense of progression while retaining the clarity of four ordinary choices. It scales to mobile and future regions more reliably than a branching illustrated trail. A more expressive trail could be explored later as a visual layer, but it should not determine curriculum structure or access.

## Wireframes

The wireframes describe information hierarchy rather than final visual styling.

### Desktop — Across the United States home

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← World                         Across the United States      View Progress │
│                                  Learn the map. Use the map.                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ RECOMMENDED NEXT                                                            │
│ Continue learning Midwest states & capitals                                 │
│ Keep building the regional map you started.                 [ Continue ]    │
│                                                        Choose another area  │
├─────────────────────────────────────────────────────────────────────────────┤
│ All areas are open                                                          │
│                                                                             │
│  1 ───────────────── 2 ───────────────── 3 ───────────────── 4              │
│                                                                             │
│ ┌───────────────────────────┐  ┌───────────────────────────┐                │
│ │ Learn States & Capitals   │  │ Learn Physical Features   │                │
│ │ Learning                 →│  │ Not started              →│                │
│ └───────────────────────────┘  └───────────────────────────┘                │
│                                                                             │
│ ┌───────────────────────────┐  ┌───────────────────────────┐                │
│ │ Learn Connections         │  │ Explore the United States │                │
│ │ Not started              →│  │ Not started              →│                │
│ └───────────────────────────┘  └───────────────────────────┘                │
│                                                                             │
│ Hover/focus detail                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Learn Physical Features                                                 │ │
│ │ Learn the mountains, rivers, lakes, and coasts that shape the U.S.     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ Already know the United States?  [ Show What I Know ]                       │
│ Optional integrated demonstration · Never required for access               │
└─────────────────────────────────────────────────────────────────────────────┘
```

The four objective cards dominate. The numbered path communicates conceptual order only; the explicit **All areas are open** line prevents a lock interpretation. Hover and keyboard focus update one stable detail strip rather than creating overlapping tooltips.

### Mobile — Across the United States home

```text
┌──────────────────────────────────┐
│ ←  Across the United States   ⋯  │
├──────────────────────────────────┤
│ RECOMMENDED NEXT                 │
│ Midwest states & capitals        │
│ Keep building the map you began. │
│ [ Continue ]                     │
├──────────────────────────────────┤
│ All areas are open               │
│                                  │
│ 1  Learn States & Capitals       │
│    Learning                      │
│    Learn where the states are,   │
│    their names, and capitals.  → │
│                                  │
│ 2  Learn Physical Features       │
│    Not started                   │
│    Learn mountains, rivers,      │
│    lakes, and coasts.          → │
│                                  │
│ 3  Learn Connections             │
│    Not started                   │
│    See how places and geographic │
│    features relate.            → │
│                                  │
│ 4  Explore the United States     │
│    Not started                   │
│    Use everything together in    │
│    combined challenges.        → │
├──────────────────────────────────┤
│ Show What I Know                 │
│ Optional regional demonstration →│
│                                  │
│ View Progress Report             │
└──────────────────────────────────┘
```

Mobile uses always-visible subtitles instead of hover or info icons. The areas stack in conceptual order, but every row uses the same enabled treatment.

### Expanded objective — Learn States & Capitals

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Across the United States                 Learn States & Capitals           │
│ Learn where the states are, what they're called, and their capitals.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONTINUE                                                                    │
│ Practice the Midwest                                                        │
│ 7 of 12 current practice targets introduced                  [ Continue ]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Learn                                                                       │
│   Learn state locations & names                                      →      │
│   Learn state capitals                                               →      │
│                                                                             │
│ Build the map                                                               │
│   Build a regional map                                              →      │
│     Midwest · Northeast · Southeast · Southwest · West                       │
│                                                                             │
│ Practice                                                                    │
│   Practice states & capitals                                        →      │
│                                                                             │
│ More                                                                        │
│   Explore the U.S. Atlas · View detailed progress                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

Journey, Memory Trail, capital activities, and regional Reconstruction remain available, but their internal names do not compete at the top level. The learner chooses a purpose: learn, build, or practice.

## Future world scalability

The same shell can be reused for Central America, Europe, South America, and other available regions:

```text
[Region name]

Recommended next

Learn the Map
Understand the Landscape
Connect the Map
Explore [Region]

Show What I Know
View Progress
```

Labels and objective contents may adapt to what is meaningful and supported in each region. A bounded Central America country-location experience, for example, should not pretend to have the same mature physical or integrated content as the United States. Unsupported objectives may use region-appropriate wording or remain absent until meaningful content exists; the template should not create empty categories merely for symmetry.

Every available region remains directly enterable from the world-level navigation. Regional progress and Demonstrated status describe knowledge state, not permission.

## Implementation boundary

### Safe to reorganize now

- Replace the current peer activity list with the four learner-facing objective areas.
- Add one prominent Continue/Recommended next panel using existing recommendation and resume information.
- Group existing activity launches inside objective submenus without changing their destinations.
- Replace internal activity terminology with plain learner-goal labels at the top level.
- Add the documented one-sentence explanations through hover/focus on desktop and visible subtitles on mobile.
- Preserve direct secondary access to the Atlas and Progress Report.
- Present all four areas as available and use non-blocking preparation messages.
- Reuse existing Expedition return handling so activities return to the reorganized context.

### Leave unchanged

- Journey mechanics and progress;
- U.S. Memory Trail scheduling and learner state;
- capital and physical-feature activity behavior;
- U.S. Connections content, scoring, and evidence;
- Mental Map mechanics;
- regional and Lower 48 Reconstruction mechanics;
- canonical evidence and persistence;
- Progress Report calculations and presentation;
- scoped and global reset behavior;
- Atlas behavior;
- current activity difficulty, hints, audio, and geographic rendering.

### Requires later product decisions

- the regional demonstration challenge and qualification thresholds;
- evidence and learner-state representation for Demonstrated status;
- how assisted answers affect regional qualification;
- a new adaptive recommendation algorithm, if existing recommendation behavior is insufficient;
- adaptive placement or stage bypass behavior;
- authoritative definitions for **Learning**, **Showing progress**, and objective-level progress states;
- the integrated Explore journey's new content, transitions, and challenge composition;
- whether the Show What I Know control appears before the pathway can truthfully function;
- any new Progress Report treatment for regional demonstration;
- any more elaborate trail illustration or world-level regional status map.

## Concrete recommendation for the first production version

Build a restrained hybrid home screen: one prominent **Continue learning** panel above four fully accessible objective cards—**Learn States & Capitals**, **Learn Physical Features**, **Learn Connections**, and **Explore the United States**—with a subtle numbered sequence and no locks. Put current activities behind objective submenus using learner-goal labels, retain Atlas and Progress Report as secondary utilities, use one shared hover/focus explanation strip on desktop, and show one-line subtitles directly in each mobile row.

For the first slice, reuse the current Expedition recommendation and return behavior where practical, current activity launches, current learner state, canonical evidence, and Progress Report. Do not add a new recommendation algorithm or reinterpret current activity completion as regional Demonstrated status. Include **Show What I Know** in the target design and reserve its secondary placement, but enable it only when a genuine non-gating regional demonstration pathway can be implemented without misleading the learner.

This model is recommended over both a plain unordered menu and a branching trail. It is simpler than the current activity catalog, communicates a useful progression without restricting freedom, gives prior knowledge a clear future pathway, works naturally as a stacked mobile layout, and can become a reusable regional shell for future world geography without requiring bespoke trail diagrams or cross-region prerequisite chains.
