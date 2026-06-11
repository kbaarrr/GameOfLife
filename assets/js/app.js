/* Curio — shared client runtime.
   Accounts persist in localStorage behind a small store facade so the whole
   app talks to one interface; replacing these methods with fetch() calls is
   the entire backend migration. */

const CurioStore = {
  KEY_USERS: "curio_users",
  KEY_SESSION: "curio_session",
  KEY_DRAFT: "curio_signup_draft",

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

  users() {
    return this._read(this.KEY_USERS, {});
  },

  saveUser(user) {
    const users = this.users();
    users[user.email.toLowerCase()] = user;
    this._write(this.KEY_USERS, users);
  },

  findUser(email) {
    return this.users()[(email || "").toLowerCase()] || null;
  },

  // NOTE: client-side demo hashing only — real auth lives server-side.
  hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "h" + (h >>> 0).toString(36);
  },

  login(email, password) {
    const user = this.findUser(email);
    if (!user || user.passHash !== this.hash(password)) return null;
    this._write(this.KEY_SESSION, { email: user.email.toLowerCase(), at: Date.now() });
    return user;
  },

  logout() {
    localStorage.removeItem(this.KEY_SESSION);
  },

  currentUser() {
    const sess = this._read(this.KEY_SESSION, null);
    if (!sess) return null;
    return this.findUser(sess.email);
  },

  startSession(email) {
    this._write(this.KEY_SESSION, { email: email.toLowerCase(), at: Date.now() });
  },

  draft() {
    return this._read(this.KEY_DRAFT, {});
  },
  saveDraft(d) {
    this._write(this.KEY_DRAFT, d);
  },
  clearDraft() {
    localStorage.removeItem(this.KEY_DRAFT);
  },
};

const CurioUI = {
  money(n) {
    return "$" + n.toLocaleString("en-US");
  },

  fmtDate(d) {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  },

  addMonths(date, m) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + m);
    return d;
  },

  esc(s) {
    const div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  },

  qs(name) {
    return new URLSearchParams(location.search).get(name);
  },

  // Session window status relative to local time right now.
  sessionStatus(sess) {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    if (h >= sess.start && h < sess.end) return "live";
    if (h < sess.start) return "upcoming";
    return "ended";
  },

  fmtHour(h) {
    const ampm = h < 12 ? "am" : "pm";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return hr + ":00" + ampm;
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

    // Swap the "Sign in" CTA for "My Studio" when logged in.
    const user = CurioStore.currentUser();
    const authLink = document.querySelector("[data-auth-link]");
    if (user && authLink) {
      authLink.textContent = "My Studio";
      authLink.setAttribute("href", "dashboard.html");
    }
  },

  requireAuth() {
    const user = CurioStore.currentUser();
    if (!user) {
      location.href = "login.html?next=dashboard";
      return null;
    }
    return user;
  },

  // Build a demo member so visitors can explore the dashboard instantly.
  demoUser() {
    const email = "demo@curio.world";
    let user = CurioStore.findUser(email);
    if (!user) {
      const signupAt = Date.now() - 9 * 24 * 3600 * 1000; // joined 9 days ago
      user = {
        firstName: "Amira",
        lastName: "Haddad",
        email,
        passHash: CurioStore.hash("curio-demo"),
        plan: "annual",
        tracks: ["arabic-gcc", "kitchen-chemistry", "young-masters"],
        children: [
          { name: "Zayd", age: "6–8" },
          { name: "Lina", age: "3–5" },
        ],
        bluetooth: true,
        address: { line1: "14 Cedar Walk", city: "London", country: "United Kingdom", postcode: "N1 7GU" },
        deviceStage: 2, // 0 preparing, 1 shipped, 2 delivered
        signupAt,
      };
      CurioStore.saveUser(user);
    }
    CurioStore.startSession(email);
    return user;
  },
};

document.addEventListener("DOMContentLoaded", () => CurioUI.initNav());
