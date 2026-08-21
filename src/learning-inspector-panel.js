function envelopeValue(value) {
  return value && typeof value === "object" && "availability" in value ? value.value : value;
}

function text(value) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function createLearningInspectorPanelViewModel(snapshot = {}, query = "") {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const items = (snapshot.items || []).map((item) => {
    const identity = item.identity || {};
    const stableId = text(envelopeValue(identity.stableId));
    const label = text(envelopeValue(identity.label));
    const sourceActivity = text(envelopeValue(identity.sourceActivity));
    const taxonomy = text(envelopeValue(identity.taxonomy));
    const progress = text(envelopeValue(item.learnerState?.progressStatus || item.learnerState?.currentProgress));
    const masterySignals = envelopeValue(item.learnerState?.masterySignals) || null;
    const searchable = [stableId, label, sourceActivity, taxonomy, item.adapter, JSON.stringify(masterySignals)].join(" ").toLowerCase();
    return {
      stableId,
      label,
      adapter: item.adapter || "unknown",
      sourceActivity,
      taxonomy,
      progress,
      masterySignals,
      metrics: Object.fromEntries(Object.entries(item.metrics || {}).map(([key, value]) => [key, {
        availability: value?.availability || "unavailable",
        value: envelopeValue(value)
      }])),
      visible: !normalizedQuery || searchable.includes(normalizedQuery)
    };
  });
  const selections = (snapshot.selections || []).map((selection) => ({
    planner: text(envelopeValue(selection.planner)),
    itemId: text(envelopeValue(selection.itemId)),
    reasonCode: text(envelopeValue(selection.reasonCode)),
    priorityFactors: envelopeValue(selection.priorityFactors),
    trace: selection.selectionTrace || null
  }));
  const transitions = (snapshot.transitions || []).map((transition) => ({
    itemId: text(envelopeValue(transition.event?.itemId)),
    sourceMode: text(envelopeValue(transition.event?.sourceMode)),
    result: envelopeValue(transition.event?.result),
    changes: envelopeValue(transition.changes) || []
  }));
  const canonicalEvidence = snapshot.canonicalEvidence || null;
  return {
    schemaVersion: snapshot.schemaVersion || 1,
    generatedAt: snapshot.context?.generatedAt || null,
    items,
    visibleItemCount: items.filter(({ visible }) => visible).length,
    selections,
    transitions,
    canonicalSummaries: envelopeValue(canonicalEvidence?.summaries) || [],
    canonicalSummaryCount: envelopeValue(canonicalEvidence?.summaries)?.length || 0,
    recentCanonicalEvidence: envelopeValue(canonicalEvidence?.recentEvidence) || []
  };
}

function installStyles(documentRef) {
  if (documentRef.querySelector("#learning-inspector-panel-styles")) return;
  const style = documentRef.createElement("style");
  style.id = "learning-inspector-panel-styles";
  style.textContent = `
    .learning-inspector-launch { position: fixed; left: 12px; bottom: 12px; z-index: 1900; padding: 8px 11px; border-radius: 999px; border: 1px solid #64748b; background: #0f172a; color: #fff; font: 600 12px/1.2 system-ui, sans-serif; }
    .learning-inspector-panel { position: fixed; inset: 16px; z-index: 2000; display: grid; grid-template-rows: auto auto 1fr; max-width: 1100px; margin-left: auto; border: 1px solid #475569; border-radius: 14px; background: #f8fafc; color: #0f172a; box-shadow: 0 24px 70px #0f172a66; overflow: hidden; font: 13px/1.4 system-ui, sans-serif; }
    .learning-inspector-panel[hidden] { display: none; }
    .learning-inspector-header, .learning-inspector-toolbar { display: flex; gap: 8px; align-items: center; padding: 10px 12px; border-bottom: 1px solid #cbd5e1; }
    .learning-inspector-header h2 { margin: 0; flex: 1; font-size: 18px; }
    .learning-inspector-toolbar input { flex: 1; min-width: 120px; padding: 8px; }
    .learning-inspector-body { overflow: auto; padding: 12px; }
    .learning-inspector-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 12px; }
    .learning-inspector-summary div, .learning-inspector-card { border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; padding: 9px; }
    .learning-inspector-card { margin-bottom: 8px; }
    .learning-inspector-card h3 { margin: 0 0 5px; font-size: 14px; }
    .learning-inspector-card dl { display: grid; grid-template-columns: minmax(110px, auto) 1fr; gap: 2px 8px; margin: 0; }
    .learning-inspector-card dt { color: #475569; }
    .learning-inspector-card dd { margin: 0; overflow-wrap: anywhere; }
    .learning-inspector-section-title { margin: 18px 0 8px; font-size: 15px; }
    @media (max-width: 700px) { .learning-inspector-panel { inset: 6px; } .learning-inspector-header, .learning-inspector-toolbar { flex-wrap: wrap; } }
  `;
  documentRef.head.append(style);
}

