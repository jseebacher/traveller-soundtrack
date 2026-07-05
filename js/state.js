const state = {
  params: { intensity: null, mood: null, fxLoopIds: null }, // fxLoopIds: null = unset (randomize); [] = referee explicitly chose none
  currentSelection: null, // { soundtrackLoop, fxLoops } — last generate()/randomize result
  isPlaying: false,
  audibleLoops: [], // [{ name, author }]
  activeOneShots: [], // [{ instanceId, name, author }]
};

const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(state);
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setParams(partial) {
  Object.assign(state.params, partial);
  notify();
}

export function setSelection(selection) {
  state.currentSelection = selection;
  notify();
}

export function setPlaying(value) {
  state.isPlaying = value;
  notify();
}

export function setAudibleLoops(list) {
  state.audibleLoops = list;
  notify();
}

export function addOneShot(entry) {
  state.activeOneShots.push(entry);
  notify();
}

export function removeOneShot(instanceId) {
  state.activeOneShots = state.activeOneShots.filter((o) => o.instanceId !== instanceId);
  notify();
}
