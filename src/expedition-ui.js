const statusLabels = Object.freeze({
  locked: "Locked",
  available: "Ready",
  "in-progress": "In progress",
  complete: "Complete"
});

export function renderExpedition(container, model, options = {}) {
  if (!container || !model) return;
  const documentRef = container.ownerDocument;
  const intro = documentRef.createElement("section");
  intro.className = "expedition-intro";
  const progress = documentRef.createElement("p");
  progress.className = "expedition-progress";
  progress.textContent = `${model.progress.completedCount} of ${model.progress.totalCount} milestones complete`;
  const summary = documentRef.createElement("p");
  summary.textContent = model.description;
  intro.append(summary, progress);

  const stepList = documentRef.createElement("ol");
  stepList.className = "expedition-step-list";
  for (const step of model.steps) {
    const item = documentRef.createElement("li");
    item.className = `expedition-step expedition-step-${step.status}`;
    if (step.id === model.recommendedStepId) item.classList.add("is-recommended");
    const heading = documentRef.createElement("h2");
    heading.textContent = step.title;
    const mechanic = documentRef.createElement("p");
    mechanic.className = "expedition-step-mechanic";
    mechanic.textContent = step.mechanicLabel || step.launch.kind;
    const description = documentRef.createElement("p");
    description.textContent = step.description || "";
    const footer = documentRef.createElement("div");
    footer.className = "expedition-step-footer";
    const status = documentRef.createElement("span");
    status.className = "expedition-step-status";
    status.textContent = step.isOptional ? "Optional exploration" : statusLabels[step.status];
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "main-menu-button main-menu-button-teal";
    button.textContent = step.actionLabel;
    button.disabled = step.status === "locked";
    button.addEventListener("click", () => options.onLaunch?.(step));
    footer.append(status, button);
    item.append(heading, mechanic, description, footer);
    stepList.append(item);
  }
  container.replaceChildren(intro, stepList);
}

function getStep(model, stepId) {
  return model.steps.find((step) => step.id === stepId) || null;
}

function getObjectiveStepIds(objective) {
  return [...new Set([
    objective.primaryStepId,
    ...objective.groups.flatMap((group) => group.activities.map((activity) => activity.stepId))
  ].filter(Boolean))];
}

export function getAcrossUnitedStatesObjectiveProgressLabel(model, objective) {
  const steps = getObjectiveStepIds(objective).map((stepId) => getStep(model, stepId)).filter(Boolean);
  if (steps.some((step) => step.status === "in-progress")) return "Learning";
  if (steps.some((step) => step.status === "complete")) return "Showing progress";
  return "Not started";
}

function getObjectiveForStep(navigation, stepId) {
  return navigation.objectives.find((objective) => getObjectiveStepIds(objective).includes(stepId)) || null;
}

function getActivityForStep(objective, stepId) {
  return objective.groups
    .flatMap((group) => group.activities)
    .find((activity) => activity.stepId === stepId) || null;
}

function resolveNavigationStep(model, entry) {
  const step = getStep(model, entry.stepId);
  if (!step) return null;
  return entry.launch ? { ...step, launch: entry.launch } : step;
}

function createUtilityActions(documentRef, navigation, model, options) {
  const utilities = documentRef.createElement("nav");
  utilities.className = "us-expedition-utilities";
  utilities.setAttribute("aria-label", "United States reference and progress");
  for (const utility of navigation.utilities) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "us-expedition-text-action";
    button.textContent = utility.label;
    if (utility.stepId) {
      const step = getStep(model, utility.stepId);
      button.addEventListener("click", () => options.onLaunch?.(step, { allowLocked: true }));
    } else if (utility.id === "progress") {
      button.addEventListener("click", () => options.onProgress?.());
    }
    utilities.append(button);
  }
  return utilities;
}

