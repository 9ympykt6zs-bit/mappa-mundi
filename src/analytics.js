const appName = "Mappa Mundi";

export function trackEvent(eventName, params = {}) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", eventName, {
      app_name: appName,
      ...params
    });
  } catch {
    // Analytics must never interrupt the app if gtag is blocked or unavailable.
  }
}
