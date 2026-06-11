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

Zero-dependency static site — deploy the repo root to any static host
(GitHub Pages, Netlify, S3). Mobile-first, responsive, warm-neutral
palm-green & gold design system.

| Page | Purpose |
|---|---|
| `index.html` | Dual-door landing: mission, how a session works, evidence, library preview, trust |
| `hospitals.html` | B2B: why wards buy, cited evidence, program tiers, pilot timeline, pilot-request form |
| `families.html` | Sacred & memory service, religious framing, packages, booking form |
| `experiences.html` | Journey library with category filters and search |

Lead capture (pilot requests, family bookings) persists in `localStorage`
behind the `RihlaStore` facade (`assets/js/app.js`); replacing its methods
with API calls is the entire backend migration. The journey catalog, program
tiers, packages and evidence citations live in `assets/js/data.js`.

## Run & test

```bash
npm start                  # serve locally at http://localhost:3000
npm install && npm test    # jsdom functional suite: pages, filters, both lead forms
```

---

History: this repo previously hosted "Curio", a kids' experiential-learning
subscription prototype (see git history), pivoted to Rihla after an
investor-style review. The original Game of Life experiment lives on in `GOL/`.
