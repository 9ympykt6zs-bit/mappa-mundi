const DEFAULT_VIEWPORT_INSET_PX = 10;
const DEFAULT_LABEL_GUTTER_PX = 4;
const DEFAULT_LEADER_GAP_PX = 16;
const DEFAULT_MARKER_RADIUS_PX = 8;
const DEFAULT_CAPITAL_RADIUS_PX = 18;

const candidateDirections = Object.freeze([
  "above", "upper-right", "upper-left", "right", "left", "below", "lower-right", "lower-left"
]);
const candidateGaps = Object.freeze([6, 16, 28, 42]);

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRect(rect = {}) {
  const x = finite(rect.x ?? rect.left);
  const y = finite(rect.y ?? rect.top);
  const width = Math.max(0, finite(rect.width, finite(rect.right) - x));
  const height = Math.max(0, finite(rect.height, finite(rect.bottom) - y));
  return { x, y, width, height, right: x + width, bottom: y + height };
}

function expandRect(rect, amount = 0) {
  const normalized = normalizeRect(rect);
  return normalizeRect({
    x: normalized.x - amount,
    y: normalized.y - amount,
    width: normalized.width + amount * 2,
    height: normalized.height + amount * 2
  });
}

export function capitalLocationLabelRectsOverlap(left, right, gutter = 0) {
  const a = expandRect(left, Math.max(0, gutter) / 2);
  const b = expandRect(right, Math.max(0, gutter) / 2);
  return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
}

function overlapArea(left, right) {
  const a = normalizeRect(left);
  const b = normalizeRect(right);
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y));
}

function pointInsideRect(point, rect) {
  const box = normalizeRect(rect);
  return point.x >= box.x && point.x <= box.right && point.y >= box.y && point.y <= box.bottom;
}

function orientation(a, b, c) {
  return Math.sign((b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y));
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 !== o2 && o3 !== o4;
}

function segmentIntersectsRect(segment, rect) {
  if (!segment) return false;
  const box = normalizeRect(rect);
  if (pointInsideRect(segment.start, box) || pointInsideRect(segment.end, box)) return true;
  const topLeft = { x: box.x, y: box.y };
  const topRight = { x: box.right, y: box.y };
  const bottomLeft = { x: box.x, y: box.bottom };
  const bottomRight = { x: box.right, y: box.bottom };
  return segmentsIntersect(segment.start, segment.end, topLeft, topRight)
    || segmentsIntersect(segment.start, segment.end, topRight, bottomRight)
    || segmentsIntersect(segment.start, segment.end, bottomRight, bottomLeft)
    || segmentsIntersect(segment.start, segment.end, bottomLeft, topLeft);
}

function directionOrder(label) {
  if (label.role === "capital") return candidateDirections;
  if (label.choiceIndex === 1) {
    return ["right", "upper-right", "lower-right", "above", "below", "left", "upper-left", "lower-left"];
  }
  return ["left", "upper-left", "lower-left", "above", "below", "right", "upper-right", "lower-right"];
}

function createCandidateBox(label, direction, gap) {
  const point = label.point;
  const radius = Math.max(0, finite(label.markerRadius, DEFAULT_MARKER_RADIUS_PX));
  const width = Math.max(1, finite(label.width, 1));
  const height = Math.max(1, finite(label.height, 1));
  const left = point.x - radius - gap - width;
  const right = point.x + radius + gap;
  const above = point.y - radius - gap - height;
  const below = point.y + radius + gap;
  const positions = {
    above: { x: point.x - width / 2, y: above },
    below: { x: point.x - width / 2, y: below },
    left: { x: left, y: point.y - height / 2 },
    right: { x: right, y: point.y - height / 2 },
    "upper-left": { x: left, y: above },
    "upper-right": { x: right, y: above },
    "lower-left": { x: left, y: below },
    "lower-right": { x: right, y: below }
  };
  return normalizeRect({ ...positions[direction], width, height });
}

function rectInsideViewport(rect, viewport, inset) {
  const box = normalizeRect(rect);
  return box.x >= inset && box.y >= inset
    && box.right <= viewport.width - inset && box.bottom <= viewport.height - inset;
}

function closestPointOnRect(point, rect) {
  const box = normalizeRect(rect);
  return {
    x: Math.max(box.x, Math.min(box.right, point.x)),
    y: Math.max(box.y, Math.min(box.bottom, point.y))
  };
}

function createLeader(label, box, gap, threshold) {
  if (gap < threshold) return null;
  const end = closestPointOnRect(label.point, box);
  const dx = end.x - label.point.x;
  const dy = end.y - label.point.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0) return null;
  const radius = Math.max(0, finite(label.markerRadius, DEFAULT_MARKER_RADIUS_PX)) + 2;
  return {
    start: { x: label.point.x + (dx / distance) * radius, y: label.point.y + (dy / distance) * radius },
    end,
    gapPx: Math.max(0, distance - radius)
  };
}