function createRecommendationPanel(documentRef, model, navigation, objective, options = {}) {
  const modelRecommendation = getStep(model, model.recommendedStepId);
  const recommendationIsInObjective = modelRecommendation
    && getObjectiveStepIds(objective).includes(modelRecommendation.id);
  const objectiveSteps = getObjectiveStepIds(objective).map((stepId) => getStep(model, stepId)).filter(Boolean);
  const step = recommendationIsInObjective
    ? modelRecommendation
    : objectiveSteps.find((candidate) => candidate.status === "in-progress")
      || getStep(model, objective.primaryStepId);
  if (!step) return null;

  const matchingActivity = getActivityForStep(objective, step.id);
  const launchEntry = step.id === objective.primaryStepId
    ? { stepId: step.id }
    : matchingActivity || { stepId: step.id };
  const resolvedStep = resolveNavigationStep(model, launchEntry);
  const isHome = options.isHome === true;
  const panel = documentRef.createElement("section");
  panel.className = "us-expedition-recommendation";
  panel.setAttribute("aria-label", isHome ? "Recommended next" : `Continue ${objective.title}`);
  const copy = documentRef.createElement("div");
  copy.className = "us-expedition-recommendation-copy";
  const eyebrow = documentRef.createElement("p");
  eyebrow.className = "us-expedition-eyebrow";
  eyebrow.textContent = step.status === "in-progress" ? "Continue learning" : isHome ? "Recommended next" : "Suggested start";
  const heading = documentRef.createElement("h2");
  heading.textContent = step.id === objective.primaryStepId
    ? objective.primaryLabel
    : matchingActivity?.label || step.title;
  const reason = documentRef.createElement("p");
  reason.textContent = step.status === "in-progress"
    ? "Continue where your learning is already underway."
    : isHome
      ? "This is the next open step in the current U.S. learning path."
      : "A useful place to begin in this learning area.";
  copy.append(eyebrow, heading, reason);
  const button = documentRef.createElement("button");
  button.type = "button";
  button.className = "main-menu-button main-menu-button-teal us-expedition-continue";
  button.textContent = "Continue";
  button.addEventListener("click", () => options.onLaunch?.(resolvedStep, {
    allowLocked: true,
    objectiveId: objective.id
  }));
  panel.append(copy, button);
  return panel;
}

function renderAcrossUnitedStatesHome(container, model, navigation, options) {
  const documentRef = container.ownerDocument;
  const recommendedObjective = getObjectiveForStep(navigation, model.recommendedStepId)
    || navigation.objectives[0];
  const recommendation = createRecommendationPanel(documentRef, model, navigation, recommendedObjective, {
    ...options,
    isHome: true
  });

  const objectiveSection = documentRef.createElement("section");
  objectiveSection.className = "us-objectives";
  objectiveSection.setAttribute("aria-labelledby", "us-objectives-title");
  const objectiveHeader = documentRef.createElement("div");
  objectiveHeader.className = "us-objectives-header";
  const heading = documentRef.createElement("h2");
  heading.id = "us-objectives-title";
  heading.textContent = "Choose what you want to understand";
  const openLabel = documentRef.createElement("p");
  openLabel.className = "us-objectives-open-label";
  openLabel.textContent = navigation.openAreasLabel;
  const sequence = documentRef.createElement("p");
  sequence.className = "us-objectives-sequence";
  sequence.textContent = "Learn the map → Understand the landscape → Connect the map → Use everything together";
  objectiveHeader.append(heading, openLabel, sequence);

  const grid = documentRef.createElement("div");
  grid.id = "us-objective-grid";
  grid.className = "us-objective-grid";
  const detail = documentRef.createElement("aside");
  detail.className = "us-objective-detail";
  detail.setAttribute("aria-live", "polite");
  const detailTitle = documentRef.createElement("strong");
  detailTitle.textContent = "All areas are open";
  const detailDescription = documentRef.createElement("span");
  detailDescription.textContent = "The numbered order is a recommendation, not a requirement.";
  detail.append(detailTitle, detailDescription);
  const cards = [];

  const resetDetail = () => {
    cards.forEach((card) => card.classList.remove("is-previewed"));
    detailTitle.textContent = "All areas are open";
    detailDescription.textContent = "The numbered order is a recommendation, not a requirement.";
  };

  for (const objective of navigation.objectives) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.className = "us-objective-card";
    const descriptionId = `us-objective-description-${objective.id}`;
    button.setAttribute("aria-describedby", descriptionId);
    const number = documentRef.createElement("span");
    number.className = "us-objective-number";
    number.textContent = String(objective.sequence);
    number.setAttribute("aria-hidden", "true");
    const body = documentRef.createElement("span");
    body.className = "us-objective-card-body";
    const title = documentRef.createElement("strong");
    title.className = "us-objective-title";
    title.textContent = objective.title;
    const status = documentRef.createElement("span");
    status.className = "us-objective-status";
    status.textContent = getAcrossUnitedStatesObjectiveProgressLabel(model, objective);
    const description = documentRef.createElement("span");
    description.id = descriptionId;
    description.className = "us-objective-mobile-description";
    description.textContent = objective.description;
    body.append(title, status, description);
    const arrow = documentRef.createElement("span");
    arrow.className = "us-objective-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");
    button.append(number, body, arrow);
    const preview = () => {
      cards.forEach((card) => card.classList.toggle("is-previewed", card === button));
      detailTitle.textContent = objective.title;
      detailDescription.textContent = objective.description;
    };
    button.addEventListener("mouseenter", preview);
    button.addEventListener("focus", preview);
    button.addEventListener("mouseleave", () => {
      if (documentRef.activeElement !== button) resetDetail();
    });
    button.addEventListener("blur", resetDetail);
    button.addEventListener("click", () => options.onSelectObjective?.(objective.id));
    cards.push(button);
    grid.append(button);
  }
  objectiveSection.append(objectiveHeader, grid, detail);
  const utilities = createUtilityActions(documentRef, navigation, model, options);
  container.replaceChildren(recommendation, objectiveSection, utilities);
}

