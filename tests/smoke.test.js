/* Functional smoke test for the Rihla site: loads each page in jsdom,
   executes scripts natively, and drives the filters and both lead forms. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ✓ " + msg);
  else { console.log("  ✗ FAIL: " + msg); failures++; }
};

// Shared localStorage across "page loads" to simulate one browser.
const storage = new Map();
function makeStorage() {
  return {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  };
}

async function loadPage(file, query) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const errors = [];
  const dom = new JSDOM(html, {
    url: "file://" + path.join(ROOT, file) + (query || ""),
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    beforeParse(window) {
      Object.defineProperty(window, "localStorage", { value: makeStorage() });
      window.scrollTo = () => {};
      window.addEventListener("error", (e) => errors.push(e.message || String(e.error)));
    },
  });
  await new Promise((res) => {
    dom.window.addEventListener("load", res);
    setTimeout(res, 3000);
  });
  return { dom, errors };
}

(async () => {

console.log("\n— index.html —");
{
  const { dom, errors } = await loadPage("index.html");
  ok(errors.length === 0, "no script errors " + (errors[0] || ""));
  const d = dom.window.document;
  ok(d.querySelectorAll("#evidenceGrid .card").length === 4, "4 evidence cards rendered");
  ok(d.querySelectorAll("#homeExpGrid .track-card").length === 3, "3 featured journeys rendered");
  ok(d.body.textContent.includes("Makkah & the Haram"), "sacred journey featured");
  ok(d.body.textContent.includes("never as a substitute for pilgrimage"), "religious framing present on landing");
  ok(d.querySelector('a[href="hospitals.html"]') && d.querySelector('a[href="families.html"]'), "both doors linked");
}

console.log("\n— experiences.html —");
{
  const { dom, errors } = await loadPage("experiences.html");
  ok(errors.length === 0, "no script errors " + (errors[0] || ""));
  const d = dom.window.document;
  ok(d.querySelectorAll("#expGrid .track-card").length === 15, "all 15 journeys rendered");
  const chips = [...d.querySelectorAll("#categoryBar .chip")];
  chips.find((c) => c.textContent === "Sacred journeys").click();
  ok(d.querySelectorAll("#expGrid .track-card").length === 3, "category filter -> 3 sacred journeys");
  const search = d.getElementById("expSearch");
  search.value = "makkah";
  search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  ok(d.querySelectorAll("#expGrid .track-card").length === 2, "search 'makkah' within filter -> 2 journeys (name + blurb match)");
}

console.log("\n— experiences.html?cat= preselect —");
{
  const { dom } = await loadPage("experiences.html", "?cat=Bespoke%20memories");
  const d = dom.window.document;
  ok(d.querySelectorAll("#expGrid .track-card").length === 2, "?cat=Bespoke memories -> 2 journeys");
  const active = d.querySelector("#categoryBar .chip.active");
  ok(active && active.textContent === "Bespoke memories", "category chip preselected from URL");
}

console.log("\n— hospitals.html (pilot form) —");
{
  const { dom, errors } = await loadPage("hospitals.html");
  ok(errors.length === 0, "no script errors " + (errors[0] || ""));
  const d = dom.window.document;
  ok(d.querySelectorAll("#evidenceGrid .card").length === 4, "evidence cards with citations rendered");
  ok(d.querySelectorAll("#evidenceGrid a[href*='ncbi']").length >= 2, "evidence links to real studies");
  ok(d.querySelectorAll("#programGrid .price-card").length === 3, "3 program tiers rendered");
  ok(d.body.textContent.includes("From $1,250"), "ward subscription pricing shown");

  const form = d.getElementById("pilotForm");
  const submit = () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  submit();
  ok(d.getElementById("pilotConfirm").style.display !== "block", "empty pilot form blocked");
  ok(d.querySelectorAll("#pilotForm .field.error").length >= 4, "required fields marked with errors");

  d.getElementById("pName").value = "Dr. Sara Al-Mutairi";
  d.getElementById("pHospital").value = "Al Noor Specialist Hospital";
  d.getElementById("pCity").value = "Riyadh";
  d.getElementById("pEmail").value = "sara@alnoor.example";
  submit();
  ok(d.getElementById("pilotConfirm").style.display === "block", "valid pilot form -> confirmation shown");
  ok(form.style.display === "none", "form hidden after submission");
  const leads = JSON.parse(storage.get("rihla_leads"));
  ok(leads.length === 1 && leads[0].type === "pilot" && leads[0].hospital === "Al Noor Specialist Hospital", "pilot lead persisted with fields");
}

console.log("\n— families.html (booking form + religious framing) —");
{
  const { dom, errors } = await loadPage("families.html", "?exp=makkah");
  ok(errors.length === 0, "no script errors " + (errors[0] || ""));
  const d = dom.window.document;
  ok(d.body.textContent.includes("does not replace or fulfil any religious obligation"), "religious disclaimer present");
  ok(d.querySelectorAll("#packageGrid .price-card").length === 3, "3 family packages rendered");
  ok(d.getElementById("bJourneys").value === "Makkah & the Haram", "?exp=makkah prefills journey field");

  const form = d.getElementById("bookingForm");
  const submit = () => form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
  submit();
  ok(d.getElementById("bookingConfirm").style.display !== "block", "empty booking form blocked");

  d.getElementById("bName").value = "Khalid Haddad";
  d.getElementById("bEmail").value = "not-an-email";
  d.getElementById("bCity").value = "Dubai";
  submit();
  ok(d.getElementById("bookingConfirm").style.display !== "block", "invalid email blocked");

  d.getElementById("bEmail").value = "khalid@example.com";
  submit();
  ok(d.getElementById("bookingConfirm").style.display === "block", "valid booking -> confirmation shown");
  const leads = JSON.parse(storage.get("rihla_leads"));
  ok(leads.length === 2 && leads[1].type === "booking" && leads[1].journeys === "Makkah & the Haram", "booking lead persisted with prefilled journey");
}

console.log(failures === 0 ? "\nALL TESTS PASSED ✅" : `\n${failures} FAILURES ❌`);
process.exit(failures === 0 ? 0 : 1);
})();
