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

  // Deliver to the API when the site is served by server.js; fall back to
  // localStorage on static hosting or network failure so no lead is lost.
  submitLead(lead) {
    if (typeof fetch !== "function") return this.saveLead(lead);
    fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  // Installable app: register the service worker where supported.
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
});
