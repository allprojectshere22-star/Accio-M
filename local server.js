const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function getLocalAddresses() {
  const nets = os.networkInterfaces();
  const addresses = [];

  for (const net of Object.values(nets)) {
    for (const entry of net || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": mimeType });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestPath = request.url === "/" ? "index.html" : decodeURIComponent(request.url.split("?")[0]);
  const normalizedPath = path
    .normalize(requestPath)
    .replace(/^([/\\])+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, normalizedPath);

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(response, filePath);
});

server.listen(PORT, "0.0.0.0", () => {
  const addresses = getLocalAddresses();
  console.log(`Expense app running on http://localhost:${PORT}`);
  for (const address of addresses) {
    console.log(`Phone access: http://${address}:${PORT}`);
  }
});
