# tech stack
- HTML
- css
- javascript

# audio loading strategy
Audio files are loaded lazily, on demand — never in bulk on page load.

- `data/library.csv` (the manifest) is fetched on startup; it's just metadata (id, category, file path, name, author, intensity, mood), not the audio itself. This is cheap regardless of how large the library gets.
- `js/audioEngine.js`'s `loadBuffer()` fetches and `decodeAudioData()`s a single soundfile the first time it's actually needed — soundtrack generation, "play", or an fx button — and caches the decoded `AudioBuffer` in memory (`bufferCache`, keyed by manifest id) for the rest of the session. Repeat plays of the same soundfile are instant.
- Concurrent requests for the same id are de-duplicated via `pendingLoads`, so clicking twice before a file finishes loading doesn't fetch it twice.
- `generate()`/`play()` await every buffer they need before touching the audio graph. A monotonic `busSeq` guard discards a stale in-flight load if a newer `generate()`/`play()`/`stop()` supersedes it while the fetch is still in flight (e.g. referee mashes "generate" a few times while the first pick is still downloading).
- `playOneShot()` reserves an fx-cap slot synchronously, before its buffer loads, so a burst of soundboard clicks during a slow first-time fetch can't exceed `MAX_ONE_SHOTS`.

This matters because the soundfile library (`audio/`) is expected to grow to many GBs as more CC-BY tracks are added. An earlier version of this app eagerly preloaded and decoded the entire library on page load, which made initial load time scale directly with total library size — a design flaw that would have made the site unusably slow to open once the library grew past a trivial size. Nothing should be added back that fetches or decodes more than what the referee is about to actually play.