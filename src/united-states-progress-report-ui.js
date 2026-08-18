function element(tagName, className, text = "") {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderSegmentedBar(display, categoryId) {
  const bar = element("div", `us-progress-bar us-progress-bar-${categoryId}`);
  bar.setAttribute("role", "img");
  bar.setAttribute("aria-label", display.accessibleLabel);
  for (let index = 0; index < display.segmentCount; index += 1) {
    const segment = element("span", `us-progress-segment${index < display.filledCount ? " is-filled" : ""}`);
    segment.setAttribute("aria-hidden", "true");
    bar.appendChild(segment);
  }
  return bar;
}

function renderEvidenceDetail(record) {
  const detail = element("div", "us-progress-item-detail");
  const demonstrated = element("section", "us-progress-detail-section");
  demonstrated.appendChild(element("h4", "", "Your progress"));
  demonstrated.appendChild(element("p", "us-progress-detail-prompt", "What your answers show"));
  demonstrated.appendChild(element("p", "", record.explanation));

  const counts = element("p", "us-progress-evidence-counts");
  counts.textContent = record.bayesianProgressScore === null
    ? "No answers yet"
    : `${record.evidenceHistory.correctCount} correct · ${record.evidenceHistory.incorrectCount} incorrect`;
  demonstrated.appendChild(counts);
  const review = element("section", `us-progress-detail-section us-progress-review-status us-progress-review-${record.reviewStatus.id}`);
  review.appendChild(element("h4", "", "Practice"));
  review.appendChild(element("p", "us-progress-detail-prompt", "What could help next"));
  review.appendChild(element("strong", "us-progress-review-label", record.reviewStatus.label));
  review.appendChild(element("p", "", record.reviewStatus.explanation));
  detail.append(demonstrated, review);
  return detail;
}

function renderItem(record) {
  const item = element("details", `us-progress-item us-progress-item-${record.displayCategory.id}`);
  item.dataset.progressItemId = record.itemId;
  item.dataset.progressSkillId = record.skillId;
  const summary = element("summary", "us-progress-item-summary");
  const heading = element("span", "us-progress-item-heading");
  heading.append(
    element("strong", "us-progress-item-name", record.label),
    element("span", `us-progress-label us-progress-label-${record.displayCategory.id}`, record.displayCategory.label)
  );
  summary.append(heading, renderSegmentedBar(record.display, record.displayCategory.id));
  item.append(summary, renderEvidenceDetail(record));
  return item;
}

function renderCategory(category) {
  const categoryElement = element("details", `us-progress-category us-progress-category-${category.displayCategory.id}`);
  categoryElement.dataset.progressCategoryId = category.id;
  const summary = element("summary", "us-progress-category-summary");
  const copy = element("span", "us-progress-category-copy");
  copy.append(
    element("strong", "us-progress-category-title", category.label),
    element("span", `us-progress-label us-progress-label-${category.displayCategory.id}`, category.displayCategory.label),
    element("span", "us-progress-category-count", category.summary)
  );
  summary.append(copy, renderSegmentedBar(category.display, category.displayCategory.id));

  const itemList = element("div", "us-progress-item-list");
  itemList.setAttribute("aria-label", `${category.label} details`);
  category.records.forEach((record) => itemList.appendChild(renderItem(record)));
  categoryElement.append(summary, itemList);
  return categoryElement;
}

export function renderUnitedStatesProgressReport(container, report) {
  if (!container) return null;
  container.replaceChildren();
  container.className = "united-states-progress-report";
  container.dataset.progressReportVersion = String(report.schemaVersion);

  const intro = element("section", "us-progress-intro");
  intro.append(
    element("p", "us-progress-eyebrow", report.scopeTitle || "United States"),
    element("h2", "", report.sectionTitle || "What you know"),
    element("p", "us-progress-intro-lead", report.subtitle),
  );

  const categories = element("section", "us-progress-category-list");
  categories.setAttribute("aria-label", "Progress by skill");
  report.categories.forEach((category) => categories.appendChild(renderCategory(category)));

  const sourceDisclosure = element("details", "us-progress-data-sources");
  const sourceSummary = element("summary", "", "How progress works");
  const sourceCopy = element("div", "us-progress-data-sources-copy");
  report.howProgressWorks.forEach((paragraph) => sourceCopy.appendChild(element("p", "", paragraph)));
  sourceDisclosure.append(sourceSummary, sourceCopy);

  container.append(intro, categories, sourceDisclosure);
  return container;
}
