# U.S. Progress Report v1

The U.S. Progress Report is a production, read-only view of demonstrated knowledge. It answers “What has this learner demonstrated they can currently do?” It does not replace scheduler mastery, alter review priority, or select questions.

## User flow

Open **Main Menu → U.S. Progress Report**. The overview lists State Locations, State Identification, and State Capitals. Skill categories expand into individual items; individual items expand into demonstrated-progress evidence and a separate scheduler review-status panel.

Optional State Recognition or Geographic Relationships categories appear only when skill-specific evidence exists.

## Evidence sources

The report reads existing state without writing it:

- U.S. Memory Trail item-level correct and miss counts;
- Daily Trail correct and miss counts matched to canonical U.S. targets;
- skill-specific place signals when those signals are available;
- existing scheduler status, memory state, and due fields for the separate Review status panel.

Skill-specific place signals take priority for their corresponding progress score. Otherwise, saved state-practice counters are used for both State Locations and State Identification. The UI discloses that fallback because the current planner state combines location and identification prompt results.

The Bayesian calculation is isolated in `src/bayesian-progress-score.js`. UI rendering never duplicates the formula and never passes the score into a planner.

## Honest limitations

- Existing U.S. planner persistence stores aggregate correct and miss counts, not a durable chronological attempt log.
- The report therefore labels evidence history as aggregate-only. It shows the latest result only when an existing source records or supports it and otherwise says recent attempts are unavailable.
- Unseen records use a null score and dashed empty segments; they are not represented as scored zero.
- Category bars include the whole possible category so breadth remains visible. A category with demonstrated items plus many unseen items is labeled Early evidence rather than Needs review.
- Demonstrated, Strong evidence, and Needs review are reporting labels, not mastery states.
- Review status is a separate projection of scheduler fields and never changes the Bayesian score.