export function installLearningInspectorPanel({ getSnapshot, documentRef = globalThis.document, navigatorRef = globalThis.navigator } = {}) {
  if (!documentRef?.body || typeof getSnapshot !== "function") return null;
  installStyles(documentRef);
  const launch = documentRef.createElement("button");
  launch.type = "button";
  launch.className = "learning-inspector-launch";
  launch.textContent = "Learning Inspector";
  launch.setAttribute("aria-expanded", "false");
  const panel = documentRef.createElement("section");
  panel.className = "learning-inspector-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Learning Inspector");
  panel.innerHTML = `
    <header class="learning-inspector-header"><h2>Learning Inspector</h2><button type="button" data-action="refresh">Refresh</button><button type="button" data-action="copy">Copy JSON</button><button type="button" data-action="close">Close</button></header>
    <div class="learning-inspector-toolbar"><label>Filter items <input type="search" placeholder="Ohio, locating, state…"></label><span role="status" data-status></span></div>
    <div class="learning-inspector-body"><p>Loading current learner evidence…</p></div>
  `;
  documentRef.body.append(launch, panel);
  const body = panel.querySelector(".learning-inspector-body");
  const search = panel.querySelector("input[type='search']");
  const status = panel.querySelector("[data-status]");
  let snapshot = null;

  function detailCard(title, rows) {
    const card = documentRef.createElement("article");
    card.className = "learning-inspector-card";
    const heading = documentRef.createElement("h3");
    heading.textContent = title;
    const list = documentRef.createElement("dl");
    for (const [label, value] of rows) {
      const term = documentRef.createElement("dt");
      const description = documentRef.createElement("dd");
      term.textContent = label;
      description.textContent = text(value);
      list.append(term, description);
    }
    card.append(heading, list);
    return card;
  }

  function render() {
    const view = createLearningInspectorPanelViewModel(snapshot || {}, search.value);
    const summary = documentRef.createElement("div");
    summary.className = "learning-inspector-summary";
    for (const [label, value] of [["Visible items", `${view.visibleItemCount}/${view.items.length}`], ["Current selections", view.selections.length], ["Recent transitions", view.transitions.length], ["Canonical histories", view.canonicalSummaryCount]]) {
      const cell = documentRef.createElement("div");
      cell.textContent = `${label}: ${value}`;
      summary.append(cell);
    }
    const nodes = [summary];
    for (const item of view.items.filter(({ visible }) => visible)) {
      nodes.push(detailCard(`${item.label} · ${item.adapter}`, [
        ["Stable ID", item.stableId], ["Activity", item.sourceActivity], ["Category/skill", item.taxonomy], ["Progress", item.progress],
        ["Skill signals", item.masterySignals], ["Attempts", item.metrics.attempts], ["Correct", item.metrics.successes], ["Errors/lapses", { failures: item.metrics.failures, lapses: item.metrics.lapses }],
        ["Last encounter", item.metrics.lastSeen], ["Next review", item.metrics.nextReview]
      ]));
    }
    const selectionTitle = documentRef.createElement("h3");
    selectionTitle.className = "learning-inspector-section-title";
    selectionTitle.textContent = "Current selection reasons";
    nodes.push(selectionTitle, ...view.selections.map((selection) => detailCard(`${selection.itemId} · ${selection.planner}`, [["Reason", selection.reasonCode], ["Priority", selection.priorityFactors], ["Selection trace", selection.trace]])));
    const evidenceTitle = documentRef.createElement("h3");
    evidenceTitle.className = "learning-inspector-section-title";
    evidenceTitle.textContent = "Canonical learner evidence";
    nodes.push(evidenceTitle, ...view.canonicalSummaries.map((summary) => detailCard(`${summary.conceptId} · ${summary.skillId}`, [
      ["Attempts", summary.attemptCount ?? summary.attempts], ["Correct", summary.correctCount], ["Errors", summary.incorrectCount],
      ["Last outcome", summary.mostRecentOutcome ?? summary.lastOutcome], ["Last encounter", summary.lastEvidenceAt ?? summary.lastOccurredAt], ["Source modes", summary.sourceModes]
    ])));
    const recentEvidenceTitle = documentRef.createElement("h3");
    recentEvidenceTitle.className = "learning-inspector-section-title";
    recentEvidenceTitle.textContent = "Recent responses";
    nodes.push(recentEvidenceTitle, ...view.recentCanonicalEvidence.map((event) => detailCard(`${event.conceptId} · ${event.skillId}`, [
      ["Outcome", event.outcome], ["Response", event.response], ["Source", `${event.sourceMode}${event.sourceActivityId ? ` · ${event.sourceActivityId}` : ""}`], ["Occurred", event.occurredAt]
    ])));
    const transitionTitle = documentRef.createElement("h3");
    transitionTitle.className = "learning-inspector-section-title";
    transitionTitle.textContent = "Recent before/after evidence";
    nodes.push(transitionTitle, ...view.transitions.map((transition) => detailCard(`${transition.itemId} · ${transition.sourceMode}`, [["Result", transition.result], ["Changed fields", transition.changes]])));
    body.replaceChildren(...nodes);
    status.textContent = `Updated ${view.generatedAt ? new Date(view.generatedAt).toLocaleTimeString() : "now"}`;
    return view;
  }

  async function refresh() {
    status.textContent = "Refreshing…";
    snapshot = await getSnapshot();
    return render();
  }

  async function setOpen(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) await refresh();
  }

  launch.addEventListener("click", () => { void setOpen(panel.hidden); });
  panel.querySelector("[data-action='close']").addEventListener("click", () => { void setOpen(false); });
  panel.querySelector("[data-action='refresh']").addEventListener("click", () => { void refresh(); });
  panel.querySelector("[data-action='copy']").addEventListener("click", async () => {
    if (!snapshot || !navigatorRef?.clipboard?.writeText) return;
    await navigatorRef.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    status.textContent = "Copied JSON";
  });
  search.addEventListener("input", render);
  return { open: () => setOpen(true), close: () => setOpen(false), refresh, getSnapshot: () => snapshot };
}