function candidateScore(candidate, label, markerObstacles, controlRects, placed, capitalStarRect) {
  const { box, leader, gap, directionRank, ringRank } = candidate;
  const nearestLabelPoint = closestPointOnRect(label.point, box);
  const displacement = Math.hypot(nearestLabelPoint.x - label.point.x, nearestLabelPoint.y - label.point.y);
  let score = ringRank * 1_000 + directionRank * 10 + gap + displacement * 2;
  markerObstacles.forEach((marker) => {
    if (marker.id === label.id) return;
    const area = overlapArea(box, marker.rect);
    if (area > 0) score += area * (marker.revealed ? 10_000 : 120);
  });
  controlRects.forEach((rect) => { score += overlapArea(box, rect) * 25_000; });
  if (leader) {
    markerObstacles.forEach((marker) => {
      if (marker.id !== label.id && segmentIntersectsRect(leader, marker.rect)) score += marker.revealed ? 100_000 : 2_000;
    });
    controlRects.forEach((rect) => { if (segmentIntersectsRect(leader, rect)) score += 100_000; });
    placed.forEach((placement) => {
      if (segmentIntersectsRect(leader, placement.box)) score += 1_000_000;
      if (placement.leader && segmentsIntersect(leader.start, leader.end, placement.leader.start, placement.leader.end)) {
        score += 500_000;
      }
    });
    if (label.role !== "capital" && capitalStarRect && segmentIntersectsRect(leader, capitalStarRect)) score += 10_000_000;
  }
  return score;
}

function createEdgeCandidates(label, viewport, inset, gap, threshold) {
  const width = Math.max(1, finite(label.width, 1));
  const height = Math.max(1, finite(label.height, 1));
  const step = Math.max(18, height + 6);
  const candidates = [];
  for (let y = inset; y <= viewport.height - inset - height; y += step) {
    candidates.push({ box: normalizeRect({ x: inset, y, width, height }), direction: "edge-left" });
    candidates.push({ box: normalizeRect({ x: viewport.width - inset - width, y, width, height }), direction: "edge-right" });
  }
  for (let x = inset; x <= viewport.width - inset - width; x += Math.max(24, width / 2)) {
    candidates.push({ box: normalizeRect({ x, y: inset, width, height }), direction: "edge-top" });
    candidates.push({ box: normalizeRect({ x, y: viewport.height - inset - height, width, height }), direction: "edge-bottom" });
  }
  return candidates.map((candidate, index) => ({
    ...candidate,
    gap,
    ringRank: candidateGaps.length,
    directionRank: index,
    leader: createLeader(label, candidate.box, gap, threshold)
  }));
}

