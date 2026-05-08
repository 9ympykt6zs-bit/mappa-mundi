export const studyModes = {
  cumulative: "cumulative",
  sectionOnly: "sectionOnly"
};

export class ActivitySession {
  constructor(activity, options = {}) {
    this.activityCatalog = options.activityCatalog || [activity];
    this.currentActivity = activity;
    this.studyMode = options.studyMode || studyModes.cumulative;
    this.completed = new Set();
    this.selectedAnswerId = null;
    this.visibleAnswerIds = [];
    this.rebuildAvailableTargets();
  }

  get activity() {
    return {
      ...this.currentActivity,
      targets: this.allAvailableTargets,
      answerBankItems: this.allAvailableTargets.map((target) => ({
        id: target.id,
        name: target.name
      }))
    };
  }

  get answerItems() {
    return this.visibleAnswerIds
      .map((id) => this.allAvailableTargets.find((item) => item.id === id))
      .filter(Boolean);
  }

  get completedIds() {
    return Array.from(this.completed);
  }

  get progressText() {
    return `${this.completed.size} / ${this.allAvailableTargets.length} complete`;
  }

  get selectedId() {
    return this.selectedAnswerId;
  }

  get visibleAnswerLimit() {
    return this.currentActivity.visibleAnswerLimit ?? 10;
  }

  setActivity(activity) {
    this.currentActivity = activity;
    return this.reset();
  }

  setStudyMode(studyMode) {
    if (this.studyMode === studyMode) {
      return {
        completedIds: this.completedIds,
        progressText: this.progressText
      };
    }

    this.studyMode = studyMode;
    return this.reset();
  }

  getFeature(id) {
    return this.allAvailableTargets.find((target) => target.id === id);
  }

  isCompleted(id) {
    return this.completed.has(id);
  }

  toggleAnswer(id) {
    if (this.completed.has(id)) {
      return {
        status: "completed",
        selectedId: this.selectedAnswerId
      };
    }

    if (this.selectedAnswerId === id) {
      this.selectedAnswerId = null;
      return {
        status: "cleared",
        selectedId: null
      };
    }

    this.selectedAnswerId = id;
    return {
      status: "selected",
      selectedId: id
    };
  }

  clearSelection() {
    this.selectedAnswerId = null;
  }

  tryAnswer(targetId) {
    if (!this.selectedAnswerId) {
      return {
        status: "no-selection"
      };
    }

    if (targetId !== this.selectedAnswerId) {
      return {
        status: "incorrect",
        selectedId: this.selectedAnswerId,
        targetId
      };
    }

    const completedId = this.selectedAnswerId;
    const feature = this.getFeature(completedId);
    this.completed.add(completedId);
    this.selectedAnswerId = null;
    this.refillVisibleAnswers();

    return {
      status: "correct",
      completedId,
      feature,
      completedIds: this.completedIds,
      progressText: this.progressText
    };
  }

  reset() {
    this.completed.clear();
    this.selectedAnswerId = null;
    this.rebuildAvailableTargets();

    return {
      completedIds: this.completedIds,
      progressText: this.progressText
    };
  }

  rebuildAvailableTargets() {
    this.allAvailableTargets = this.getTargetsForStudyMode();
    this.visibleAnswerIds = [];
    this.refillVisibleAnswers();
  }

  getTargetsForStudyMode() {
    if (this.studyMode === studyModes.sectionOnly || !this.currentActivity.cumulativeGroup) {
      return this.dedupeTargets(this.currentActivity.targets);
    }

    const sequence = Number(this.currentActivity.sequence);

    if (!Number.isFinite(sequence)) {
      return this.dedupeTargets(this.currentActivity.targets);
    }

    const cumulativeTargets = this.activityCatalog
      .filter((activity) => activity.cumulativeGroup === this.currentActivity.cumulativeGroup)
      .filter((activity) => Number.isFinite(Number(activity.sequence)))
      .filter((activity) => Number(activity.sequence) <= sequence)
      .sort((first, second) => Number(first.sequence) - Number(second.sequence))
      .flatMap((activity) => activity.targets);

    return this.dedupeTargets(cumulativeTargets);
  }

  dedupeTargets(targets) {
    const byId = new Map();

    targets.forEach((target) => {
      if (!byId.has(target.id)) {
        byId.set(target.id, target);
      }
    });

    return Array.from(byId.values());
  }

  refillVisibleAnswers() {
    this.visibleAnswerIds = this.visibleAnswerIds.filter((id) => !this.completed.has(id));

    while (this.visibleAnswerIds.length < this.visibleAnswerLimit) {
      const nextId = this.getRandomHiddenUnfinishedId();

      if (!nextId) {
        break;
      }

      this.visibleAnswerIds.push(nextId);
    }
  }

  getRandomHiddenUnfinishedId() {
    const hiddenUnfinishedIds = this.allAvailableTargets
      .map((target) => target.id)
      .filter((id) => !this.completed.has(id) && !this.visibleAnswerIds.includes(id));

    if (hiddenUnfinishedIds.length === 0) {
      return null;
    }

    return hiddenUnfinishedIds[Math.floor(Math.random() * hiddenUnfinishedIds.length)];
  }
}
