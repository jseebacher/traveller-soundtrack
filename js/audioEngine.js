const CROSSFADE_SECONDS = 5;
const STOP_RAMP_SECONDS = 0.03;
const MAX_ONE_SHOTS = 3;

let ctx = null;
let masterGain = null;
let busA = null;
let busB = null;
let oneShotBus = null;
let activeBus = null; // busA | busB | null
let bufferCache = new Map(); // id -> AudioBuffer, populated lazily on first use
let pendingLoads = new Map(); // id -> in-flight fetch+decode Promise<AudioBuffer>, dedupes concurrent requests
let busSeq = 0; // guards against a slow-loading generate()/play() overwriting a newer one that finished loading first
let activeOneShots = []; // [{ instanceId, meta, src }]
const listeners = new Map(); // eventName -> Set<fn>

function emit(eventName, payload) {
  const set = listeners.get(eventName);
  if (!set) return;
  for (const fn of set) fn(payload);
}

export function on(eventName, fn) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(fn);
  return () => listeners.get(eventName).delete(fn);
}

export function initAudioEngine() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 1;
  masterGain.connect(ctx.destination);

  busA = ctx.createGain();
  busA.gain.value = 0;
  busA.connect(masterGain);

  busB = ctx.createGain();
  busB.gain.value = 0;
  busB.connect(masterGain);

  oneShotBus = ctx.createGain();
  oneShotBus.gain.value = 1;
  oneShotBus.connect(masterGain);

  busA._sources = [];
  busB._sources = [];
  busA._meta = null; // { soundtrackLoop, fxLoops }
  busB._meta = null;
}

export function resume() {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}

async function loadBuffer(entry) {
  const cached = bufferCache.get(entry.id);
  if (cached) return cached;

  const pending = pendingLoads.get(entry.id);
  if (pending) return pending;

  const promise = (async () => {
    const res = await fetch(entry.file);
    if (!res.ok) throw new Error(`failed to fetch "${entry.file}": ${res.status} ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(entry.id, audioBuffer);
    return audioBuffer;
  })();

  pendingLoads.set(entry.id, promise);
  try {
    return await promise;
  } finally {
    pendingLoads.delete(entry.id);
  }
}

function stopBusSources(bus) {
  for (const src of bus._sources) {
    try {
      src.stop();
    } catch {
      // already stopped
    }
    src.disconnect();
  }
  bus._sources = [];
  bus._meta = null;
}

function buildLoopsOnBus(bus, soundtrackLoop, fxLoops, startTime) {
  // A rapid third generate() can reuse a bus that's still mid-fade-out from a
  // pending crossfade (its deferred cleanup hasn't fired yet) — stop it first
  // so old and new sources never play back simultaneously.
  stopBusSources(bus);

  const sources = [];

  const startLoop = (meta) => {
    const buffer = bufferCache.get(meta.id);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(bus);
    src.start(startTime);
    sources.push(src);
  };

  startLoop(soundtrackLoop);
  for (const fxLoop of fxLoops) {
    startLoop(fxLoop);
  }

  bus._sources = sources;
  bus._meta = { soundtrackLoop, fxLoops };
}

function busAudibleLoops(bus) {
  if (!bus || !bus._meta) return [];
  const { soundtrackLoop, fxLoops } = bus._meta;
  return [soundtrackLoop, ...fxLoops].map((m) => ({ name: m.name, author: m.author }));
}

function currentAudibleLoops() {
  const loops = [...busAudibleLoops(busA), ...busAudibleLoops(busB)];
  return loops;
}

export async function generate(soundtrackLoop, fxLoops) {
  const seq = ++busSeq;
  await Promise.all([loadBuffer(soundtrackLoop), ...fxLoops.map(loadBuffer)]);
  if (seq !== busSeq) return; // superseded by a newer generate()/play() while this one was still loading

  const now = ctx.currentTime;
  const incomingBus = activeBus === busA ? busB : busA;
  const outgoingBus = activeBus;

  buildLoopsOnBus(incomingBus, soundtrackLoop, fxLoops, now);

  if (outgoingBus) {
    const outVal = outgoingBus.gain.value;
    outgoingBus.gain.cancelScheduledValues(now);
    outgoingBus.gain.setValueAtTime(outVal, now);
    outgoingBus.gain.linearRampToValueAtTime(0, now + CROSSFADE_SECONDS);

    incomingBus.gain.cancelScheduledValues(now);
    incomingBus.gain.setValueAtTime(0, now);
    incomingBus.gain.linearRampToValueAtTime(1, now + CROSSFADE_SECONDS);

    const busToClear = outgoingBus;
    setTimeout(() => {
      if (busToClear !== activeBus) {
        stopBusSources(busToClear);
        emit("soundtrackChanged", { audibleLoops: currentAudibleLoops() });
      }
    }, CROSSFADE_SECONDS * 1000 + 50);
  } else {
    incomingBus.gain.cancelScheduledValues(now);
    incomingBus.gain.setValueAtTime(1, now);
  }

  activeBus = incomingBus;
  emit("soundtrackChanged", { audibleLoops: currentAudibleLoops() });
}

export function stop() {
  ++busSeq; // cancel any in-flight generate()/play() so it can't resurrect playback once its audio finishes loading
  if (!activeBus) return;
  const now = ctx.currentTime;
  const bus = activeBus;
  const currentVal = bus.gain.value;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(currentVal, now);
  bus.gain.linearRampToValueAtTime(0, now + STOP_RAMP_SECONDS);
  setTimeout(() => stopBusSources(bus), STOP_RAMP_SECONDS * 1000 + 20);
  activeBus = null;
  emit("soundtrackChanged", { audibleLoops: [] });
}

export async function play(selection) {
  if (!selection) return;
  const seq = ++busSeq;
  await Promise.all([loadBuffer(selection.soundtrackLoop), ...selection.fxLoops.map(loadBuffer)]);
  if (seq !== busSeq) return; // superseded by a newer generate()/play() while this one was still loading

  const now = ctx.currentTime;
  const bus = activeBus || busA;
  buildLoopsOnBus(bus, selection.soundtrackLoop, selection.fxLoops, now);
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(1, now);
  activeBus = bus;
  emit("soundtrackChanged", { audibleLoops: currentAudibleLoops() });
}

export async function playOneShot(meta) {
  if (activeOneShots.length >= MAX_ONE_SHOTS) return;

  // reserve a slot before the async load so a burst of clicks during the fetch can't exceed MAX_ONE_SHOTS
  const instanceId = `${meta.id}-${ctx.currentTime}-${activeOneShots.length}`;
  const reservation = { instanceId, meta, src: null };
  activeOneShots.push(reservation);

  let buffer;
  try {
    buffer = await loadBuffer(meta);
  } catch (err) {
    activeOneShots = activeOneShots.filter((o) => o.instanceId !== instanceId);
    console.error(`cannot play "${meta.name}" (${meta.id}):`, err);
    return;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = false;
  src.connect(oneShotBus);
  reservation.src = src;

  src.onended = () => {
    activeOneShots = activeOneShots.filter((o) => o.instanceId !== instanceId);
    src.disconnect();
    emit("oneShotEnded", { instanceId });
  };

  src.start(0);
  emit("oneShotStarted", { instanceId, name: meta.name, author: meta.author });
}

export function getActiveOneShotCount() {
  return activeOneShots.length;
}