export function layoutCapitalLocationFeedbackLabels({
  labels = [], markerObstacles = [], controlRects = [], viewport = {},
  viewportInset = DEFAULT_VIEWPORT_INSET_PX,
  labelGutter = DEFAULT_LABEL_GUTTER_PX,
  leaderGap = DEFAULT_LEADER_GAP_PX
} = {}) {
  const normalizedViewport = { width: Math.max(0, finite(viewport.width)), height: Math.max(0, finite(viewport.height)) };
  const orderedLabels = [...labels]
    .filter((label) => label?.id && Number.isFinite(label?.point?.x) && Number.isFinite(label?.point?.y))
    .sort((left, right) => {
      const priority = (label) => label.role === "capital" ? 0 : label.isSelected ? 1 : 2 + finite(label.choiceIndex);
      return priority(left) - priority(right) || String(left.id).localeCompare(String(right.id));
    });
  const normalizedMarkers = markerObstacles.map((marker) => ({ ...marker, rect: normalizeRect(marker.rect) }));
  const normalizedControls = controlRects.map(normalizeRect);
  const capital = orderedLabels.find(({ role }) => role === "capital");
  const capitalRadius = Math.max(DEFAULT_CAPITAL_RADIUS_PX, finite(capital?.markerRadius));
  const capitalStarRect = capital ? normalizeRect({
    x: capital.point.x - capitalRadius,
    y: capital.point.y - capitalRadius,
    width: capitalRadius * 2,
    height: capitalRadius * 2
  }) : null;
  const placements = [];

  orderedLabels.forEach((label) => {
    const candidates = candidateGaps.flatMap((gap, ringRank) => (
      directionOrder(label).map((direction, directionRank) => {
        const box = createCandidateBox(label, direction, gap);
        return { box, direction, gap, ringRank, directionRank, leader: createLeader(label, box, gap, leaderGap) };
      })
    ));
    const edgeGap = candidateGaps.at(-1) + 12;
    candidates.push(...createEdgeCandidates(label, normalizedViewport, viewportInset, edgeGap, leaderGap));
    const safeCandidates = candidates.filter(({ box, leader }) => {
      if (!rectInsideViewport(box, normalizedViewport, viewportInset)) return false;
      if (label.role !== "capital" && capitalStarRect && capitalLocationLabelRectsOverlap(box, capitalStarRect, 2)) return false;
      if (placements.some((placement) => capitalLocationLabelRectsOverlap(box, placement.box, labelGutter))) return false;
      if (leader && label.role !== "capital" && capitalStarRect && segmentIntersectsRect(leader, capitalStarRect)) return false;
      return true;
    });
    const considered = safeCandidates.length > 0 ? safeCandidates : candidates.filter(({ box }) => (
      rectInsideViewport(box, normalizedViewport, viewportInset)
      && (label.role === "capital" || !capitalStarRect || !capitalLocationLabelRectsOverlap(box, capitalStarRect, 2))
    ));
    const selected = considered
      .map((candidate) => ({ ...candidate, score: candidateScore(candidate, label, normalizedMarkers, normalizedControls, placements, capitalStarRect) }))
      .sort((left, right) => left.score - right.score || left.directionRank - right.directionRank)[0];
    if (!selected) return;
    placements.push({
      id: label.id,
      role: label.role,
      isSelected: Boolean(label.isSelected),
      point: { ...label.point },
      box: selected.box,
      direction: selected.direction,
      gapPx: selected.gap,
      score: selected.score,
      leader: selected.leader
    });
  });
  return { placements, capitalStarRect, viewport: normalizedViewport, leaderGap };
}

function markerRadiusAtZoom(zoom) {
  const value = finite(zoom, 3);
  if (value <= 3) return 4.5;
  if (value <= 7) return 4.5 + ((value - 3) / 4) * 2;
  if (value <= 10) return 6.5 + ((value - 7) / 3) * 1.5;
  return 8;
}

export class CapitalLocationFeedbackLabelOverlay {
  constructor({ map }) {
    this.map = map;
    this.container = map?.getContainer?.() || null;
    this.question = null;
    this.frameId = null;
    this.labelElements = new Map();
    this.layout = { placements: [], capitalStarRect: null, viewport: { width: 0, height: 0 }, leaderGap: DEFAULT_LEADER_GAP_PX };
    this.root = null;
    this.svg = null;
    this.labels = null;
    this.handleMove = () => this.scheduleLayout();
    this.handleRemove = () => this.destroy();
    this.createElements();
    this.map?.on?.("move", this.handleMove);
    this.map?.on?.("resize", this.handleMove);
    this.map?.on?.("remove", this.handleRemove);
  }

  createElements() {
    if (!this.container || typeof document === "undefined") return;
    this.root = document.createElement("div");
    this.root.className = "capital-location-feedback-label-overlay";
    this.root.setAttribute("aria-hidden", "true");
    this.root.hidden = true;
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.classList.add("capital-location-feedback-label-leaders");
    this.svg.setAttribute("aria-hidden", "true");
    this.labels = document.createElement("div");
    this.labels.className = "capital-location-feedback-labels";
    this.root.append(this.svg, this.labels);
    this.container.append(this.root);
  }

  sync(question) {
    this.question = question?.phase === "feedback" ? question : null;
    const revealed = (this.question?.choices || []).filter(({ revealLabel }) => revealLabel);
    if (!this.root || revealed.length === 0) {
      this.clear();
      return;
    }
    const signature = revealed.map(({ id, name, role, isSelected }) => `${id}:${name}:${role}:${isSelected}`).join("|");
    if (this.root.dataset.signature !== signature) {
      this.root.dataset.signature = signature;
      this.labels.replaceChildren();
      this.labelElements.clear();
      revealed.forEach((choice) => {
        const element = document.createElement("span");
        element.className = "capital-location-feedback-label";
        element.dataset.choiceId = choice.id;
        element.dataset.role = choice.role;
        element.dataset.selected = String(Boolean(choice.isSelected && choice.role !== "capital"));
        element.textContent = choice.name;
        this.labels.append(element);
        this.labelElements.set(choice.id, element);
      });
    }
    this.root.hidden = false;
    this.root.dataset.ready = "false";
    this.scheduleLayout();
    document.fonts?.ready?.then?.(() => this.scheduleLayout());
  }