function renderAcrossUnitedStatesObjective(container, model, navigation, objective, options) {
  const documentRef = container.ownerDocument;
  const intro = documentRef.createElement("section");
  intro.className = "us-objective-intro";
  const back = documentRef.createElement("button");
  back.type = "button";
  back.className = "us-expedition-back";
  back.textContent = "← Across the United States";
  back.addEventListener("click", () => options.onSelectObjective?.(""));
  const sequence = documentRef.createElement("p");
  sequence.className = "us-expedition-eyebrow";
  sequence.textContent = `Learning area ${objective.sequence} of ${navigation.objectives.length}`;
  const heading = documentRef.createElement("h2");
  heading.textContent = objective.title;
  const description = documentRef.createElement("p");
  description.textContent = objective.description;
  const access = documentRef.createElement("p");
  access.className = "us-objective-access-note";
  access.textContent = "Choose any activity in this area. The sequence is guidance, not a requirement.";
  intro.append(back, sequence, heading, description, access);

  const recommendation = createRecommendationPanel(documentRef, model, navigation, objective, options);
  const groups = documentRef.createElement("div");
  groups.className = "us-objective-groups";
  for (const group of objective.groups) {
    const section = documentRef.createElement("section");
    section.className = "us-objective-group";
    const groupTitle = documentRef.createElement("h3");
    groupTitle.textContent = group.title;
    const list = documentRef.createElement("div");
    list.className = "us-objective-activity-list";
    for (const activity of group.activities) {
      const step = resolveNavigationStep(model, activity);
      if (!step) continue;
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "us-objective-activity";
      const copy = documentRef.createElement("span");
      copy.className = "us-objective-activity-copy";
      const title = documentRef.createElement("strong");
      title.textContent = activity.label;
      copy.append(title);
      if (activity.description) {
        const subtitle = documentRef.createElement("span");
        subtitle.textContent = activity.description;
        copy.append(subtitle);
      }
      const arrow = documentRef.createElement("span");
      arrow.className = "us-objective-arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");
      button.append(copy, arrow);
      button.addEventListener("click", () => options.onLaunch?.(step, {
        allowLocked: true,
        objectiveId: objective.id
      }));
      list.append(button);
    }
    section.append(groupTitle, list);
    groups.append(section);
  }

  const utilities = createUtilityActions(documentRef, navigation, model, options);
  container.replaceChildren(intro, recommendation, groups, utilities);
}

export function renderAcrossUnitedStatesNavigation(container, model, navigation, options = {}) {
  if (!container || !model || !navigation) return;
  const objective = navigation.objectives.find(({ id }) => id === options.objectiveId);
  if (objective) {
    renderAcrossUnitedStatesObjective(container, model, navigation, objective, options);
    return;
  }
  renderAcrossUnitedStatesHome(container, model, navigation, options);
}
