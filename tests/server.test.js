/* Integration test for server.js: boots the real server on a test port,
   exercises static serving and the lead API end to end. */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PORT = 3987;
const BASE = `http://127.0.0.1:${PORT}`;
const TOKEN = "test-token";
const LEADS_FILE = path.join(ROOT, "data", "leads.json");

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ✓ " + msg);
  else { console.log("  ✗ FAIL: " + msg); failures++; }
};

async function waitForServer(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(BASE + "/api/health");
      if (r.ok) return true;
    } catch (e) { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  return false;
}

(async () => {
  // start from a clean slate so assertions are deterministic
  if (fs.existsSync(LEADS_FILE)) fs.unlinkSync(LEADS_FILE);

  const server = spawn(process.execPath, [path.join(ROOT, "server.js")], {
    env: { ...process.env, PORT: String(PORT), RIHLA_ADMIN_TOKEN: TOKEN },
    stdio: "ignore",
  });

  try {
    console.log("\n— server.js —");
    ok(await waitForServer(), "server boots and answers /api/health");

    const home = await fetch(BASE + "/");
    ok(home.ok && (await home.text()).includes("Rihla"), "serves index.html at /");

    const arPage = await fetch(BASE + "/ar/families.html");
    ok(arPage.ok && (await arPage.text()).includes('dir="rtl"'), "serves Arabic pages");

    const css = await fetch(BASE + "/assets/css/styles.css");
    ok(css.ok && css.headers.get("content-type").includes("text/css"), "serves CSS with correct MIME type");

    const traversal = await fetch(BASE + "/..%2f..%2fetc%2fpasswd");
    ok(traversal.status === 403 || traversal.status === 404, "path traversal refused");

    const bad = await fetch(BASE + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pilot" }),
    });
    ok(bad.status === 400, "lead without name/email rejected");

    const good = await fetch(BASE + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "booking", name: "Khalid Haddad", email: "khalid@example.com", city: "Dubai", journeys: "مكة والحرم" }),
    });
    const created = await good.json();
    ok(good.status === 201 && created.ok && created.id, "valid lead accepted");

    const noAuth = await fetch(BASE + "/api/leads");
    ok(noAuth.status === 401, "lead list requires admin token");

    const list = await fetch(BASE + "/api/leads", { headers: { "x-admin-token": TOKEN } });
    const data = await list.json();
    ok(list.ok && data.leads.length === 1 && data.leads[0].name === "Khalid Haddad", "lead retrievable with token");
    ok(data.leads[0].journeys === "مكة والحرم", "arabic field round-trips intact");

    ok(fs.existsSync(LEADS_FILE), "lead persisted to data/leads.json");
  } finally {
    server.kill();
    if (fs.existsSync(LEADS_FILE)) fs.unlinkSync(LEADS_FILE);
  }

  console.log(failures === 0 ? "\nSERVER TESTS PASSED ✅" : `\n${failures} FAILURES ❌`);
  process.exit(failures === 0 ? 0 : 1);
})();
