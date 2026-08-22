# Learning Support and Hint Philosophy

## Purpose

Mappa Mundi is intended to help learners build geographic understanding, not merely measure what they can recall without help. Hints and other forms of learning support can provide a bridge between initial exposure and independent retrieval.

Hints exist to:

- support learning while the learner is still forming a mental map;
- provide a useful scaffold for a task that is currently too difficult unaided;
- help a learner recover from uncertainty or repeated difficulty;
- keep a challenging geographic problem approachable without removing its educational purpose.

A hint should help the learner do more of the thinking. It should not simply reveal the answer as quickly as possible. Good support preserves the central challenge while reducing a secondary burden, narrowing an overwhelming search space, or making the relevant spatial structure available.

This document describes long-term product intent. It does not define a final interface, scoring formula, progression rule, evidence schema, or implementation plan.

## Core principle

**A hint is not failure.**

A learner who requests or receives support is still participating in learning. Using an unlabeled map to reason through a route, for example, may demonstrate meaningful knowledge of adjacency even when the learner could not hold the entire national map in working memory.

At the same time, independent and supported performance are not identical evidence. A correct response with no assistance demonstrates stronger retrieval than the same response after the answer space has been narrowed. A walkthrough or answer reveal demonstrates exposure and engagement, but not successful retrieval.

Mappa Mundi should therefore preserve two ideas at once:

- supported work is educationally valuable and should be treated constructively;
- the system should retain the distinction between independent retrieval, assisted performance, and guided exposure.

Support should help a learner move toward independence over time. It should neither disguise assistance as unaided mastery nor frame assistance as a punishment.

## Hint levels

The following hierarchy is a conceptual model for discussing degrees of support. It is not a commitment that every activity will offer all levels or present them with these names.

### Level 0: Independent recall

The learner receives no assistance beyond the ordinary question and response interface.

Example:

> Which states form a route from Arizona to North Carolina?

The learner must recall or construct the relevant spatial relationships independently. A correct answer at this level provides the strongest evidence that the learner can retrieve and use the knowledge without support. It should receive full learning credit under whatever future progress policy applies.

Independent recall does not require an artificially difficult interface. Ordinary instructions, usable controls, accessible presentation, and information inherent to the question are part of the activity—not hints.

### Level 1: Spatial scaffold

The learner receives geographic structure without labels or an answer path.

Example:

> Show an unlabeled map of the United States while the learner constructs the route.

The scaffold may provide:

- the shapes of places;
- visible adjacency;
- relative position;
- broad spatial orientation.

It should not provide:

- state names;
- the correct route;
- highlighted answer states;
- step-by-step choices that effectively solve the problem.

This support reduces the demand of reconstructing the entire base map from memory while preserving the need to identify relationships and choose a valid path. A correct response remains useful evidence, but it represents assisted rather than fully independent performance and should receive less weight than Level 0.

### Level 2: Directed support

The learner receives a clue that meaningfully narrows the problem or directs attention.

Examples could include:

- highlighting the general part of the country to consider;
- giving a conceptual clue such as “look for a path through the Southeast”;
- reducing an excessively large search space;
- identifying which relationship type matters without naming the answer.

Directed support should still leave a meaningful decision for the learner. It may reveal more of the problem's structure than a spatial scaffold, so a successful response provides weaker evidence of independent knowledge.

Care is especially important here. A highlight should orient the learner, not expose the exact target before retrieval. A narrowed choice set should remove noise, not turn the response into an obvious guess.

### Level 3: Guided exposure

The learner receives the answer or is walked through the relevant knowledge.

Examples could include:

- revealing a valid route and explaining why each transition works;
- showing the target state with its name;
- explicitly demonstrating which states border a river or lake;
- switching into a teaching walkthrough.

Guided exposure is valuable when the learner does not yet have the knowledge needed for retrieval. It can establish a correct model, prevent repeated unproductive guessing, and prepare the learner for later practice.

It should be treated as exposure or assisted learning rather than successful retrieval. Completion of a walkthrough may show participation, but it should not be represented as proof that the learner could produce the answer independently.

