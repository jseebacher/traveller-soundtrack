#!/usr/bin/env node
// Scans audio/soundtrack-loops, audio/fx-loops, audio/fx for files not yet listed
// in data/library.csv and appends a prefilled row for each: id, category, and
// file are derived automatically; name, author, intensity, and mood are left
// blank for the developer to fill in by hand.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data", "library.csv");
const AUDIO_ROOT = path.join(ROOT, "audio");

const CATEGORY_BY_DIR = {
  "soundtrack-loops": "soundtrack-loop",
  "fx-loops": "fx-loop",
  fx: "fx",
};

const AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".opus", ".ogg", ".aiff", ".aif", ".flac", ".m4a"]);

const HEADER = ["id", "category", "file", "name", "author", "intensity", "mood"];

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

function csvField(value) {
  const str = value ?? "";
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function slugify(filename) {
  const base = path.basename(filename, path.extname(filename));
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function listAudioFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort();
}

function main() {
  const csvText = fs.existsSync(CSV_PATH) ? fs.readFileSync(CSV_PATH, "utf8") : HEADER.join(",") + "\n";
  const allRows = parseCSV(csvText).filter((r) => r.length > 1 || r[0] !== "");
  const [header, ...dataRows] = allRows;
  const fileCol = header.indexOf("file");
  const idCol = header.indexOf("id");

  const existingFiles = new Set(dataRows.map((r) => (r[fileCol] || "").trim()));
  const existingIds = new Set(dataRows.map((r) => (r[idCol] || "").trim()));

  const newRows = [];

  for (const [dirName, category] of Object.entries(CATEGORY_BY_DIR)) {
    const dirPath = path.join(AUDIO_ROOT, dirName);
    for (const filename of listAudioFiles(dirPath)) {
      const relFile = `audio/${dirName}/${filename}`;
      if (existingFiles.has(relFile)) continue;

      let id = slugify(filename) || category;
      let suffix = 2;
      while (existingIds.has(id)) {
        id = `${slugify(filename) || category}-${suffix++}`;
      }
      existingIds.add(id);
      existingFiles.add(relFile);

      const row = { id, category, file: relFile, name: "", author: "", intensity: "", mood: "" };
      newRows.push(header.map((col) => csvField(row[col] ?? "")));
    }
  }

  if (newRows.length === 0) {
    console.log("No new audio files found. Library is up to date.");
    return;
  }

  const needsTrailingNewline = csvText.length > 0 && !csvText.endsWith("\n");
  const appended = (needsTrailingNewline ? "\n" : "") + newRows.map((r) => r.join(",")).join("\n") + "\n";
  fs.appendFileSync(CSV_PATH, appended);

  console.log(`Added ${newRows.length} new row(s) to data/library.csv:`);
  for (const r of newRows) {
    console.log(`  ${r[idCol]} (${r[header.indexOf("category")]})`);
  }
  console.log("\nFill in name, author, intensity (soundtrack-loop only), and mood (soundtrack-loop only) for each new row.");
}

main();
