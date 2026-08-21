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
