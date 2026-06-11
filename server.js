/* Rihla — production server. Zero dependencies (Node >= 18).
   Serves the static site and a small lead-capture API:

     POST /api/leads        — accept a pilot request / family booking
     GET  /api/leads        — list leads (requires admin token)
     GET  /api/health       — liveness probe

   Leads persist to data/leads.json. Set RIHLA_ADMIN_TOKEN in production;
   the fallback token is for local development only.

     node server.js                      # http://localhost:3000
     PORT=8080 RIHLA_ADMIN_TOKEN=secret node server.js
*/

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");
const ADMIN_TOKEN = process.env.RIHLA_ADMIN_TOKEN || "rihla-dev";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

function readLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeLeads(leads) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

function sendJSON(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function isAuthorized(req, url) {
  const token = req.headers["x-admin-token"] || url.searchParams.get("token");
  return token === ADMIN_TOKEN;
}

function handleApi(req, res, url) {
  if (url.pathname === "/api/health") {
    return sendJSON(res, 200, { ok: true, leads: readLeads().length });
  }

  if (url.pathname === "/api/leads" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) req.destroy(); // refuse oversized payloads
    });
    req.on("end", () => {
      let lead;
      try {
        lead = JSON.parse(body);
      } catch (e) {
        return sendJSON(res, 400, { ok: false, error: "invalid JSON" });
      }
      if (!lead || typeof lead !== "object" || !lead.type || !lead.name || !lead.email) {
        return sendJSON(res, 400, { ok: false, error: "type, name and email are required" });
      }
      const leads = readLeads();
      const record = {
        id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        at: new Date().toISOString(),
      };
      // copy only plain string fields, capped, so the file stays sane
      for (const [k, v] of Object.entries(lead)) {
        if (typeof v === "string" && k.length <= 40) record[k] = v.slice(0, 2000);
      }
      leads.push(record);
      writeLeads(leads);
      console.log(`[lead] ${record.type} from ${record.name} <${record.email}> (${record.city || "?"})`);
      return sendJSON(res, 201, { ok: true, id: record.id });
    });
    return;
  }

  if (url.pathname === "/api/leads" && req.method === "GET") {
    if (!isAuthorized(req, url)) return sendJSON(res, 401, { ok: false, error: "unauthorized" });
    return sendJSON(res, 200, { ok: true, leads: readLeads() });
  }

  return sendJSON(res, 404, { ok: false, error: "not found" });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return res.end("<h1>404</h1><p><a href='/'>Back to Rihla</a></p>");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }
  return serveStatic(req, res, url);
});

server.listen(PORT, () => {
  console.log(`Rihla serving on http://localhost:${PORT}`);
  console.log(`Admin inbox: http://localhost:${PORT}/admin.html (token: ${ADMIN_TOKEN === "rihla-dev" ? "rihla-dev — set RIHLA_ADMIN_TOKEN in production" : "from env"})`);
});

module.exports = server;
