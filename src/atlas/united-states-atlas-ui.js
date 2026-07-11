import { getStateProfile } from "./united-states-atlas-queries.js";

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

export function getUnitedStatesAtlasProfilePanelData(stateId) {
  const profile = getStateProfile(stateId);
  if (!profile) return null;

  return {
    ...profile,
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
  const panelData = getUnitedStatesAtlasProfilePanelData(stateId);
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

  container.append(header, facts, ...panelData.sections.map(createProfileList));
  return panelData;
}
