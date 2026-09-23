# Globe-First Geographic Navigation Model

## Purpose and status

This document defines the long-term geographic navigation model for Mappa Mundi. It describes how learners move from the world to a continent, country, region, or other meaningful geographic scope before choosing a learning experience.

Phase 1 is implemented. Start Playing opens the globe by default, and the globe owns a compact learning menu for Continue Learning, Explore / Atlas, Connections, Map Reconstruction, and Progress. The former main menu remains available only through the temporary `?globeNavigation=off` rollback query. Later Atlas integration, Connections consolidation, and legacy-code removal remain future work.

The central product principle is:

> **Navigate geographically first, then choose what to learn.**

The interactive globe should become part of Mappa Mundi's information architecture rather than serving only as decoration around a menu.

## Decided principles

The following principles should guide future design and implementation work.

### The globe is the primary geographic navigation surface

After the learner chooses **Start Playing**, the next experience should center on the question:

> **Where do you want to learn?**

The globe should be the dominant visual and interactive element. Moving through the product should help the learner understand where places sit within the world, even before formal instruction begins.

### Globe-first does not mean globe-only

The globe should be the primary navigation method, but it must not be the only semantic or usable route into geography. Some learners may not know where a place is, may have difficulty selecting a small target, may use a keyboard or assistive technology, or may simply want to jump directly to a known place.

An equivalent lightweight fallback should therefore remain available, such as:

- **Find a place**;
- search;
- a geographic list or index.

The fallback should support the globe rather than visually replacing it with another large menu.

### Geographic access remains open

Any available region should be directly reachable regardless of progress elsewhere. A learner interested in Europe should be able to navigate from the world to Europe without first studying or demonstrating knowledge of the United States.

Regional progress and future Demonstrated status describe knowledge; they do not grant permission. Regional demonstration remains optional and non-gating.

### Geographic selection and learning selection are separate layers

The globe answers:

> **Where in the world do you want to learn?**

A region-specific learning interface then answers:

> **What do you want to learn about this place?**

This separation prevents geographic navigation from becoming an activity catalog and prevents region-specific learning screens from becoming a substitute world index.

### The hierarchy is content-driven

Mappa Mundi should not force the entire world into one fixed tree such as:

> world → continent → country → state

Meaningful learning scopes may include:

- continents;
- countries;
- cultural or geographic regions;
- states, provinces, and territories;
- physical regions;
- other supported geographic scopes.

Each scope should define which child areas are meaningful, selectable, and supported by current content. The model should allow different branches of the world to have different depths and subdivision types.

## Core navigation model

At every geographic scope, the interface should distinguish two actions.

### Learn this area

Begin the structured learning experience associated with the current scope.

Examples include:

- **Learn the Continents** at the world level;
- **Learn Europe** at the Europe level;
- **Learn the United States** at the United States level.

This action enters the learning navigation or experience designed for that scope. It should not be confused with moving deeper into the geographic hierarchy.

### Go deeper

Select a meaningful child area on the globe or map to navigate into it.

Examples include:

- world → Europe;
- Europe → France;
- North America → United States;
- United States → a state or supported subregion, where deeper navigation is educationally meaningful and content exists.

The visual design should make the distinction between **learn here** and **navigate deeper** clear without surrounding the globe with activity buttons.

## Example navigation flow

### World level

The learner sees the heading **Where do you want to learn?** and an interactive world globe.

The current-level learning action is **Learn the Continents**. Selecting a continent instead navigates deeper. For example:

> Select Europe → the globe moves to a Europe-focused view.

### Continent level

The current scope is clearly identified as **Europe**. The interface offers **Learn Europe**, while countries or other appropriate child scopes remain selectable.

For example:

> Select France → the map or globe moves to France.

### Country or regional level

The current scope is identified by name and presents the learning experiences available for that place. If deeper geographic subdivisions are meaningful and supported, the learner may continue navigating geographically.

A country without deeper learner-facing content should not invent subdivisions merely to preserve a uniform hierarchy.

## Learn-this-area presentation

The current-scope action should be simple and learner-facing. A Europe view might present:

> **Europe**
>
> **Learn Europe**
>
> Choose a country to explore further.

A United States view presents:

> **United States**
>
> **Learn the United States**
>
> Choose a supported place or learning area to explore further.

The map should remain visually dominant. The interface should not place separate buttons for every underlying activity around it.

Once the learner selects **Learn the United States**, the geographic navigation layer enters the existing evidence-driven Guided Learning continuation directly. The old Across the United States objective screen is retained for rollback compatibility but is not part of the globe-first path.

The globe menu provides specialty destinations without duplicating their engines. Explore / Atlas opens the current U.S. Atlas, Connections selects the World or U.S. question pool from the active scope, Map Reconstruction opens the existing U.S. region selector, and Progress opens the existing U.S. report.

The intended Phase 1 relationship is:

> World globe → United States → Learn the United States → Guided Learning continuation

