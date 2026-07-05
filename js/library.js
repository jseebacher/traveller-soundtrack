const VALID_INTENSITIES = [1, 2, 3];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip, handled by the following \n
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseMoods(raw) {
  return raw
    ? raw
        .split(";")
        .map((m) => m.trim())
        .filter(Boolean)
    : [];
}

function parseLibraryCSV(text) {
  const rows = parseCSV(text).filter((r) => r.length > 1 || r[0] !== "");
  const [header, ...dataRows] = rows;
  return dataRows.map((cols) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key.trim()] = (cols[i] ?? "").trim();
    });
    return {
      id: obj.id,
      category: obj.category,
      file: obj.file,
      name: obj.name,
      author: obj.author,
      intensity: obj.intensity ? Number(obj.intensity) : null,
      moods: parseMoods(obj.mood),
    };
  });
}

export async function loadLibrary(url = "data/library.csv") {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`failed to load library manifest: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return parseLibraryCSV(text);
}

export function validateLibrary(lib) {
  const seenIds = new Set();
  for (const entry of lib) {
    if (seenIds.has(entry.id)) {
      console.warn(`library: duplicate id "${entry.id}"`);
    }
    seenIds.add(entry.id);

    if (entry.category === "soundtrack-loop") {
      if (!VALID_INTENSITIES.includes(entry.intensity)) {
        console.warn(`library: soundtrack-loop "${entry.id}" must have an intensity of 1, 2, or 3, got "${entry.intensity}"`);
      }
      if (entry.moods.length < 1) {
        console.warn(`library: soundtrack-loop "${entry.id}" must have at least one mood`);
      }
    } else if (entry.category !== "fx-loop" && entry.category !== "fx") {
      console.warn(`library: entry "${entry.id}" has unknown category "${entry.category}"`);
    }
  }
}

export function findSoundtrackLoops(lib, intensity, mood) {
  return lib.filter(
    (e) => e.category === "soundtrack-loop" && e.intensity === intensity && e.moods.includes(mood)
  );
}

export function getAllFxLoops(lib) {
  return lib.filter((e) => e.category === "fx-loop");
}

export function getAllFx(lib) {
  return lib.filter((e) => e.category === "fx");
}

export function getAvailableMoods(lib) {
  const moods = new Set();
  for (const e of lib) {
    if (e.category !== "soundtrack-loop") continue;
    for (const m of e.moods) moods.add(m);
  }
  return [...moods].sort();
}
