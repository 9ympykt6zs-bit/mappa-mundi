function hashSeed(seed) {
  const value = typeof seed === "string" ? seed : JSON.stringify(seed);
  let hash = 2166136261;
  for (const character of String(value ?? "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveRandomSource(options = {}, fallback = Math.random) {
  if (typeof options?.random === "function") {
    return options.random;
  }
  if (Object.prototype.hasOwnProperty.call(options || {}, "seed")) {
    return createSeededRandom(options.seed);
  }
  return fallback;
}

export function resolveNow(options = {}, fallback = Date.now) {
  const value = typeof options?.now === "function" ? options.now() : undefined;
  const resolved = value === undefined ? fallback() : value;
  const date = resolved instanceof Date ? new Date(resolved.getTime()) : new Date(resolved);
  return Number.isNaN(date.getTime()) ? new Date(fallback()) : date;
}

export function buildSeededTieBreakers(items = [], options = {}) {
  if (typeof options?.random !== "function" && !Object.prototype.hasOwnProperty.call(options || {}, "seed")) {
    return null;
  }
  const random = resolveRandomSource(options);
  const ids = [...new Set(items.map((item) => String(item?.id || "")).filter(Boolean))].sort();
  return new Map(ids.map((id) => [id, random()]));
}
