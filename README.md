# CausalFunnel Analytics Lite

A MERN analytics assignment that tracks product behavior with a lightweight browser script and visualizes it in a SaaS-style dashboard.

## What It Tracks

- Page views, including SPA route changes.
- Raw click coordinates normalized against the full document, plus pixel coordinates and page dimensions.
- CTA clicks with readable labels from `data-cf-cta`, button text, link text, or aria labels.
- Time spent per page, flushed on route changes and tab visibility changes.
- Dashboard routes are excluded from tracking so analyst activity does not pollute product data.

## Architecture

- `frontend/` is a Vite React SaaS interface and analytics dashboard.
- `backend/` is an Express API with Mongoose models and aggregation endpoints.
- `demo/` is a simple tracked page for generating heatmap and journey data.
- `frontend/public/tracker.js` is the embeddable vanilla JavaScript tracker.
- `backend/src/uploads/screenshots/` stores captured page screenshots as PNG files.

## API Surface

- `POST /api/events` stores batched tracker events with `insertMany`.
- `GET /api/events/summary` returns dashboard totals, CTA rate, top pages, and top CTAs.
- `GET /api/sessions` returns session counts, last activity, CTA clicks, and dwell time.
- `GET /api/sessions/:sessionId/events` returns a chronological user journey.
- `GET /api/heatmaps?url={pageUrl}` returns click coordinates and page-size metadata for one URL.
- `GET /api/screenshots/exists?route={pageUrl}` checks whether a route screenshot is already stored.
- `GET /api/screenshots?route={pageUrl}` returns screenshot metadata for one route.
- `POST /api/screenshots` stores one PNG screenshot per route and returns its metadata.

## Run Locally

1. Start MongoDB locally, or set `MONGO_URI` in `backend/.env`.
2. Install dependencies in the root, backend, and frontend if needed.
3. Run the full stack:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

Demo page: open `demo/index.html` in a browser after the frontend server is running.

## Design Decisions

- Events are batched in the browser to reduce request volume and database pressure.
- `navigator.sendBeacon()` is used on exit so the final queue can be delivered without blocking navigation.
- A single flattened `Event` collection keeps writes fast and lets MongoDB aggregation power the dashboard.
- Heatmaps render normalized coordinates over an html2canvas screenshot captured from the same DOM dimensions used by click tracking.
- Screenshots are stored as files, while MongoDB stores only route, path, width, height, and creation time metadata.
- CTA tracking is metadata-driven, so product teams can add explicit `data-cf-cta` labels without changing the tracker.
