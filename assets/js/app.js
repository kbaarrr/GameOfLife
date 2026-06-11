/* Rihla — shared client runtime.
   Leads (pilot requests, family bookings) persist in localStorage behind a
   small store facade; replacing these methods with fetch() calls is the
   entire backend migration. */

const RihlaStore = {
  KEY_LEADS: "rihla_leads",

  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  _write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  leads() {
    return this._read(this.KEY_LEADS, []);
  },

  saveLead(lead) {
    const leads = this.leads();
    lead.id = "L" + Date.now().toString(36);
    lead.at = new Date().toISOString();
    leads.push(lead);
    this._write(this.KEY_LEADS, leads);
    return lead;
  },

  // Free-tier hosting (e.g. GitHub Pages + Formspree): paste your Formspree
  // endpoint here and every lead is emailed to you — no server needed.
  // Example: LEAD_ENDPOINT = "https://formspree.io/f/your-form-id"
  LEAD_ENDPOINT: "https://formspree.io/f/xgobnvko",

  // Delivery order: Formspree endpoint if configured, else the server.js
  // API, else localStorage — so no lead is ever lost on any hosting.
  submitLead(lead) {
    if (typeof fetch !== "function") return this.saveLead(lead);
    const url = this.LEAD_ENDPOINT || "/api/leads";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    })
      .then((r) => {
        if (!r.ok) throw new Error("api " + r.status);
      })
      .catch(() => this.saveLead(lead));
    return lead;
  },
};

const RihlaUI = {
  esc(s) {
    const div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  },

  qs(name) {
    return new URLSearchParams(location.search).get(name);
  },

  initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    const nav = document.querySelector(".nav");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        links.classList.toggle("open");
        nav.classList.toggle("menu-open");
      });
      links.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          links.classList.remove("open");
          nav.classList.remove("menu-open");
        })
      );
    }
  },

  // Shared lead-form wiring: validates [data-required] fields, saves the
  // lead, then swaps the form for its confirmation block.
  bindLeadForm(formId, type, confirmId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      const data = { type };
      form.querySelectorAll("input, select, textarea").forEach((el) => {
        const field = el.closest(".field");
        const required = el.hasAttribute("data-required");
        let valid = !required || el.value.trim().length > 0;
        if (valid && el.type === "email" && el.value.trim()) {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        }
        if (field) field.classList.toggle("error", !valid);
        ok = ok && valid;
        if (el.name) data[el.name] = el.value.trim();
      });
      if (!ok) return;
      RihlaStore.submitLead(data);
      form.style.display = "none";
      const conf = document.getElementById(confirmId);
      if (conf) conf.style.display = "block";
      window.scrollTo({ top: conf ? conf.offsetTop - 120 : 0, behavior: "smooth" });
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  RihlaUI.initNav();
  // Installable app: register the service worker where supported. The path
  // is computed relative to the site root so subpath hosting (e.g. GitHub
  // Pages project sites) works; /ar/ pages sit one level down.
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const swPath = location.pathname.includes("/ar/") ? "../sw.js" : "sw.js";
    navigator.serviceWorker.register(swPath).catch(() => {});
  }
});
