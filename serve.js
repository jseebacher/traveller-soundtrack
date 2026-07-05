// Zero-dependency static file server for local development.
// Works on old Node versions where `npx serve` fails to parse its own dependencies.
// Usage: node serve.js [port]
const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.argv[2]) || 8080;
const root = process.cwd();

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".csv": "text/csv",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

http
  .createServer((req, res) => {
    let filePath = path.join(root, decodeURIComponent(req.url.split("?")[0]));
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, "index.html");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`serving ${root} at http://localhost:${port}`));