Browser history stores only the visible globe scope or specialty destination and its return scope. Learning progress remains in the established Journey, Guided, evidence, and activity stores. Reload retains the title-screen gate; after Start Playing, a valid saved navigation destination is restored and an invalid one falls back to the World globe.

## Proposed interaction patterns

The patterns in this section are promising directions, not final interaction commitments.

### Navigation and zoom

Geographic selection should use short map or globe transitions that reinforce hierarchy. Moving from the world to Europe or from North America to the United States should make the selected area's location and scale understandable.

Transitions should be:

- quick and functional;
- long enough to preserve geographic orientation;
- short enough that repeated navigation does not become tedious;
- reduced or removed when the learner requests reduced motion.

Obvious upward navigation should always be available through controls such as:

- **Back**;
- **World**;
- a breadcrumb such as **World › Europe › France**.

The learner should not need to replay long cinematic animations merely to move between nearby scopes.

### Desktop and pointer input

A possible pointer pattern is:

1. Hover or focus a selectable area.
2. Highlight it and show its name.
3. Click to navigate into that scope.

The current scope should remain visually unambiguous. Labels and controls should be restrained so the globe does not become covered by competing interface elements. Keyboard focus should communicate the same selection information as pointer hover.

### Mobile and touch input

Touch interaction cannot depend on hover. A possible pattern is:

1. Tap a place to select and identify it.
2. Show a concise action for entering that place.
3. Tap the action or confirm the selection to navigate.

A simpler one-tap pattern may be appropriate where targets are large and unambiguous. The final choice should balance speed against accidental navigation. In either case, the learner must not depend on selecting tiny visible polygons precisely.

### Small and dense geographic targets

Small countries, islands, and dense regions create a fundamental usability problem. Europe, Central America, the Caribbean, and Pacific islands are likely stress cases.

Potential approaches include:

- larger invisible hit targets;
- hover, focus, or tap highlighting;
- zoom-dependent selectable areas;
- automatic zoom when a dense region is selected;
- the search or geographic-list fallback.

These are design options to evaluate. This document does not prescribe a final technical solution.

## Content availability states

The globe will eventually display places whose learning content has different levels of maturity. Navigation must not imply that every visible area has a complete learning path.

### Learning content available

The learner can enter a structured learning experience for the current scope. The **Learn this area** action is active and accurately describes what exists.

### Exploration or reference only

The place may be browsed geographically even though it does not yet have a full learning path. The interface should describe this honestly as exploration or reference rather than learning completion.

### Not yet available

The area is geographically visible but has no meaningful destination yet. The interface should communicate this clearly and avoid a dead-end transition or a control that pretends content exists.

These states should be presented without making unfinished areas feel like progress locks. The limitation belongs to content availability, not to the learner's performance.

## Progress and demonstrated knowledge

The geographic navigation surface may eventually communicate states such as:

- Not started;
- Learning;
- Demonstrated;
- Recommended.

The first version should not overload the globe with progress badges, mastery colors, or dashboard information. Geographic navigation clarity comes first. Progress treatments can be layered in only after the navigation interaction has been validated and their meanings have been defined consistently.

If Demonstrated status eventually appears on the globe, it must come from the optional high-bar regional demonstration model. It must not be inferred from time spent, ordinary activity completion, or internal scheduler mastery.

## Accessibility requirements

The rendered globe or map must not be the only semantic interface. Equivalent access to every available region should not require vision, precise pointer control, or animation.

Future designs need to provide:

- keyboard navigation through meaningful geographic choices;
- visible and persistent focus states;
- screen-reader-accessible scope names, hierarchy, availability, and actions;
- reduced-motion transitions;
- search or list navigation equivalent to the globe's available destinations;
- comfortably selectable touch targets;
- a way to move up the hierarchy without relying on a map gesture.

The fallback should expose the same content-driven hierarchy and availability states as the globe. It should not become a second, contradictory navigation model.

## Visual restraint

The globe should remain the dominant visual element. The surrounding interface should answer only a few immediate questions:

- Where am I?
- What can I learn at this level?
- Where can I go deeper?
- How do I find a place I cannot locate visually?
- How do I go back up?

Avoid recreating menu clutter through floating activity controls, extensive progress badges, persistent labels for every visible place, or multiple competing calls to action.

## Wireframes

These wireframes describe information hierarchy, not final visual styling.

### World level

```text
┌──────────────────────────────────────────────┐
│ Mappa Mundi                                  │
│                                              │
│ Where do you want to learn?                  │
│                                              │
│             ┌──────────────────┐             │
│             │                  │             │
│             │ Interactive      │             │
│             │ world globe      │             │
│             │                  │             │
│             └──────────────────┘             │
│                                              │
│              [ Learn the Continents ]        │
│                   Find a place               │
│                                              │
│ Select a continent to explore further.       │
└──────────────────────────────────────────────┘
```

### Continent level — Europe

