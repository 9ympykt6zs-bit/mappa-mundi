import { getStateById } from "./united-states-atlas-queries.js";
import { getMentalMapScoreLabel } from "./mental-map-challenge-engine.js";
import { MENTAL_MAP_ANSWER_MODES } from "./mental-map-challenges.js";

function stateName(stateId) {
  return getStateById(stateId)?.name || "Unknown state";
}

function stateNames(stateIds = [], separator = ", ") {
  return stateIds.length ? stateIds.map(stateName).join(separator) : "None";
}

function createButton(label, className, callback, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = Boolean(options.disabled);
  if (options.ariaLabel) button.setAttribute("aria-label", options.ariaLabel);
  button.addEventListener("click", callback);
  return button;
}

function createQuestionHeader(challenge) {
  const header = document.createElement("header");
  header.className = "mental-map-question-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "mental-map-eyebrow";
  eyebrow.textContent = challenge.title;
  const heading = document.createElement("h2");
  heading.textContent = challenge.prompt;
  header.append(eyebrow, heading);
  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT) {
    const count = document.createElement("p");
    count.className = "mental-map-request-count";
    count.textContent = `Choose exactly ${challenge.requiredSelectionCount}.`;
    header.appendChild(count);
  }
  return header;
}

function createSelectedAnswers(challenge, state, options) {
  const section = document.createElement("section");
  section.className = "mental-map-selected";
  const heading = document.createElement("h3");
  heading.textContent = challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE
    ? "Your sequence"
    : "Your choices";
  section.appendChild(heading);

  if (!state.selectedStateIds.length) {
    const empty = document.createElement("p");
    empty.className = "mental-map-empty";
    empty.textContent = "No states selected yet.";
    section.appendChild(empty);
    return section;
  }

  const list = document.createElement(challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE ? "ol" : "ul");
  list.className = "mental-map-selected-list";
  state.selectedStateIds.forEach((stateId, index) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = stateName(stateId);
    const actions = document.createElement("span");
    actions.className = "mental-map-selected-actions";
    if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) {
      actions.append(
        createButton("Up", "mental-map-mini-action", () => options.onMove?.(stateId, "up"), {
          disabled: index === 0,
          ariaLabel: `Move ${stateName(stateId)} earlier`
        }),
        createButton("Down", "mental-map-mini-action", () => options.onMove?.(stateId, "down"), {
          disabled: index === state.selectedStateIds.length - 1,
          ariaLabel: `Move ${stateName(stateId)} later`
        })
      );
    }
    actions.append(createButton("Remove", "mental-map-mini-action", () => options.onRemove?.(stateId), {
      ariaLabel: `Remove ${stateName(stateId)}`
    }));
    item.append(label, actions);
    list.appendChild(item);
  });
  section.appendChild(list);
  return section;
}

function createAnswerBank(state, options) {
  const section = document.createElement("section");
  section.className = "mental-map-answer-bank-section";
  const heading = document.createElement("h3");
  heading.textContent = "Answer bank";
  const bank = document.createElement("div");
  bank.className = "mental-map-answer-bank";
  state.answerBank.forEach((answer) => {
    const isSelected = state.selectedStateIds.includes(answer.id);
    const selectionLimitReached = Number.isInteger(state.maxSelections)
      && state.selectedStateIds.length >= state.maxSelections;
    bank.appendChild(createButton(answer.name, "mental-map-answer-choice", () => options.onSelect?.(answer.id), {
      disabled: isSelected || selectionLimitReached,
      ariaLabel: isSelected
        ? `${answer.name}, selected`
        : selectionLimitReached
          ? `${answer.name}, selection limit reached`
          : `Select ${answer.name}`
    }));
  });
  section.append(heading, bank);
  return section;
}

function createPreSubmitControls(challenge, state, options) {
  const controls = document.createElement("div");
  controls.className = "mental-map-controls";
  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) {
    controls.appendChild(createButton("Undo", "mental-map-secondary-action", options.onUndo, {
      disabled: !state.selectedStateIds.length
    }));
  }
  controls.append(
    createButton("Clear", "mental-map-secondary-action", options.onClear, {
      disabled: !state.selectedStateIds.length
    }),
    createButton("Submit", "mental-map-primary-action", options.onSubmit),
    createButton("New Question", "mental-map-secondary-action", options.onNewQuestion)
  );
  return controls;
}

function createResultLine(label, stateIds, className = "") {
  const row = document.createElement("p");
  row.className = `mental-map-result-line ${className}`.trim();
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  row.append(strong, document.createTextNode(stateNames(stateIds)));
  return row;
}

