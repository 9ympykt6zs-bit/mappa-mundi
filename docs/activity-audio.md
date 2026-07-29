# Mental Map and Map Reconstruction audio

`src/atlas/activity-audio-registry.js` is the canonical registry for learner-facing
Mental Map and Map Reconstruction speech. It records the activity, phrase key,
rendered and spoken text, local asset path, variant class, and intentional fallback
reason.

## Commands

- `npm run audio:mental-map:list`
- `npm run audio:mental-map:generate`
- `npm run audio:map-reconstruction:list`
- `npm run audio:map-reconstruction:generate`
- `npm run audio:activities:list`
- `npm run audio:activities:generate`
- `npm run audio:activities:fallbacks`
- `npm run check:mental-map-audio`
- `npm run check:map-reconstruction-audio`
- `npm run check:activity-audio`

Generation reads `OPENAI_API_KEY` from the development process only. The key is
not written to disk or used by browser code. Existing valid MP3 files are skipped
unless `--force` is supplied. Activity generation defaults to three concurrent
requests, retries transient failures, and atomically renames completed files.

## Playback and offline behavior

Playback uses an exact local recording first, browser speech for an explicitly
classified dynamic fallback or failed local file, and accessible visible text when
speech is unavailable. Starting new activity speech stops local and browser speech.
Leaving an activity also stops stale playback.

This static project does not register a service worker. Audio files deploy with the
rest of `assets/`, and normal browser HTTP caching makes a fetched recording
available to the browser cache. There is no stale service-worker cache to clear.
The app and audio-manifest query versions are bumped when registry behavior changes.

## Manual testing

1. Open Mental Map Challenge and play the question for each fixed question type.
2. Test select-count, recall-all, ordering, and route questions.
3. Submit correct, partial, and incorrect answers and play each result and explanation.
4. Confirm generated route questions use the documented browser fallback.
5. Open several regional reconstruction activities and play each title and instruction.
6. Place, return, select, multi-select, connected-select, and group-move states.
7. Confirm each action announcement stops the preceding announcement.
8. Submit correct and incorrect regional maps and play count, feedback, and correction audio.
9. Test Show correct placement, Back to my map, Replay correction, and Try again.
10. Open Rebuild the Lower 48 and test title, instruction, drawer, camera, selection, and result audio.
11. Test priority feedback, state details, success, correction, and restored-map announcements.
12. In browser developer tools, disable the network after representative recordings have loaded.
13. Repeat representative Mental Map and reconstruction playback and confirm cached MP3s play.
14. Block one MP3 request and confirm browser speech fallback plays once without overlap.
