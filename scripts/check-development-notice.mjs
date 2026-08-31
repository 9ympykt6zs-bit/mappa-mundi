import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  developmentNoticeStorageKey,
  isDevelopmentNoticeDismissed,
  rememberDevelopmentNoticeDismissal
} from "../src/development-notice.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

const storage = createStorage();
assert.equal(isDevelopmentNoticeDismissed(storage), false);
rememberDevelopmentNoticeDismissal(storage);
assert.equal(storage.getItem(developmentNoticeStorageKey), "true");
assert.equal(isDevelopmentNoticeDismissed(storage), true);

const source = readFileSync(new URL("../src/development-notice.js", import.meta.url), "utf8");
assert.match(source, /Mappa Mundi is currently in development\./);
assert.match(source, /The United States section is nearly complete/);
assert.match(source, /Dismiss development notice/);
assert.doesNotMatch(source, /aria-modal/);

for (const entryPoint of ["../index.html", "../maplibre-poc.html"]) {
  const html = readFileSync(new URL(entryPoint, import.meta.url), "utf8");
  assert.match(html, /src\/development-notice\.js/);
}

const css = readFileSync(new URL("../maplibre-poc.css", import.meta.url), "utf8");
assert.match(css, /\.development-notice\s*\{/);
assert.match(css, /@media \(max-width: 680px\)/);

console.log("Development notice checks passed.");
