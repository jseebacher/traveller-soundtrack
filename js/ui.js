export function renderIntensityPicker(container, selected, onChange) {
  container.innerHTML = '<legend>intensity</legend>';
  for (const value of [1, 2, 3]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(value);
    button.classList.toggle("selected", selected === value);
    button.addEventListener("click", () => onChange(selected === value ? null : value));
    container.appendChild(button);
  }
}

export function renderMoodPicker(container, moods, selected, onChange) {
  container.innerHTML = '<legend>mood</legend>';
  for (const mood of moods) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = mood;
    button.classList.toggle("selected", selected === mood);
    button.addEventListener("click", () => onChange(selected === mood ? null : mood));
    container.appendChild(button);
  }
}

export function renderFxLoopPicker(container, fxLoops, selectedIds, onChange) {
  container.innerHTML = '<legend>fx loops</legend>';
  const selected = new Set(selectedIds ?? []);
  for (const loop of fxLoops) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = loop.name;
    button.classList.toggle("selected", selected.has(loop.id));
    button.addEventListener("click", () => {
      const next = new Set(selected);
      if (next.has(loop.id)) {
        next.delete(loop.id);
      } else {
        next.add(loop.id);
      }
      onChange([...next]);
    });
    container.appendChild(button);
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
