import { getStateById } from "./united-states-atlas-queries.js";
import { COMPASS_QUESTION_TYPES } from "./compass-challenges.js";

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
  if (challenge.secondaryInstruction) {
    const instruction = document.createElement("p");
    instruction.className = "mental-map-request-count";
    instruction.textContent = challenge.secondaryInstruction;
    header.appendChild(instruction);
  }
  return header;
}

function createSelectedAnswers(challenge, state, options) {
  const section = document.createElement("section");
  section.className = "mental-map-selected";
  const heading = document.createElement("h3");
  heading.textContent = challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST
    ? "Your order"
    : "Your answer";
  section.appendChild(heading);

  if (!state.selectedStateIds.length) {
    const empty = document.createElement("p");
    empty.className = "mental-map-empty";
    empty.textContent = "No state selected yet.";
    section.appendChild(empty);
    return section;
  }

  const list = document.createElement(challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST ? "ol" : "ul");
  list.className = "mental-map-selected-list";
  if (challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) list.classList.add("is-ordered");
  state.selectedStateIds.forEach((stateId, index) => {
    const item = document.createElement("li");
    const remove = createButton(
      challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST ? `${index + 1}. ${stateName(stateId)}` : stateName(stateId),
      "mental-map-selected-choice",
      () => options.onRemove?.(stateId),
      { ariaLabel: `Remove ${stateName(stateId)}` }
    );
    item.appendChild(remove);
    if (challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
      const actions = document.createElement("span");
      actions.className = "mental-map-selected-actions";
      actions.append(
        createButton("Up", "mental-map-mini-action", () => options.onMove?.(stateId, "up"), {
          ariaLabel: `Move ${stateName(stateId)} up`,
          disabled: index === 0
        }),
        createButton("Down", "mental-map-mini-action", () => options.onMove?.(stateId, "down"), {
          ariaLabel: `Move ${stateName(stateId)} down`,
          disabled: index === state.selectedStateIds.length - 1
        })
      );
      item.appendChild(actions);
    }
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
    const selected = state.selectedStateIds.includes(answer.id);
    const choice = createButton(answer.name, "mental-map-answer-choice", () => {
      if (selected) options.onRemove?.(answer.id);
      else options.onSelect?.(answer.id);
    }, { ariaLabel: selected ? `Deselect ${answer.name}` : `Select ${answer.name}` });
    choice.classList.toggle("is-selected", selected);
    choice.setAttribute("aria-pressed", String(selected));
    bank.appendChild(choice);
  });
  section.append(heading, bank);
  return section;
}

function createControls(state, options) {
  const controls = document.createElement("div");
  controls.className = "mental-map-controls";
  controls.append(
    createButton("Undo", "mental-map-secondary-action", options.onUndo, { disabled: !state.selectedStateIds.length }),
    createButton("Clear", "mental-map-secondary-action", options.onClear, { disabled: !state.selectedStateIds.length }),
    createButton("Submit", "mental-map-primary-action", options.onSubmit, { disabled: !state.selectedStateIds.length }),
    createButton("New Question", "mental-map-secondary-action", options.onNewQuestion)
  );
  return controls;
}

function createResultLine(label, stateIds, className = "") {
  const line = document.createElement("p");
  line.className = `mental-map-result-line ${className}`.trim();
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  line.append(strong, document.createTextNode(stateNames(stateIds, className === "is-sequence" ? " -> " : ", ")));
  return line;
}

function createResultLegend() {
  const legend = document.createElement("ul");
  legend.className = "mental-map-result-legend";
  [
    ["selected-correct", "Selected and correct"],
    ["correct", "Correct answer"],
    ["missing", "Missing"],
    ["misplaced", "Misplaced"],
    ["incorrect", "Incorrect"],
    ["direction", "Correct direction"]
  ].forEach(([className, label]) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = `mental-map-result-${className}`;
    item.append(swatch, document.createTextNode(label));
    legend.appendChild(item);
  });
  return legend;
}

function createResult(challenge, state, options) {
  const evaluation = state.evaluation;
  const wrapper = document.createElement("section");
  wrapper.className = "mental-map-result-content";
  const status = document.createElement("p");
  status.className = `mental-map-result-status is-${evaluation.feedback}`;
  status.textContent = evaluation.feedback === "correct"
    ? "Correct"
    : evaluation.feedback === "partial"
      ? "Partly right"
      : "Not quite";
  wrapper.append(status, createResultLine("Your answer", evaluation.selectedStateIds, challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST ? "is-sequence" : ""));
  if (challenge.questionType === COMPASS_QUESTION_TYPES.WEST_TO_EAST) {
    wrapper.append(
      createResultLine("Correct order", evaluation.expectedStateIds, "is-sequence"),
      createResultLine("Correctly positioned", evaluation.correctlyPositionedStateIds),
      createResultLine("Misplaced", evaluation.misplacedStateIds),
      createResultLine("Missing", evaluation.missingStateIds)
    );
  } else {
    wrapper.append(
      createResultLine("Correct answer", evaluation.expectedStateIds),
      createResultLine("Incorrect", evaluation.selectedIncorrectStateIds)
    );
  }
  const explanation = document.createElement("p");
  explanation.className = "mental-map-explanation";
  explanation.textContent = challenge.explanation;
  wrapper.append(explanation, createResultLegend(), createButton("Next Question", "mental-map-primary-action", options.onNextQuestion));
  return wrapper;
}

export function renderCompassChallenge(container, challenge, state, options = {}) {
  if (!container || !challenge || !state) return null;
  container.replaceChildren();
  const inner = document.createElement("div");
  inner.className = "mental-map-panel-inner";
  inner.appendChild(createQuestionHeader(challenge));
  if (state.phase === "result") {
    inner.appendChild(createResult(challenge, state, options));
  } else {
    const workspace = document.createElement("div");
    workspace.className = "mental-map-answer-workspace";
    workspace.append(createSelectedAnswers(challenge, state, options), createAnswerBank(state, options));
    inner.append(workspace, createControls(state, options));
  }
  container.replaceChildren(inner);
  if (state.phase === "result") container.scrollTop = 0;
  return state;
}
