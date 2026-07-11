import { getStateProfile } from "./united-states-atlas-queries.js";
import { getUnitedStatesAtlasStateLearningStatus } from "./united-states-atlas-progress.js";

const EMPTY_STATE_FEATURE_MESSAGES = Object.freeze({
  internationalNeighbors: "No international land neighbors are recorded for this state.",
  coasts: "No named coasts are recorded for this state.",
  majorBorderingWaters: "No major bordering waters are recorded for this state.",
  rivers: "No connected rivers are recorded for this state yet.",
  lakes: "No connected lakes are recorded for this state yet.",
  mountainRanges: "No connected mountain ranges are recorded for this state yet."
});

function createListSection(title, items, emptyMessage) {
  return {
    title,
    items: items.map((item) => ({
      label: item.context ? `${item.name} (${item.context})` : item.name,
      namePolicyNote: item.namePolicyNote || ""
    })),
    emptyMessage
  };
}

export function getUnitedStatesAtlasProfilePanelData(stateId, atlasProgress) {
  const profile = getStateProfile(stateId);
  if (!profile) return null;
  const learningStatus = getUnitedStatesAtlasStateLearningStatus(atlasProgress, stateId);

  return {
    ...profile,
    learningStatus,
    sections: [
      createListSection("Neighboring states", profile.borderingStates),
      createListSection("International neighbors", profile.internationalNeighbors, EMPTY_STATE_FEATURE_MESSAGES.internationalNeighbors),
      ...(profile.maritimeNeighbors.length ? [createListSection("Maritime neighbors", profile.maritimeNeighbors)] : []),
      createListSection("Coasts", profile.coasts, EMPTY_STATE_FEATURE_MESSAGES.coasts),
      createListSection("Major bordering waters", profile.majorBorderingWaters, EMPTY_STATE_FEATURE_MESSAGES.majorBorderingWaters),
      createListSection("Rivers", profile.rivers, EMPTY_STATE_FEATURE_MESSAGES.rivers),
      createListSection("Lakes", profile.lakes.filter((lake) => !profile.majorBorderingWaters.some((water) => water.id === lake.id)), EMPTY_STATE_FEATURE_MESSAGES.lakes),
      createListSection("Mountain ranges", profile.mountainRanges, EMPTY_STATE_FEATURE_MESSAGES.mountainRanges)
    ]
  };
}

function createLearningStatusSection(learningStatus) {
  const wrapper = document.createElement("section");
  wrapper.className = "united-states-atlas-profile-section united-states-atlas-learning-status";
  const heading = document.createElement("h3");
  heading.textContent = "Learning status";
  const status = document.createElement("p");
  status.className = `united-states-atlas-status united-states-atlas-status-${learningStatus.status}`;
  status.textContent = learningStatus.status;
  const explanation = document.createElement("p");
  explanation.className = "united-states-atlas-status-explanation";
  explanation.textContent = learningStatus.explanation;
  wrapper.append(heading, status, explanation);

  const evidence = [];
  if (learningStatus.introduced) evidence.push("Introduced");
  if (learningStatus.timesPracticed) evidence.push(`${learningStatus.timesPracticed} practiced`);
  if (learningStatus.correctResponses) evidence.push(`${learningStatus.correctResponses} correct`);
  if (learningStatus.misses) evidence.push(`${learningStatus.misses} misses`);
  if (learningStatus.memoryState) evidence.push(`Memory: ${learningStatus.memoryState}`);
  if (evidence.length) {
    const details = document.createElement("p");
    details.className = "united-states-atlas-status-evidence";
    details.textContent = evidence.join(" · ");
    wrapper.appendChild(details);
  }
  return wrapper;
}

function createProfileList(section) {
  const wrapper = document.createElement("section");
  wrapper.className = "united-states-atlas-profile-section";
  const heading = document.createElement("h3");
  heading.textContent = section.title;
  wrapper.appendChild(heading);

  if (section.items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "united-states-atlas-empty";
    empty.textContent = section.emptyMessage || "No related places are recorded.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  const list = document.createElement("ul");
  section.items.forEach((item) => {
    const listItem = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = item.label;
    listItem.appendChild(label);
    if (item.namePolicyNote) {
      const note = document.createElement("small");
      note.textContent = item.namePolicyNote;
      listItem.appendChild(note);
    }
    list.appendChild(listItem);
  });
  wrapper.appendChild(list);
  return wrapper;
}

export function renderUnitedStatesAtlasProfile(container, stateId, options = {}) {
  if (!container) return null;
  const panelData = getUnitedStatesAtlasProfilePanelData(stateId, options.atlasProgress);
  container.replaceChildren();

  if (!panelData) {
    const empty = document.createElement("p");
    empty.className = "united-states-atlas-instruction";
    empty.textContent = "Select a state on the map to explore its geographic profile.";
    container.appendChild(empty);
    return null;
  }

  const header = document.createElement("header");
  header.className = "united-states-atlas-profile-header";
  const title = document.createElement("h2");
  title.textContent = panelData.name;
  const abbreviation = document.createElement("span");
  abbreviation.textContent = panelData.abbreviation;
  header.append(title, abbreviation);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "united-states-atlas-close";
  close.textContent = "Close";
  close.addEventListener("click", () => options.onClearSelection?.());
  header.appendChild(close);

  const facts = document.createElement("dl");
  facts.className = "united-states-atlas-facts";
  [["Capital", panelData.capital?.name || "Not recorded"], ["Region", panelData.region?.name || "Not recorded"]].forEach(([term, definition]) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = definition;
    facts.append(dt, dd);
  });

  container.append(header, facts, createLearningStatusSection(panelData.learningStatus), ...panelData.sections.map(createProfileList));
  return panelData;
}

export function renderUnitedStatesAtlasOverview(container, atlasProgress) {
  if (!container || !atlasProgress) return null;
  container.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = "Your U.S. Atlas";
  const summary = document.createElement("p");
  summary.textContent = `${atlasProgress.totalStates} states tracked`;
  const list = document.createElement("ul");
  ["unexplored", "discovered", "learning", "strong", "mastered"].forEach((status) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = `united-states-atlas-legend-swatch united-states-atlas-status-${status}`;
    const label = document.createElement("span");
    label.textContent = `${status}: ${atlasProgress.counts?.[status] || 0}`;
    item.append(swatch, label);
    list.appendChild(item);
  });
  container.append(heading, summary, list);
  return atlasProgress;
}
