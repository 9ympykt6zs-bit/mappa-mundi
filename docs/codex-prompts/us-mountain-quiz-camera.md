# U.S. Mountain Ranges quiz camera fix

Fix U.S. Mountain Ranges camera behavior.

## Problem

During mountain-range quiz/recall, the app sometimes asks about a highlighted range that is not visible on screen. The user should never need to pan or zoom to find a quiz target.

## Rule

Learn mode may fly around.

Quiz/recall mode should use fixed section-level cameras.

Once quiz starts for a section, the camera should fly once to that section's quiz view and then stay fixed for that section.

## Required Western Lower 48 quiz camera

Use this exact camera for Western Lower 48 quiz/recall:

- zoom: 4.4214
- center/lng: -117.70600
- center/lat: 42.40667
- bearing: 0
- pitch: 0

## Choose similar fixed quiz cameras for

- Eastern Mountains
- Central Mountains
- Alaska Mountains

Each section camera must show all targets in that section without requiring user panning or zooming.

Alaska must use its own Alaska-focused camera. Do not force one all-U.S. camera.

## Sections

Western Lower 48:
- Rocky Mountains
- Cascade Mountains
- Sierra Nevada
- Coast Ranges
- Olympic Mountains
- Wasatch Range
- Teton Range

Eastern Mountains:
- Appalachian Mountains
- White Mountains
- Green Mountains
- Adirondack Mountains
- Allegheny Mountains
- Blue Ridge Mountains
- Great Smoky Mountains
- Cumberland Mountains

Central Mountains:
- Ozark Mountains
- Ouachita Mountains
- Black Hills

Alaska Mountains:
- Alaska Range
- Brooks Range

## Implementation requirements

- U.S. Mountain Ranges remains one journey with one Memory Trail.
- Internal sections should control progression.
- Learn camera behavior and quiz camera behavior should be separate.
- Add clear section quiz camera metadata if needed, such as `quizView`, `recallView`, or `sectionQuizView`.
- During quiz/recall, do not chase every target with target-specific camera movement.
- Use target-specific camera movement only during Learn or as an emergency fallback.
- If a quiz target would be offscreen, fix the section quiz camera.

## Do not change

- mountain geometry
- hit detection
- invisible hit region behavior
- mountain labels
- audio
- Daily Trail
- World Core
- C&O
- lakes/water bodies
- countries/states/capitals

## Acceptance tests

1. Start U.S. Mountain Ranges Memory Trail.
2. Learn mode may fly to targets.
3. Western Lower 48 quiz uses the exact camera above.
4. Western Lower 48 quiz camera stays fixed while asking all western targets.
5. Eastern Mountains gets a fixed quiz camera showing all eastern targets.
6. Central Mountains gets a fixed quiz camera showing all central targets.
7. Alaska Mountains gets an Alaska-focused fixed quiz camera.
8. No mountain quiz prompt asks about an offscreen target.
9. Active mountain highlight remains obvious.
10. Hit regions remain invisible and playable.
11. No unrelated activities change.

## Final response

Include:
- files changed
- where section quiz camera metadata lives
- confirmation Western Lower 48 uses the specified camera
- chosen camera values for Eastern, Central, and Alaska
- how Learn differs from quiz/recall camera behavior
- checks run
- remaining risks
