export const developmentNoticeStorageKey = "mappaMundiDevelopmentNoticeDismissed";

export function isDevelopmentNoticeDismissed(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(developmentNoticeStorageKey) === "true";
  } catch {
    return false;
  }
}

export function rememberDevelopmentNoticeDismissal(storage = globalThis.localStorage) {
  try {
    storage?.setItem(developmentNoticeStorageKey, "true");
  } catch {
    // The notice can still be dismissed for this page when storage is unavailable.
  }
}

function appendTextWithStrongLead(documentRef, paragraph, strongText, remainingText) {
  const strong = documentRef.createElement("strong");
  strong.textContent = strongText;
  paragraph.append(strong, documentRef.createTextNode(remainingText));
}

export function mountDevelopmentNotice({
  documentRef = globalThis.document,
  storage = globalThis.localStorage
} = {}) {
  if (!documentRef || isDevelopmentNoticeDismissed(storage)) {
    return null;
  }

  const host = documentRef.querySelector(".launch-content");
  if (!host) {
    return null;
  }

  const existingNotice = host.querySelector("[data-development-notice]");
  if (existingNotice) {
    return existingNotice;
  }

  const notice = documentRef.createElement("aside");
  notice.className = "development-notice";
  notice.dataset.developmentNotice = "";
  notice.setAttribute("aria-labelledby", "development-notice-title");

  const copy = documentRef.createElement("div");
  copy.className = "development-notice-copy";

  const title = documentRef.createElement("p");
  title.id = "development-notice-title";
  title.className = "development-notice-title";
  title.textContent = "Mappa Mundi is currently in development.";

  const details = documentRef.createElement("p");
  details.textContent = "Some features may be incomplete, behave unexpectedly, or not work at all yet. Feel free to explore the site, try things out, and send us any feedback about what works, what doesn’t, or how we could make Mappa Mundi better.";

  const unitedStates = documentRef.createElement("p");
  appendTextWithStrongLead(
    documentRef,
    unitedStates,
    "The United States section is nearly complete",
    " and is the best example of our vision for how Mappa Mundi will eventually work across every region of the world."
  );

  const dismissButton = documentRef.createElement("button");
  dismissButton.className = "development-notice-dismiss";
  dismissButton.type = "button";
  dismissButton.textContent = "Dismiss";
  dismissButton.setAttribute("aria-label", "Dismiss development notice");
  dismissButton.addEventListener("click", () => {
    rememberDevelopmentNoticeDismissal(storage);
    notice.remove();
  });

  copy.append(title, details, unitedStates);
  notice.append(copy, dismissButton);
  host.append(notice);
  return notice;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountDevelopmentNotice(), { once: true });
  } else {
    mountDevelopmentNotice();
  }
}