  clear() {
    this.question = null;
    this.layout = { placements: [], capitalStarRect: null, viewport: { width: 0, height: 0 }, leaderGap: DEFAULT_LEADER_GAP_PX };
    if (this.frameId != null && typeof window !== "undefined") {
      window.cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    if (this.root) {
      this.root.hidden = true;
      this.root.dataset.ready = "false";
      this.root.dataset.signature = "";
    }
    this.svg?.replaceChildren();
    this.labels?.replaceChildren();
    this.labelElements.clear();
  }

  scheduleLayout() {
    if (!this.question || !this.root || this.frameId != null || typeof window === "undefined") return;
    this.frameId = window.requestAnimationFrame(() => {
      this.frameId = null;
      this.layoutNow();
    });
  }

  getControlRects(containerRect) {
    return [...(this.container?.querySelectorAll?.(".maplibregl-ctrl-group, .maplibregl-ctrl-attrib") || [])]
      .map((element) => element.getBoundingClientRect())
      .filter(({ width, height }) => width > 0 && height > 0)
      .map((rect) => normalizeRect({ x: rect.left - containerRect.left, y: rect.top - containerRect.top, width: rect.width, height: rect.height }));
  }

  layoutNow() {
    if (!this.question || !this.root || !this.map || !this.container) return;
    const containerRect = this.container.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) return;
    const revealedIds = new Set((this.question.choices || []).filter(({ revealLabel }) => revealLabel).map(({ id }) => id));
    const capitalId = this.question.targetId;
    const baseRadius = markerRadiusAtZoom(this.map.getZoom?.());
    const markerObstacles = (this.question.choices || []).map((choice) => {
      const point = this.map.project([choice.lon, choice.lat]);
      const radius = choice.id === capitalId && choice.revealCapital ? DEFAULT_CAPITAL_RADIUS_PX : baseRadius + 3;
      return {
        id: choice.id,
        revealed: revealedIds.has(choice.id),
        rect: normalizeRect({ x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2 })
      };
    });
    const labels = (this.question.choices || []).filter(({ revealLabel }) => revealLabel).map((choice) => {
      const measured = this.labelElements.get(choice.id)?.getBoundingClientRect?.() || { width: 1, height: 1 };
      return {
        ...choice,
        point: this.map.project([choice.lon, choice.lat]),
        width: Math.max(1, measured.width),
        height: Math.max(1, measured.height),
        markerRadius: choice.id === capitalId ? DEFAULT_CAPITAL_RADIUS_PX : baseRadius + 3
      };
    });
    this.layout = layoutCapitalLocationFeedbackLabels({
      labels,
      markerObstacles,
      controlRects: this.getControlRects(containerRect),
      viewport: { width: containerRect.width, height: containerRect.height }
    });
    this.layout.placements.forEach((placement) => {
      const element = this.labelElements.get(placement.id);
      if (!element) return;
      element.style.transform = `translate3d(${placement.box.x}px, ${placement.box.y}px, 0)`;
      element.dataset.direction = placement.direction;
      element.dataset.leader = String(Boolean(placement.leader));
    });
    this.renderLeaders(containerRect.width, containerRect.height);
    this.root.dataset.ready = "true";
  }

  renderLeaders(width, height) {
    if (!this.svg) return;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.replaceChildren();
    this.layout.placements.filter(({ leader }) => leader).forEach((placement) => {
      ["underlay", "line"].forEach((kind) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add("capital-location-feedback-leader", `capital-location-feedback-leader--${kind}`);
        line.dataset.choiceId = placement.id;
        line.setAttribute("x1", placement.leader.start.x);
        line.setAttribute("y1", placement.leader.start.y);
        line.setAttribute("x2", placement.leader.end.x);
        line.setAttribute("y2", placement.leader.end.y);
        this.svg.append(line);
      });
    });
  }

  getVisualState() {
    return {
      visible: Boolean(this.question && this.root && !this.root.hidden),
      ready: this.root?.dataset.ready === "true",
      placements: this.layout.placements.map((placement) => ({
        ...placement,
        point: { ...placement.point },
        box: { ...placement.box },
        leader: placement.leader ? { ...placement.leader, start: { ...placement.leader.start }, end: { ...placement.leader.end } } : null
      })),
      capitalStarRect: this.layout.capitalStarRect ? { ...this.layout.capitalStarRect } : null,
      viewport: { ...this.layout.viewport },
      leaderGap: this.layout.leaderGap
    };
  }

  destroy() {
    if (this.frameId != null && typeof window !== "undefined") window.cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.map?.off?.("move", this.handleMove);
    this.map?.off?.("resize", this.handleMove);
    this.map?.off?.("remove", this.handleRemove);
    this.root?.remove();
    this.root = null;
    this.svg = null;
    this.labels = null;
    this.labelElements.clear();
  }
}
