# Traveller Soundboard

A soundboard web app for running procedurally generated ambient soundtracks during Traveller (sci-fi TTRPG) sessions. See [concept.md](concept.md) for the full product spec.

## Running locally

This app uses native ES modules and the Web Audio API's `fetch()`/`decodeAudioData`, both of which require the files to be served over `http://` rather than opened directly via `file://`. No build step is involved — any static file server works:

```
node serve.js
# or, if your Node/Python versions are current:
npx serve .
python -m http.server
```

Then open the printed `http://localhost:...` URL on a phone or in a browser's mobile device emulator.

`serve.js` is a tiny zero-dependency static server (Node's built-in `http` module only) included specifically because `npx serve` requires a fairly recent Node and will fail with a cryptic `Unexpected token {` on older installs (e.g. Node 10). Run `node -v` — if it's below 14, either use `node serve.js` or upgrade Node.

## Adding a soundfile to the library

1. Drop the audio file into the matching folder: `audio/soundtrack-loops/`, `audio/fx-loops/`, or `audio/fx/`.
   - Use uncompressed WAV for anything in `soundtrack-loops/` or `fx-loops/` — MP3 encoder padding causes an audible click at the loop boundary even with the Web Audio API. One-shot files in `fx/` can be WAV or MP3.
2. Run `node scripts/prefill-library.js`. It scans all three folders, and for any audio file not yet listed in `data/library.csv` appends a row with `id`, `category`, and `file` filled in automatically (blank `name`, `author`, `intensity`, `mood`). Already-listed files are left untouched, so it's safe to re-run any time.
3. Open `data/library.csv` and fill in the blanks for each new row:
   - `name` and `author`: always required.
   - `soundtrack-loop`: also set `intensity` to `1`, `2`, or `3`, and `mood` to one or more moods separated by `;` (e.g. `mysterious;dangerous`).
   - `fx-loop` and `fx`: leave `intensity` and `mood` blank — these categories are picked directly by name, not by tag.
4. No code changes are needed — moods, fx loops, and soundboard buttons are all derived from the manifest at runtime.

Soundfiles are fetched and decoded lazily, on first actual use, not on page load — see [architecture.md](architecture.md#audio-loading-strategy). This means the library can grow arbitrarily large (many GBs of CC-BY tracks) without slowing down initial page load.

`js/library.js`'s `validateLibrary()` logs a console warning on startup if a `soundtrack-loop` entry is missing a valid `intensity` or `mood`.
