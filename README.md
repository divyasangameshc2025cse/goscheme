# GO SCHEME — React + Node.js Edition

A full rewrite of the GO SCHEME government-scheme discovery portal:

- **Frontend:** React 18 + Vite + React Router + Tailwind CSS (was static HTML/CSS/JS)
- **Backend:** Node.js + Express + SQLite (already existed — extended with sector-wise
  endpoints and a live web scraper)
- **Sector-wise loading:** schemes are split by sector (Agriculture, Education, Healthcare,
  Housing, etc.) so the app only ever loads the sector you actually open, instead of every
  scheme at once
- **Web scraping:** `backend/src/scraper/scrapeSchemes.js` pulls current schemes from
  official government sources and merges them into the database, auto-classified by sector
- **Mobile responsive:** every page is built mobile-first with Tailwind; nav collapses to a
  slide-down menu under `md` breakpoint
- **SEO:** per-page `<title>`/meta via `react-helmet-async`, `robots.txt`, `sitemap.xml`,
  semantic headings, and route-level code-splitting so pages stay light

## Project structure

```
goscheme-react/
├── backend/     Express API + SQLite + scraper (Node.js)
└── frontend/    React app (Vite)
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
npm start          # http://localhost:5000
```

On first run it auto-creates `database.sqlite` and seeds it from the existing
`government_schemes_dataset.csv` / `schemes_dataset.json` (156 schemes across 10 sectors).

To pull fresh schemes from official sources:

```bash
npm run scrape      # one-off run from the command line
# or trigger it from the Admin Dashboard → "Run scraper now" button
# (calls POST /api/admin/scrape-schemes)
```

**Note on the scraper:** government sites occasionally change their markup/APIs, and some
render results client-side with JavaScript that a lightweight scraper can't execute. The
scraper is written defensively (each source is isolated in its own try/catch) — see the
comments at the top of `scrapeSchemes.js` for how to add/adjust sources.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173, proxies /api to :5000 automatically
```

For production:

```bash
npm run build         # outputs to frontend/dist
npm run preview        # sanity-check the production build locally
```

Set `VITE_API_URL` (see `.env.example`) if your backend isn't on `http://localhost:5000`.

## What changed from the original

| Area | Before | Now |
|---|---|---|
| Frontend | Static HTML/CSS/vanilla JS, one page per file | React SPA, React Router, component-based |
| Scheme loading | All schemes fetched/rendered at once | Sector list loads first (tiny payload); schemes for one sector load on demand, paginated |
| Scheme data | Static seed dataset only | Seed dataset + a scraper that can refresh it from official sources |
| SEO | Static meta tags in each HTML file | Per-route meta via `react-helmet-async`, `robots.txt`, `sitemap.xml` |
| Mobile | Fixed-width sections in places | Mobile-first Tailwind layout throughout, collapsible nav |
| Bundle size | N/A | Each route is its own ~1–4 KB (gzipped) chunk; vendor chunk ~54 KB gzipped |

## API additions

- `GET /api/sectors` — sector list with counts (cached 5 min)
- `GET /api/sectors/:slug/schemes?page=&limit=&search=&level=` — paginated schemes for one sector
- `POST /api/admin/scrape-schemes` — triggers the live scraper and upserts results

All existing endpoints (`/api/auth/*`, `/api/schemes/*`, `/api/saved-schemes/*`,
`/api/notifications/*`, `/api/admin/*`) are unchanged, so nothing else had to move.
