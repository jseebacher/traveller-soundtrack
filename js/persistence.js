const STORAGE_KEY = "traveller-soundboard:params";

export function loadPersistedParams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      intensity: parsed.intensity ?? null,
      mood: parsed.mood ?? null,
      fxLoopIds: Array.isArray(parsed.fxLoopIds) ? parsed.fxLoopIds : null,
    };
  } catch {
    return null;
  }
}

export function persistParams(params) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // storage unavailable (private browsing, quota) — silently ignore, non-critical
  }
}
