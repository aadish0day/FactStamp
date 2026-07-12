# WhisperStop

An interactive UI/UX prototype of an India-focused WhatsApp misinformation fact-checker. **No backend, no API, no real data** — every screen is wired to in-memory mock data so the full product experience can be clicked through end to end.

> Repository name: `FactStamp` · App name: `WhisperStop`

## Features

- **Dark & light themes**, first-class and persisted (`ws-theme` in `localStorage`)
- Pixel-perfect, fully interactive flows: submit a claim, queue it for verification, verify it, browse the feed, view dashboards, and an admin panel
- Animated **Verdict Stamp** (respects `prefers-reduced-motion`)
- Mock data + React Context only — flip any value in `src/data/mockData.js` and the whole app reflects it
- **Lucide** iconography throughout (no emojis)
- Dockerized: production nginx build **and** a hot-reload dev server

## Tech stack

Plain **JavaScript** (React 18, no TypeScript) + plain **CSS** with custom properties.

- `react`, `react-dom`, `react-router-dom`
- `lucide-react` (icons), `clsx`, `recharts` (charts), `html2canvas` (stamp export)
- Built with **Vite 5**

## Getting started

### Option A — Docker (recommended)

Start the **dev server with hot reload** (edits on your machine reload live in the container):

```bash
docker compose up -d          # → http://localhost:5173
docker compose down           # stop
```

### Option B — Local

```bash
npm install
npm run dev                   # → http://localhost:5173
```

### Production build

```bash
npm run build                 # outputs to dist/
npm run preview               # serve the built bundle locally
```

Or with Docker:

```bash
docker build --target serve -t whisperstop .
docker run -p 8080:80 whisperstop   # → http://localhost:8080
```

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start Vite dev server (HMR)          |
| `npm run build`   | Production build into `dist/`        |
| `npm run preview` | Preview the production build locally |

## Project structure

```
src/
  components/   UI primitives + claim/layout components
  context/      React Context providers (auth, data, theme, toasts)
  data/         mockData.js — single source of all fake data
  logic/        pure helpers (confidence score, duplicates, dates)
  pages/        route screens (Home, Submit, Verify*, Dashboard, ...)
  index.css     design tokens (CSS custom properties, themes)
```

## Notes

This is a **prototype**. There is intentionally no network layer, no `.env`, and no secret handling — all state is mock and in-memory.