## Matching support to the learning demand

The most useful hint reduces a barrier without removing the skill the activity is meant to develop. The appropriate support therefore depends on what the question is testing.

For a route question, an unlabeled map can remove the working-memory burden of reconstructing every state shape while preserving adjacency and route reasoning. For a state-identification question, that same map might already contain the answer and therefore would not be a neutral scaffold. For a capital relationship, showing the state's location may add context without revealing its capital. For a locating task, highlighting the target region too precisely could expose the answer.

Before offering a hint, future designs should ask:

1. What knowledge or reasoning is this task intended to measure?
2. Which part of the difficulty is essential to that purpose?
3. Which part can be reduced without giving away the answer?
4. What will a successful response mean after this support is shown?

Hint levels describe the amount of assistance, but the educational effect must be judged relative to the specific task.

## Applicable activities

### U.S. Connections

Relationship questions may benefit from context that helps the learner reason rather than guess.

Potential support could include:

- an unlabeled national map for state-border or directional relationships;
- an unlabeled regional map that preserves the need to identify the reference place;
- physical map context without feature labels;
- a conceptual reminder about the kind of relationship being asked.

Support should not highlight the correct state, river, lake, coast, or mountain range before the learner answers. If a relationship depends on a convention rather than visible geography, a map alone may not be an honest hint; the learner may need explicit teaching instead.

### Mental Map

Mental Map tasks are strong candidates for graduated spatial support because they can place substantial demands on working memory.

For route construction, an unlabeled map could preserve path reasoning while reducing the need to reconstruct the full base map internally. More directed support might identify a broad corridor or remind the learner that each step must share a border. Guided exposure could demonstrate one route and explain alternatives.

The supported version should remain distinguishable from the unaided mental-map task. A learner who reasons correctly with visible geometry has demonstrated something meaningful, but not the same thing as constructing that geometry entirely from memory.

### Reconstruction

Reconstruction support could reduce difficulty in stages without completing the puzzle for the learner.

Possible scaffolds might include:

- an outline or boundary frame;
- fixed anchor pieces;
- broad regional grouping;
- feedback about adjacency rather than exact placement;
- a walkthrough for a difficult section after sustained struggle.

The design should preserve the distinction between independently reconstructing spatial structure and arranging pieces against an increasingly explicit template. Support should also avoid creating a false signal that a guided placement was independently recalled.

### Physical geography

Physical-feature questions may use map context without labels as a scaffold. A learner could see state boundaries and the shape or course of a feature while still needing to identify it or reason about its relationships.

Useful support might include:

- an unlabeled physical map;
- a broader regional view;
- a clue about whether the feature is a river, lake, coast, or mountain system;
- guided exposure that explains how the feature crosses or shapes several places.

Support should not reveal the correct feature through selection highlighting before retrieval. It should also respect that physical relationships are often gradual or overlapping rather than as exact as political boundaries.

### Future Expedition activities

Future Expedition nodes may combine recognition, relationship recall, route reasoning, and synthesis. A shared support philosophy can make these challenges approachable without forcing every activity into the same mechanic.

An Expedition might offer support appropriate to the underlying activity while keeping that activity's distinct purpose. Hints should remain part of the learning experience around the activity, not become a separate gameplay engine or a reason to duplicate existing activities.

## Evidence and progress

Hint use should be represented honestly in learning evidence. The central principle is that the evidence should describe what the learner demonstrated under the conditions in which they demonstrated it.

- **Independent correct answers are the strongest evidence.** They show successful retrieval or reasoning without additional support.
- **Supported correct answers are useful but weaker evidence.** They show partial understanding, successful reasoning with a scaffold, or progress toward independence.
- **Guided exposure should not count as successful retrieval.** It records a learning opportunity and may prepare a future attempt, but the answer was supplied or substantially demonstrated.
- **Incorrect answers remain useful learning signals.** They can reveal uncertainty, a misconception, an overloaded task, or the need for instruction.

The existing canonical evidence distinction between assisted outcomes and independent correct retrieval is compatible with this philosophy. Future hint designs should preserve that distinction rather than creating an unrelated progress history. The activity, support level, prompt conditions, and outcome may all be useful provenance, but this document does not prescribe a final representation.