```text
┌──────────────────────────────────────────────┐
│ World › Europe                              │
│                                              │
│ Europe                                       │
│                                              │
│             ┌──────────────────┐             │
│             │ Globe/map        │             │
│             │ focused on       │             │
│             │ Europe           │             │
│             └──────────────────┘             │
│                                              │
│                 [ Learn Europe ]             │
│                    Find a place              │
│                                              │
│ Choose a country to explore further.         │
│                                      [World] │
└──────────────────────────────────────────────┘
```

### Country level — United States

```text
┌──────────────────────────────────────────────┐
│ World › North America › United States       │
│                                              │
│ United States                                │
│                                              │
│             ┌──────────────────┐             │
│             │ Map focused on   │             │
│             │ the United       │             │
│             │ States           │             │
│             └──────────────────┘             │
│                                              │
│          [ Learn the United States ]         │
│                   Find a place               │
│                                              │
│ Choose a supported state or region to        │
│ explore further, where appropriate.          │
└──────────────────────────────────────────────┘

Selecting Learn the United States leads to:

  Learn States & Capitals
  Learn Physical Features
  Learn Connections
  Explore the United States
```

### Mobile

```text
┌──────────────────────────────┐
│ ‹ World              Find    │
│                              │
│ Europe                       │
│                              │
│      ┌────────────────┐      │
│      │ Focused globe  │      │
│      │ or map         │      │
│      └────────────────┘      │
│                              │
│ [ Learn Europe ]             │
│                              │
│ Tap a country to identify it │
│ and choose whether to enter. │
│                              │
│ Selected: France             │
│ [ Explore France ]           │
└──────────────────────────────┘
```

On mobile, the selected-place action appears in a stable area rather than as a hover tooltip or a tiny control attached to the map geometry.

## Minimal first prototype

The recommended first prototype should prove the geographic navigation interaction without rebuilding the whole application. A bounded prototype could include:

- the existing landing-page **Start Playing** action;
- a world globe headed **Where do you want to learn?**;
- selectable continents;
- a current-level **Learn the Continents** action;
- one or two continent drill-down paths;
- Europe → a small supported set of countries;
- North America → United States;
- United States → the existing Across the United States objective screen;
- clear Back, World, or breadcrumb navigation;
- a **Find a place** fallback exposing the same supported destinations.

Existing globe, map, hierarchy, and region-learning systems should be reused where practical. The prototype should test selection, orientation, hierarchy, fallback access, and handoff into an existing regional experience. It should not attempt complete global content coverage, final progress visualization, or a new learning engine.

## Risks and design constraints

These constraints need deliberate design and testing. They are not reasons to abandon the globe-first model.

| Constraint | Design implication |
| --- | --- |
| Discoverability | Learners must understand that geographic areas are selectable and that a current-level learning action also exists. |
| Ambiguous hierarchy | Child scopes must be content-driven and clearly named; the product cannot assume one universal subdivision tree. |
| Small selectable targets | Dense regions and islands require forgiving targets, staged zoom, or an equivalent fallback. |
| Excessive zoom animation | Transitions must reinforce location without slowing repeated navigation or disregarding reduced-motion preferences. |
| Learn this area versus Go deeper | Visual hierarchy and wording must keep learning the current scope distinct from navigating to a child scope. |
| Incomplete content | Visible geography must not imply that every place has a complete learning experience. |
| Accessibility | Every available destination needs semantic, keyboard, assistive-technology, and low-precision alternatives. |
| Progress overload | The globe should not become a dashboard of badges, colors, recommendations, and mastery claims before navigation is proven. |

## Unresolved questions

- What exact interaction should confirm a geographic selection on touch devices?
- When should a selection navigate immediately, and when should it first expose a place action?
- Which labels should remain visible at each zoom level?
- How should overlapping or non-nested geographic scopes be represented in search and breadcrumbs?
- How should cultural or physical regions coexist with political geography in the same hierarchy?
- What is the most honest and useful presentation for exploration-only and unavailable areas?
- How much motion best preserves orientation without slowing navigation?
- Which destinations and child scopes are sufficient to validate the first prototype?
- When, if ever, should progress or Demonstrated status appear on the globe?

## Relationship to existing design documents

This model defines the geographic selection layer and should be read alongside:

- [Across the United States Navigation Design](across-united-states-navigation-design.md), which defines the learner-facing objective hierarchy after the United States has been selected;
- [Across the United States Progression Redesign](across-united-states-progression-redesign.md), which establishes guided freedom and conceptual learning progression within the United States;
- [Regional Demonstration Model](regional-demonstration-model.md), which defines optional, non-gating recognition of prior knowledge;
- [Expedition Learning Model](expedition-learning-model.md), which explains how large geographic domains can organize distinct activities into coherent learner journeys;
- [Geographic Visualization Principles](geographic-visualization-principles.md), whose consistency rule should govern the geographic objects and visual vocabulary reused across navigation and learning contexts.

Together, these documents describe a layered experience:

> **Choose a place geographically → choose a learning objective → learn, practice, reason, or demonstrate within that place.**
