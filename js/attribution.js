export function renderAttribution(container, audibleLoops, activeOneShots) {
  const rows = [...audibleLoops, ...activeOneShots];

  if (rows.length === 0) {
    container.innerHTML = '<p class="attribution-empty">nothing playing</p>';
    return;
  }

  container.innerHTML = "";
  for (const row of rows) {
    const el = document.createElement("div");
    el.className = "attribution-row";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = row.name;

    const author = document.createElement("span");
    author.className = "author";
    author.textContent = row.author;

    el.append(name, author);
    container.appendChild(el);
  }
}
