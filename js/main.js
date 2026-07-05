import { loadLibrary, validateLibrary, getAllFx, getAllFxLoops, getAvailableMoods } from "./library.js";
import { buildSelection, randomizeParams } from "./soundtrackGenerator.js";
import * as engine from "./audioEngine.js";
import * as state from "./state.js";
import { loadPersistedParams, persistParams } from "./persistence.js";
import { renderSoundboard, updateSoundboardCapState } from "./soundboard.js";
import { renderAttribution } from "./attribution.js";
import {
  renderIntensityPicker,
  renderMoodPicker,
  renderFxLoopPicker,
  wireTransport,
  setPlayButtonEnabled,
} from "./ui.js";

const MAX_ONE_SHOTS = 3;
const TRANSIENT_MESSAGE_MS = 3000;

const attributionEl = document.getElementById("attribution");
const soundboardEl = document.getElementById("soundboard");
const paramsEl = document.getElementById("params");
const intensityPickerEl = document.getElementById("intensity-picker");
const moodPickerEl = document.getElementById("mood-picker");
const fxLoopPickerEl = document.getElementById("fxloop-picker");
const generateBtn = document.getElementById("btn-generate");
const stopBtn = document.getElementById("btn-stop");
const playBtn = document.getElementById("btn-play");

let lib = [];
let audioLoading = false; // true while generate()/play() is fetching+decoding the audio it needs
let transientMessage = null;
let transientMessageTimer = null;

function showTransientMessage(text) {
  transientMessage = text;
  render();
  clearTimeout(transientMessageTimer);
  transientMessageTimer = setTimeout(() => {
    transientMessage = null;
    render();
  }, TRANSIENT_MESSAGE_MS);
}

function render() {
  const s = state.getState();
  if (audioLoading) {
    attributionEl.innerHTML = '<p class="attribution-empty">loading soundtrack&hellip;</p>';
  } else if (transientMessage) {
    attributionEl.innerHTML = `<p class="attribution-empty">${transientMessage}</p>`;
  } else {
    renderAttribution(attributionEl, s.audibleLoops, s.activeOneShots);
  }
  generateBtn.disabled = audioLoading;
  setPlayButtonEnabled(playBtn, !audioLoading && s.currentSelection !== null);
  updateSoundboardCapState(soundboardEl, s.activeOneShots.length, MAX_ONE_SHOTS);
}

function renderPickers() {
  const { params } = state.getState();
  renderIntensityPicker(intensityPickerEl, params.intensity, (value) => {
    state.setParams({ intensity: value });
    persistParams(state.getState().params);
    renderPickers();
  });
  renderMoodPicker(moodPickerEl, getAvailableMoods(lib), params.mood, (value) => {
    state.setParams({ mood: value });
    persistParams(state.getState().params);
    renderPickers();
  });
  renderFxLoopPicker(fxLoopPickerEl, getAllFxLoops(lib), params.fxLoopIds, (values) => {
    state.setParams({ fxLoopIds: values });
    persistParams(state.getState().params);
    renderPickers();
  });
}

async function runGenerate(rawParams) {
  if (audioLoading) return;

  // any parameter the referee hasn't set is filled in randomly, per spec's randomize rules
  const params = randomizeParams(lib, rawParams);
  state.setParams(params);
  persistParams(state.getState().params);
  renderPickers();

  const selection = buildSelection(lib, params);
  if (!selection) {
    showTransientMessage("no soundtrack loop found for this combination");
    return;
  }
  state.setSelection(selection);

  audioLoading = true;
  render();
  try {
    await engine.generate(selection.soundtrackLoop, selection.fxLoops);
    state.setPlaying(true);
  } catch (err) {
    console.error("failed to generate soundtrack", err);
    showTransientMessage("failed to load soundtrack audio");
  } finally {
    audioLoading = false;
    render();
  }
}

async function main() {
  lib = await loadLibrary();
  validateLibrary(lib);

  engine.initAudioEngine();

  engine.on("soundtrackChanged", ({ audibleLoops }) => state.setAudibleLoops(audibleLoops));
  engine.on("oneShotStarted", ({ instanceId, name, author }) => state.addOneShot({ instanceId, name, author }));
  engine.on("oneShotEnded", ({ instanceId }) => state.removeOneShot(instanceId));

  const persisted = loadPersistedParams();
  if (persisted) state.setParams(persisted);

  renderPickers();
  paramsEl.addEventListener("toggle", () => {
    document.body.classList.toggle("params-open", paramsEl.open);
  });
  renderSoundboard(soundboardEl, getAllFx(lib), (meta) => {
    engine.resume();
    engine.playOneShot(meta).catch((err) => console.error("failed to play fx", err));
  });

  wireTransport(
    { generateBtn, stopBtn, playBtn },
    {
      onGenerate: () => {
        engine.resume();
        runGenerate(state.getState().params);
      },
      onStop: () => {
        engine.resume();
        engine.stop();
        state.setPlaying(false);
      },
      onPlay: () => {
        engine.resume();
        const { currentSelection } = state.getState();
        if (!currentSelection || audioLoading) return;

        audioLoading = true;
        render();
        engine
          .play(currentSelection)
          .then(() => state.setPlaying(true))
          .catch((err) => {
            console.error("failed to play soundtrack", err);
            showTransientMessage("failed to load soundtrack audio");
          })
          .finally(() => {
            audioLoading = false;
            render();
          });
      },
    }
  );

  state.subscribe(render);
  render();
}

main().catch((err) => {
  console.error("failed to start app", err);
});
