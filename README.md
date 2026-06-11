# Curio — experiential learning, beamed home

A premium, Whoop-style annual membership that streams live experiential and
cultural learning studios to family TVs worldwide. Built by nursery educators,
designed for calm: warm neutral palette, no noise, no clutter.

## The service

- **Two daily studio windows** — Morning Studio 8am–12pm and Afternoon Studio
  2pm–6pm (local time). No booking; children pop in and out freely. Each hour
  rotates to a new activity drawn from the family's chosen tracks.
- **Global learning tracks** — pick up to 3 of 12 tracks across languages &
  culture (Arabic & Gulf Culture, Japanese, Mandarin, French, Spanish), science,
  making, food and the arts. Swap any time.
- **Hardware included, Whoop-style** — the Curio Cam 4K + HDMI kit ships free
  worldwide and remains Curio property: free replacement while a member,
  prepaid return within 30 days if membership ends ($250 fee if unreturned).
- **Optional Wireless Bluetooth Kit** — $100 one-time, fully cable-free.
- **Pricing** — Annual $59/mo (billed $708/yr) or 24-Month $49/mo (billed
  $1,176/2yr). **First month free**, no payment taken at signup.

## The site

Zero-dependency static site — deploy the repo root to any static host
(GitHub Pages, Netlify, S3). Mobile-first, responsive, accessible.

| Page | Purpose |
|---|---|
| `index.html` | Landing: hero, how it works, daily rhythm, kit, pricing, FAQ |
| `tracks.html` | Track catalog with category/age filters and search |
| `signup.html` | 6-step wizard: plan → tracks → children → device → delivery → account |
| `login.html` | Member sign-in, plus a one-click demo dashboard |
| `dashboard.html` | My Studio: live session status, agendas, track swap, kit tracking, billing |

State persists in `localStorage` behind the `CurioStore` facade
(`assets/js/app.js`); replacing its methods with API calls is the entire
backend migration. The catalog and service config live in `assets/js/data.js`.

## Run & test

```bash
npm start                  # serve locally at http://localhost:3000
npm install && npm test    # jsdom functional suite: full signup→login→dashboard journey
```

---

The original Game of Life experiment lives on in `GOL/`.
