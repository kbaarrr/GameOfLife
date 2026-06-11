# Rihla (رحلة) — journeys for those who cannot travel

Experience care for the Gulf: facilitated immersive journeys delivered to
hospital wards and bedsides — one last skydive, the Haram at dawn, the street
they grew up on. One brand, two doors:

- **For hospitals & care providers (B2B)** — ward experience-care programs:
  headset kits maintained by Rihla, facilitator training, a growing journey
  library, and quarterly reporting mapped to patient-satisfaction KPIs
  (Saudi HSTP targets 85.76% inpatient satisfaction). Entry point is a
  4-week ward pilot with pre/post measurement.
- **For families (B2C wedge)** — white-glove bedside sessions: sacred
  journeys to Makkah/Madinah (always framed as comfort and preparation,
  never a substitute for pilgrimage), bucket-list moments, and bespoke 360°
  memory films. Packages from a single Comfort Session to commissioned films.

The clinical case rests on real evidence (VR distraction meta-analyses
across 9 RCTs / 944 children; hospital feasibility studies) — cited with
links on the hospitals page.

## The site

Zero-runtime-dependency site with an optional zero-dependency Node server.
Deploy the repo root to any static host (lead forms fall back to
localStorage) or run `server.js` to capture leads for real. Mobile-first,
responsive, installable as a PWA, warm-neutral palm-green & gold design
system. English + full Arabic (RTL) for the family-facing pages.

| Page | Purpose |
|---|---|
| `index.html` | Dual-door landing: mission, how a session works, evidence, library preview, trust |
| `hospitals.html` | B2B: why wards buy, cited evidence, program tiers, pilot timeline, pilot-request form |
| `families.html` | Sacred & memory service, religious framing, packages, booking form |
| `experiences.html` | Journey library with category filters and search |
| `ar/…` | Arabic (RTL) landing, families and experiences pages (hospitals stays English — GCC procurement norm) |
| `deck.html` | Self-contained, print-to-PDF one-page ward-pilot proposal for hospital PX directors |
| `admin.html` | Internal lead inbox (requires `server.js` + admin token) |

## Server & lead capture

`server.js` (Node ≥ 18, no dependencies) serves the site plus:

- `POST /api/leads` — pilot requests & family bookings → `data/leads.json`
- `GET /api/leads` — list leads; requires `x-admin-token` (set
  `RIHLA_ADMIN_TOKEN`; dev default `rihla-dev`)
- `GET /api/health` — liveness

The browser facade (`RihlaStore.submitLead`) posts to the API and falls
back to localStorage on static hosting or network failure, so no lead is
ever lost. The journey catalog (EN + AR), program tiers, packages and
evidence citations live in `assets/js/data.js`.

## Run & test

```bash
npm start                  # node server.js → http://localhost:3000 (admin: /admin.html)
npm install && npm test    # jsdom page/flow suite + real server integration tests
```

---

History: this repo previously hosted "Curio", a kids' experiential-learning
subscription prototype (see git history), pivoted to Rihla after an
investor-style review. The original Game of Life experiment lives on in `GOL/`.
