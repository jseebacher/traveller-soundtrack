import { findSoundtrackLoops, getAllFxLoops, getAvailableMoods } from "./library.js";

function pickRandom(arr) {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

// intensity -> number of fx loops to auto-pick when randomizing an undefined selection
const FX_LOOP_COUNT_BY_INTENSITY = { 1: 2, 2: 1, 3: 0 };

export function buildSelection(lib, params) {
  const candidates = findSoundtrackLoops(lib, params.intensity, params.mood);
  const soundtrackLoop = pickRandom(candidates);
  if (!soundtrackLoop) {
    return null;
  }

  const fxLoopsById = new Map(getAllFxLoops(lib).map((e) => [e.id, e]));
  const fxLoops = [];
  for (const id of params.fxLoopIds) {
    const fxLoop = fxLoopsById.get(id);
    if (fxLoop) fxLoops.push(fxLoop);
  }

  return { soundtrackLoop, fxLoops };
}

export function randomizeParams(lib, currentParams) {
  const params = {
    intensity: currentParams.intensity,
    mood: currentParams.mood,
    fxLoopIds: currentParams.fxLoopIds,
  };

  if (params.intensity === null || params.intensity === undefined) {
    params.intensity = pickRandom([1, 2, 3]);
  }

  if (params.mood === null || params.mood === undefined) {
    params.mood = pickRandom(getAvailableMoods(lib));
  }

  if (params.fxLoopIds === null || params.fxLoopIds === undefined) {
    const count = FX_LOOP_COUNT_BY_INTENSITY[params.intensity] ?? 0;
    const available = getAllFxLoops(lib).map((e) => e.id);
    const chosen = [];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      chosen.push(available.splice(idx, 1)[0]);
    }
    params.fxLoopIds = chosen;
  }

  return params;
}
