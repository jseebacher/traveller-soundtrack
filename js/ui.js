export function renderIntensityPicker(container, selected, onChange) {
  container.innerHTML = '<legend>intensity</legend>';
  for (const value of [1, 2, 3]) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "intensity";
    input.value = String(value);
    input.checked = selected === value;
    input.addEventListener("change", () => onChange(value));
    label.append(input, ` ${value}`);
    container.appendChild(label);
  }
}

export function renderMoodPicker(container, moods, selected, onChange) {
  container.innerHTML = '<legend>mood</legend>';
  for (const mood of moods) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "mood";
    input.value = mood;
    input.checked = selected === mood;
    input.addEventListener("change", () => onChange(mood));
    label.append(input, ` ${mood}`);
    container.appendChild(label);
  }
}

export function renderFxLoopPicker(container, fxLoops, selectedIds, onChange) {
  container.innerHTML = '<legend>fx loops</legend>';
  for (const loop of fxLoops) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "fxLoopId";
    input.value = loop.id;
    input.checked = (selectedIds ?? []).includes(loop.id);
    input.addEventListener("change", () => {
      const checked = [...container.querySelectorAll('input[name="fxLoopId"]:checked')].map((i) => i.value);
      onChange(checked);
    });
    label.append(input, ` ${loop.name}`);
    container.appendChild(label);
  }
}

export function wireTransport({ generateBtn, stopBtn, playBtn }, { onGenerate, onStop, onPlay }) {
  generateBtn.addEventListener("click", onGenerate);
  stopBtn.addEventListener("click", onStop);
  playBtn.addEventListener("click", onPlay);
}

export function setPlayButtonEnabled(playBtn, enabled) {
  playBtn.disabled = !enabled;
}
