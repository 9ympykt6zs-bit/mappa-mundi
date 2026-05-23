# MVP Checklist

## Must Fix Before MVP

- [ ] Hide or remove the public developer SVG link in `maplibre-poc.html`.
- [ ] Resolve the Continue Journey placeholder versus actual progress behavior in `src/maplibre-poc.js`.
- [ ] Fix visible text encoding/mojibake in user-facing UI strings.
- [ ] Confirm no Name Target feature remains in public UI or runtime paths.
- [ ] Confirm selected-chip target highlighting/pulsing does not reveal the correct answer.
- [ ] Decide whether repeated-miss reveal behavior is intentional, or revise it.
- [ ] Perform real-device mobile QA.
- [ ] Verify the Journey Mode core loop.
- [ ] Verify Study Preview and Study Practice do not corrupt Journey progress.
- [ ] Verify Free Play starts neutral and does not become MVP-blocking.
- [ ] Verify difficulty behavior in Journey, Free Play, Study Practice, and direct activity launch.
- [ ] Verify reset, retry, and completion behavior.
- [ ] Verify progress save/resume.
- [ ] Confirm ocean zones render consistently enough for MVP.
- [ ] Confirm no public POC/debug/dev labels are visible in the normal user flow.

## Should Fix Before MVP

- [ ] Make Settings honest if target filtering is not fully wired.
- [ ] Simplify or hide "coming soon" text in Free Play country cards.
- [ ] Add minimal validation or smoke scripts.
- [ ] Update stale docs that say `src/app.js` is current.
- [ ] Clarify `maplibre-poc.*` naming in docs so future work does not confuse POC naming with product status.

## Nice After MVP

- [ ] Add rich Free Play facts and media.
- [ ] Add physical features.
- [ ] Add historical geography.
- [ ] Add trophies and badges.
- [ ] Add accounts or cloud sync.
- [ ] Add premium layers.
- [ ] Reach full proof-sheet parity.
- [ ] Rename `maplibre-poc.*` files after stabilization.