function createResultLegend() {
  const list = document.createElement("ul");
  list.className = "mental-map-result-legend";
  [
    ["selected-correct", "Selected and correct"],
    ["correct", "Correct answer"],
    ["missing", "Missing"],
    ["misplaced", "Misplaced"],
    ["incorrect", "Incorrect or unnecessary"],
    ["question-feature", "Question feature"]
  ].forEach(([kind, label]) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = `mental-map-result-${kind}`;
    item.append(swatch, document.createTextNode(label));
    list.appendChild(item);
  });
  return list;
}

function createResultContent(challenge, state, options) {
  const evaluation = state.evaluation;
  const wrapper = document.createElement("div");
  wrapper.className = "mental-map-result-content";
  const status = document.createElement("p");
  status.className = `mental-map-result-status ${evaluation.isCorrect ? "is-correct" : "is-incorrect"}`;
  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE) {
    status.textContent = evaluation.isCorrect ? "Correct" : "Not quite";
  } else {
    const scoreRatio = evaluation.maxScore > 0 ? evaluation.score / evaluation.maxScore : 0;
    const encouragement = evaluation.isCorrect
      ? "Excellent"
      : scoreRatio >= (2 / 3)
        ? "Good work"
        : scoreRatio >= 0.34
          ? "Keep going"
          : "Good start";
    status.textContent = `${getMentalMapScoreLabel(evaluation)} - ${encouragement}`;
  }
  wrapper.appendChild(status);
  wrapper.appendChild(createResultLine("Your answer", evaluation.selectedStateIds,
    challenge.answerMode === MENTAL_MAP_ANSWER_MODES.ORDERED_SEQUENCE ? "is-sequence" : ""));

  if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_COUNT) {
    wrapper.append(
      createResultLine("Selected valid states", evaluation.selectedValidStateIds),
      createResultLine("Selected invalid states", evaluation.selectedInvalidStateIds),
      createResultLine("Complete eligible set", evaluation.completeEligibleStateIds)
    );
    const count = document.createElement("p");
    count.className = "mental-map-result-line";
    count.textContent = evaluation.requestedCountMet
      ? `Requested count met: ${challenge.requiredSelectionCount}.`
      : `Requested count not met: choose exactly ${challenge.requiredSelectionCount}.`;
    wrapper.appendChild(count);
  } else if (challenge.answerMode === MENTAL_MAP_ANSWER_MODES.SELECT_ALL) {
    wrapper.append(
      createResultLine("Correct answer", challenge.correctStateIds),
      createResultLine("Correct selections", evaluation.selectedValidStateIds),
      createResultLine("Missing", evaluation.missingStateIds),
      createResultLine("Unnecessary", evaluation.unnecessaryStateIds)
    );
  } else {
    wrapper.append(
      createResultLine("Expected sequence", evaluation.expectedSequence, "is-sequence"),
      createResultLine("Correctly positioned", evaluation.correctlyPositionedStateIds),
      createResultLine("Misplaced", evaluation.misplacedStateIds),
      createResultLine("Missing", evaluation.missingStateIds),
      createResultLine("Unnecessary", evaluation.unnecessaryStateIds)
    );
    if (evaluation.acceptedAlternativeIndex !== null) {
      const alternative = document.createElement("p");
      alternative.className = "mental-map-alternative-note";
      alternative.textContent = "Your answer matches a configured legitimate alternative route.";
      wrapper.appendChild(alternative);
    }
  }

  const explanation = document.createElement("p");
  explanation.className = "mental-map-explanation";
  explanation.textContent = challenge.explanation;
  wrapper.append(explanation, createResultLegend(), createButton("Next Question", "mental-map-primary-action", options.onNextQuestion));
  return wrapper;
}

export function renderMentalMapChallenge(container, challenge, state, options = {}) {
  if (!container || !challenge || !state) return null;
  container.replaceChildren();
  const inner = document.createElement("div");
  inner.className = "mental-map-panel-inner";
  inner.appendChild(createQuestionHeader(challenge));

  if (state.phase === "result") {
    inner.appendChild(createResultContent(challenge, state, options));
  } else {
    const workspace = document.createElement("div");
    workspace.className = "mental-map-answer-workspace";
    workspace.append(
      createSelectedAnswers(challenge, state, options),
      createAnswerBank(state, options)
    );
    inner.append(workspace, createPreSubmitControls(challenge, state, options));
  }
  container.appendChild(inner);
  if (state.phase === "result") container.scrollTop = 0;
  return state;
}
