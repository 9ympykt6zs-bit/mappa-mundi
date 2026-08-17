import { runExperimentalProgressModel } from "./experimental-progress-score-models.mjs";

export const BAYESIAN_DISPLAY_THRESHOLDS = Object.freeze({
  needsReviewMaximumExclusive: 0.3,
  demonstratedMaximumExclusive: 0.65
});

export const BAYESIAN_DISPLAY_CATEGORIES = Object.freeze({
  unseen: Object.freeze({ id: "unseen", label: "Unseen" }),
  needsReview: Object.freeze({ id: "needs-review", label: "Needs review" }),
  demonstrated: Object.freeze({ id: "demonstrated", label: "Demonstrated" }),
  strongEvidence: Object.freeze({ id: "strong-evidence", label: "Strong evidence" })
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rounded(value) {
  return value === null ? null : Number(value.toFixed(6));
}

function percentage(score) {
  return score === null ? null : Math.round(score * 100);
}

function responseEvents(history) {
  return history.filter((event) => typeof event === "boolean" || typeof event?.correct === "boolean");
}

function normalizedResponse(event) {
  return typeof event === "boolean" ? event : event.correct;
}

export function displayCategoryForScore(score) {
  if (score === null || score === undefined) return clone(BAYESIAN_DISPLAY_CATEGORIES.unseen);
  if (score < BAYESIAN_DISPLAY_THRESHOLDS.needsReviewMaximumExclusive) {
    return clone(BAYESIAN_DISPLAY_CATEGORIES.needsReview);
  }
  if (score < BAYESIAN_DISPLAY_THRESHOLDS.demonstratedMaximumExclusive) {
    return clone(BAYESIAN_DISPLAY_CATEGORIES.demonstrated);
  }
  return clone(BAYESIAN_DISPLAY_CATEGORIES.strongEvidence);
}

export function segmentedBarForScore(score, segmentCount = 10) {
  const safeCount = Math.max(1, Math.floor(Number(segmentCount) || 10));
  const filledCount = score === null || score === undefined
    ? 0
    : Math.max(0, Math.min(safeCount, Math.round(score * safeCount)));
  return {
    segmentCount: safeCount,
    filledCount,
    emptyCount: safeCount - filledCount,
    text: `${"█".repeat(filledCount)}${"░".repeat(safeCount - filledCount)}`,
    percentage: percentage(score),
    isUnseen: score === null || score === undefined
  };
}

function eventExplanation({ event, scoreBefore, scoreAfter, responseCount, previousEvent }) {
  if (event.type === "gap") {
    return `No new response was recorded during the ${event.days}-day absence, so demonstrated-knowledge progress stayed at ${percentage(scoreAfter)}%.`;
  }
  const afterGap = previousEvent?.type === "gap" ? ` after a ${previousEvent.days}-day absence` : "";
  if (event.correct) {
    if (responseCount === 1) {
      return `A first correct response added positive evidence and set demonstrated-knowledge progress to ${percentage(scoreAfter)}%.`;
    }
    return `A correct response${afterGap} added positive evidence, moving progress from ${percentage(scoreBefore)}% to ${percentage(scoreAfter)}%.`;
  }
  if (responseCount === 1) {
    return `The first response was a miss, so the evidence currently points to more practice; progress is ${percentage(scoreAfter)}%.`;
  }
  return `A miss${afterGap} added contradictory evidence, moving progress from ${percentage(scoreBefore)}% to ${percentage(scoreAfter)}%. Earlier successful evidence was kept.`;
}

export function explanationForProgress(history, run) {
  if (run.score === null) return "No retrieval evidence yet. Unseen is intentionally different from a 0% score.";
  const latest = run.trajectory.at(-1);
  const previous = run.trajectory.at(-2)?.event || null;
  return eventExplanation({
    event: latest.event,
    scoreBefore: latest.scoreBefore,
    scoreAfter: latest.scoreAfter,
    responseCount: responseEvents(history).length,
    previousEvent: previous
  });
}

export function createBayesianProgressRecord({ itemId, skillId, label, evidenceHistory }) {
  if (!itemId || !skillId) throw new Error("Prototype progress records require itemId and skillId.");
  if (!Array.isArray(evidenceHistory)) throw new Error("evidenceHistory must be an array.");
  const inputSnapshot = JSON.stringify(evidenceHistory);
  const run = runExperimentalProgressModel("bayesian-evidence", evidenceHistory);
  let responseCount = 0;
  const trajectory = run.trajectory.map((step, index) => {
    if (step.event.type === "response") responseCount += 1;
    return {
      event: clone(step.event),
      scoreBefore: step.scoreBefore,
      scoreAfter: step.scoreAfter,
      displayCategoryAfter: displayCategoryForScore(step.scoreAfter),
      explanation: eventExplanation({
        event: step.event,
        scoreBefore: step.scoreBefore,
        scoreAfter: step.scoreAfter,
        responseCount,
        previousEvent: run.trajectory[index - 1]?.event || null
      })
    };
  });
  if (JSON.stringify(evidenceHistory) !== inputSnapshot) throw new Error("Prototype progress rendering mutated evidence history.");
  return {
    itemId,
    skillId,
    label: label || itemId,
    evidenceHistory: clone(evidenceHistory),
    bayesianProgressScore: run.score,
    displayCategory: displayCategoryForScore(run.score),
    explanation: explanationForProgress(evidenceHistory, run),
    display: segmentedBarForScore(run.score),
    evidenceSummary: {
      responseCount: responseEvents(evidenceHistory).length,
      correctCount: responseEvents(evidenceHistory).filter((event) => normalizedResponse(event)).length,
      missCount: responseEvents(evidenceHistory).filter((event) => !normalizedResponse(event)).length,
      gapCount: evidenceHistory.filter((event) => event?.type === "gap").length
    },
    trajectory
  };
}

export function createProgressGroup({ groupId, label, records }) {
  if (!groupId || !Array.isArray(records) || records.length === 0) {
    throw new Error("Prototype groups require groupId and at least one record.");
  }
  const inputSnapshot = JSON.stringify(records);
  const attempted = records.filter((record) => record.bayesianProgressScore !== null);
  const unseenCount = records.length - attempted.length;
  const aggregateScore = attempted.length === 0
    ? null
    : rounded(records.reduce((sum, record) => sum + (record.bayesianProgressScore || 0), 0) / records.length);
  const categories = Object.fromEntries(Object.values(BAYESIAN_DISPLAY_CATEGORIES).map((category) => [category.id, 0]));
  for (const record of records) categories[record.displayCategory.id] += 1;
  const group = {
    groupId,
    label,
    itemCount: records.length,
    attemptedCount: attempted.length,
    unseenCount,
    bayesianProgressScore: aggregateScore,
    displayCategory: displayCategoryForScore(aggregateScore),
    display: segmentedBarForScore(aggregateScore),
    categoryCounts: categories,
    explanation: attempted.length === 0
      ? `None of the ${records.length} skills has retrieval evidence yet.`
      : `${attempted.length} of ${records.length} skills have retrieval evidence. The group bar averages every skill, with unseen skills shown as empty rather than silently omitted.`,
    records: clone(records)
  };
  if (JSON.stringify(records) !== inputSnapshot) throw new Error("Prototype group rendering mutated its progress records.");
  return group;
}

export function renderDisplayOption(optionId, subject) {
  const lines = [];
  if (optionId === "simple-segmented-bar") {
    lines.push(subject.label, subject.display.text);
  } else if (optionId === "label-and-bar") {
    lines.push(subject.label, subject.displayCategory.label, subject.display.text);
  } else if (optionId === "skill-breakdown") {
    lines.push(subject.label, "");
    for (const record of subject.records || []) {
      lines.push(record.label, record.displayCategory.label, record.display.text, "");
    }
    if (lines.at(-1) === "") lines.pop();
  } else {
    throw new Error(`Unknown prototype display option: ${optionId}`);
  }
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function barHtml(display, categoryId) {
  const segments = Array.from({ length: display.segmentCount }, (_, index) => (
    `<span class="segment${index < display.filledCount ? " filled" : ""}"></span>`
  )).join("");
  const value = display.isUnseen ? "No evidence" : `${display.percentage}%`;
  return `<div class="bar ${escapeHtml(categoryId)}" role="img" aria-label="${escapeHtml(value)} demonstrated-knowledge progress">${segments}</div>`;
}

function recordCardHtml(record) {
  return `<article class="record-card">
    <div class="record-heading"><strong>${escapeHtml(record.label)}</strong><span class="category ${escapeHtml(record.displayCategory.id)}">${escapeHtml(record.displayCategory.label)}</span></div>
    ${barHtml(record.display, record.displayCategory.id)}
    <p>${escapeHtml(record.explanation)}</p>
  </article>`;
}

export function renderDeveloperPrototypeHtml(prototype) {
  const scenarios = prototype.testHistories.map((scenario) => recordCardHtml(scenario.record)).join("\n");
  const ohioSkills = prototype.ohioSkillBreakdown.records.map(recordCardHtml).join("\n");
  const stateCells = prototype.perfectStateLocationPass.records.map((record) => (
    `<div class="state-cell"><span>${escapeHtml(record.label)}</span>${barHtml(record.display, record.displayCategory.id)}</div>`
  )).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bayesian Progress Prototype — Developer Only</title>
<style>
:root{color-scheme:light;--ink:#18324a;--muted:#627484;--paper:#f6f2e8;--card:#fffdf7;--line:#d9d1c2;--navy:#18324a;--gold:#d69b2d;--teal:#2f8178;--coral:#b85d4d}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;line-height:1.45}main{max-width:1120px;margin:auto;padding:48px 24px 80px}header{border-bottom:1px solid var(--line);padding-bottom:28px;margin-bottom:36px}h1{font-family:Georgia,serif;font-size:clamp(2rem,5vw,4rem);line-height:1;margin:.2rem 0 1rem}.eyebrow{letter-spacing:.12em;text-transform:uppercase;font-size:.75rem;font-weight:800;color:var(--coral)}.warning{max-width:760px;color:var(--muted)}h2{font-family:Georgia,serif;margin-top:56px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));gap:16px}.record-card,.panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 5px 20px #18324a0c}.record-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.category{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;font-weight:800}.category.needs-review{color:var(--coral)}.category.strong-evidence{color:var(--teal)}.category.demonstrated{color:#916719}.category.unseen{color:var(--muted)}.bar{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:14px 0}.segment{height:14px;border-radius:3px;background:#e4ded2}.filled{background:var(--gold)}.strong-evidence .filled{background:var(--teal)}.needs-review .filled{background:var(--coral)}.unseen .segment{background:transparent;border:1px dashed #c9c1b3}.record-card p{font-size:.87rem;color:var(--muted);margin:12px 0 0}.state-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.state-cell{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.8rem}.state-cell .bar{gap:2px;margin:7px 0 0}.state-cell .segment{height:7px}.summary{display:flex;gap:24px;flex-wrap:wrap}.metric strong{display:block;font-family:Georgia,serif;font-size:2rem}.metric span{font-size:.8rem;color:var(--muted)}code{background:#eee8dc;padding:.15em .35em;border-radius:4px}@media(max-width:560px){main{padding:28px 16px 60px}}
</style>
</head>
<body><main>
<header><div class="eyebrow">Developer-only · non-production</div><h1>Demonstrated knowledge</h1><p class="warning">UX/model validation artifact using provisional Beta(1,2) evidence. It is not mastery, does not decay during absence, does not schedule review, and is not connected to learner state or normal navigation.</p></header>
<section><h2>Ohio skill breakdown</h2><div class="grid">${ohioSkills}</div></section>
<section><h2>Canonical histories</h2><div class="grid">${scenarios}</div></section>
<section><h2>Perfect first U.S. state-location pass</h2><div class="panel"><div class="summary"><div class="metric"><strong>${prototype.perfectStateLocationPass.display.percentage}%</strong><span>group progress</span></div><div class="metric"><strong>${prototype.perfectStateLocationPass.attemptedCount}/50</strong><span>states demonstrated</span></div><div class="metric"><strong>${escapeHtml(prototype.perfectStateLocationPass.displayCategory.label)}</strong><span>provisional label</span></div></div></div><div class="state-grid">${stateCells}</div></section>
</main></body></html>`;
}
