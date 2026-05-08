export class ActivitySession {
  constructor(activity) {
    this.activity = activity;
    this.completed = new Set();
    this.selectedAnswerId = null;
  }

  get answerItems() {
    return this.activity.answerBankItems || this.activity.targets;
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

    return {
      completedIds: this.completedIds,
      progressText: this.progressText
    };
  }
}