Hint use should not erase the evidence from an earlier independent attempt. For example, an incorrect unaided response followed by successful guided work describes a productive learning sequence: difficulty, support, and exposure. Collapsing that sequence into either a simple failure or a simple success would lose useful information.

No final scoring formula follows from this document. The appropriate influence of assisted evidence on mastery, recommendations, checkpoints, and learner-facing progress remains a future product decision.

## Learner experience

Hints should feel like:

> I am getting help while learning.

They should not feel like:

> I failed.

Support should use calm, inviting language. Examples might include “Show an unlabeled map,” “Give me a clue,” or “Walk me through it.” Language such as “Give up,” “Use a penalty,” or “You failed—show answer” makes a normal learning tool feel punitive.

The learner should understand what kind of help is available before choosing it. When practical, the interface should also make clear that support changes what the attempt demonstrates, without turning that explanation into a threat about points or progress.

Useful support should:

- be available early enough to prevent unproductive frustration;
- preserve learner agency;
- avoid surprising answer reveals;
- keep the current task comprehensible after the hint appears;
- allow the learner to continue rather than forcing an immediate restart;
- encourage a later independent attempt when that would reinforce learning.

Repeated difficulty may be a signal to move from retrieval to teaching. In that situation, guided exposure is not a lesser consolation prize; it is the appropriate learning experience for the learner's current state.

## Future relationship to Expedition design

Hints support flexible Expedition progression. A learner should be able to approach a challenging node, discover that independent retrieval is not yet reliable, receive appropriate support, and continue building understanding.

This allows an Expedition to recommend ambitious next steps without making every challenge all-or-nothing. A learner might:

- attempt a route independently;
- request an unlabeled map;
- complete the route with that scaffold;
- receive a future opportunity to try a similar route unaided.

That sequence represents progress even though it is not yet independent mastery. The Expedition can acknowledge the work while continuing to recommend experiences that strengthen the unsupported skill.

Support also complements “Show What You Know” and other knowledge checks, but the purposes must remain distinct. A learning activity can encourage hint use freely. A placement or checkpoint decision may need stricter rules about which support is available and what an assisted result can establish. Knowledgeable learners should not be held back unnecessarily, while assisted performance should not be mistaken for independent readiness.

Hints should therefore contribute to a flexible journey without becoming arbitrary gates, hidden penalties, or a second learner-state system.

## Design guardrails

- Do not reveal the target before retrieval when a less explicit scaffold would help.
- Do not treat all hints as equivalent; an unlabeled map and an answer reveal provide very different evidence.
- Do not punish learners for seeking help or use shame-based language.
- Do not report assisted performance as independent mastery.
- Do not assume that a hint useful for one activity is appropriate for another.
- Do not let hints erase earlier attempts or obscure a meaningful learning sequence.
- Do not add support merely to make a confusing or untaught question easier; first ask whether the content itself belongs and has been taught.
- Do not create a separate progress authority for hint use when canonical learning evidence can preserve the distinction.

## Open questions

Future product and learning-design decisions should address:

- How much should each kind of hint reduce progress credit?
- Should learners see when support affected their progress, and how can that be explained without sounding punitive?
- Which hints should be offered automatically after difficulty?
- Which hints should appear only when requested?
- Should learners be able to request support at any time, including before an initial attempt?
- Should a hint remain visible for the rest of a task or be removable?
- When should the system recommend guided exposure instead of another retrieval attempt?
- Should a supported success schedule a later independent retry?
- How should hint usage affect Expedition knowledge checks, placement decisions, and checkpoint completion?
- Which accessibility supports are ordinary access accommodations rather than evidence-reducing hints?
- How should the interface communicate the difference between spatial scaffolding, directed support, and an answer reveal?
- What support patterns transfer across regions and activities without weakening their distinct mechanics?

## Guiding principle

Learning support should preserve dignity, agency, and productive challenge. A hint is successful when it helps the learner understand more of the geography while leaving an honest record of how that understanding was demonstrated.
