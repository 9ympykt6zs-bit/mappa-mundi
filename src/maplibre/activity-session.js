export class ActivitySession {
  constructor(activity) {
    this.activity = activity;
    this.completed = new Set();
    this.selectedAnswerId = null;
    this.visibleAnswerIds = [];
    this.refillVisibleAnswers();
  }

  get answerItems() {
    const answerItems = this.activity.answerBankItems || this.activity.targets;

    if (!this.hasRollingAnswerBank()) {
      return answerItems;
    }

    return this.visibleAnswerIds
      .map((id) => answerItems.find((item) => item.id === id))
      .filter(Boolean);
  }

  get completedIds() {
    return Array.from(this.completed);
  }

  get progressText() {
    return `${this.completed.size} of ${this.activity.targets.length} completed`;
  }

  get selectedId() {
    return this.selectedAnswerId;
  }

  getFeature(id) {
    return this.activity.targets.find((target) => target.id === id);
  }

  isCompleted(id) {
    return this.completed.has(id);
  }

  hasRollingAnswerBank() {
    return Number.isFinite(this.activity.visibleAnswerLimit)
      && this.activity.visibleAnswerLimit > 0
      && this.activity.visibleAnswerLimit < this.activity.targets.length;
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
    this.visibleAnswerIds = [];
    this.refillVisibleAnswers();

    return {
      completedIds: this.completedIds,
      progressText: this.progressText
    };
  }

  refillVisibleAnswers() {
    if (!this.hasRollingAnswerBank()) {
      this.visibleAnswerIds = [];
      return;
    }

    this.visibleAnswerIds = this.visibleAnswerIds.filter((id) => !this.completed.has(id));

    while (this.visibleAnswerIds.length < this.activity.visibleAnswerLimit) {
      const nextId = this.getRandomHiddenUnfinishedId();

      if (!nextId) {
        break;
      }

      this.visibleAnswerIds.push(nextId);
    }
  }

  getRandomHiddenUnfinishedId() {
    const hiddenUnfinishedIds = this.activity.targets
      .map((target) => target.id)
      .filter((id) => !this.completed.has(id) && !this.visibleAnswerIds.includes(id));

    if (hiddenUnfinishedIds.length === 0) {
      return null;
    }

    return hiddenUnfinishedIds[Math.floor(Math.random() * hiddenUnfinishedIds.length)];
  }
}
