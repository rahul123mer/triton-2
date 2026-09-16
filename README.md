# Triton — Fine Dining Intelligence

Frontend for **The Ember Room**: table occupancy, waiter visits, kitchen station dwell, Cookbooks/Recipes, analysis, reports, and camera evidence.

The app lands on the restaurant workspace. Meeting-intelligence routes still exist in the codebase for Triton compatibility, but they are not in the primary sidebar.

## Requirements

- Node.js 20+
- npm

## Quick start

```bash
cd Triton-2
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite redirects `/` to `/restaurant`.

| Route | Screen |
| --- | --- |
| `/restaurant` | Overview, KPIs, live camera wall, floor plan |
| `/restaurant/tables` | Dining floor and table list |
| `/restaurant/tables/tbl-04` | Table T04 occupancy, visits, camera |
| `/restaurant/service` | Waiter activity |
| `/restaurant/kitchen` | Kitchen counters and staff |
| `/restaurant/cookbooks` | Fine Dining Operations cookbook |
| `/restaurant/analysis` | Recipe analysis over the event stream |
| `/restaurant/reports` | Period report and findings |

Default filters: **15 Sep 2026**, **Dinner 18:00–21:00**. Change date / Morning / Lunch / Dinner / Evening / Custom in the header; KPIs and timelines recompute from the same event dataset.

## Environment

`.env` is committed in this private repo so the receiving developer can run the app without extra setup.

```
VITE_API_BASE=/api/v1
VITE_API_MODE=mock
FAL_KEY=...
FAL_API_KEY=...
```

- `VITE_API_MODE=mock` runs meeting-library APIs through MSW fixtures (`fixtures/`). Restaurant screens do not need a backend; they read `src/restaurant/data.js`.
- `FAL_KEY` / `FAL_API_KEY` are used only by `scripts/generate-restaurant-videos.py` (server-side). They are not prefixed with `VITE_`, so Vite does not expose them to the browser.

Treat this repository as confidential. Rotate the fal.ai key if the repo is ever copied outside the intended team.

## Project layout

```
src/
  components/          Triton shell (sidebar, cards, player primitives)
  pages/               Existing Triton meeting screens
  restaurant/          Fine dining data, analytics, pages, camera UI
  mocks/               MSW handlers for meeting APIs
  lib/                 API client used by meeting screens
public/
  brand/               SafeSpace mark
  restaurant-media/    Six ~15s camera clips (autoplay on restaurant screens)
  mockServiceWorker.js
fixtures/              Meeting-library JSON used by MSW
scripts/
  generate-restaurant-videos.py   fal.ai Flux stills + Kling clips
```

Restaurant analytics (`src/restaurant/analytics.js`) always derive KPIs, insights, and recipe results from `src/restaurant/data.js`. Do not hard-code totals in UI components.

## Camera clips

| File | Use |
| --- | --- |
| `public/restaurant-media/dining-floor.mp4` | Overview default camera |
| `table-occupancy.mp4` | Table T04 |
| `waiter-visit.mp4` | Service / waiter visits |
| `multi-table-service.mp4` | Multi-table service |
| `kitchen-activity.mp4` | Kitchen plating / prep |
| `kitchen-movement.mp4` | Kitchen station movement |

To regenerate clips (Python 3, `fal-client`, `httpx`):

```bash
python -m pip install fal-client httpx
python scripts/generate-restaurant-videos.py
```

The script reads `FAL_API_KEY` from `.env` and writes MP4s under `public/restaurant-media/`. Existing valid files are skipped.

## Build

```bash
npm run build
npm run preview
```

## Notes for handover

- Stack: React 18, Vite 5, React Router 6, TanStack Query, Zustand, lucide-react, MSW.
- Visual language matches Triton (navy shell, SafeSpace brand, Cookbooks/Recipes, evidence drill-down).
- Click a table, waiter visit, or kitchen dwell event to open event detail and play the linked clip.
- Time-window filtering clips dwell duration to the selected range; occupancy session cards keep original seated/cleared timestamps.
