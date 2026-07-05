export function renderSoundboard(container, fxList, onTrigger) {
  container.innerHTML = "";
  for (const meta of fxList) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = meta.name;
    btn.dataset.fxId = meta.id;
    btn.addEventListener("click", () => onTrigger(meta));
    container.appendChild(btn);
  }
}

export function updateSoundboardCapState(container, activeCount, maxCount) {
  const atCap = activeCount >= maxCount;
  for (const btn of container.querySelectorAll("button")) {
    btn.disabled = atCap;
  }
}
