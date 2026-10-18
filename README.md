# Codlingo Tickets

A small **Astro** site that shares the CodeLingo **mobile app** build tickets as standalone
HTML pages — the mobile ticket list is the landing page, and every ticket has its own page
so it can be opened or shared as a plain URL.

## Source of truth

Tickets are imported from `CodeLingo Mobile Tickets.html`. The page keeps its tickets in
JavaScript data arrays (`EPICS`, `T`) inside its `<script>`, so the importer evaluates that
data instead of scraping markup. Each ticket carries `steps`, `api` (backend calls), `needs`,
`reuse`, `notes` and a `blocked` flag. Blocked tickets are listed but have no done-checkbox
and are excluded from the progress count.

```bash
npm run import:tickets   # regenerates src/data/tickets.json from that file
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Builds static HTML into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run check` | Type-checks the Astro components |
| `npm run import:tickets` | Re-reads the ticket HTML → `src/data/tickets.json` |

## Structure

```
scripts/import-tickets.mjs   parses the mobile page's JS data into JSON
src/data/index.ts            typed accessors (batches, tickets, groups, helpers)
src/layouts/Base.astro       page shell (header, footer, fonts, tokens)
src/pages/index.astro        mobile ticket listing + progress bar
src/pages/tickets/[id].astro one static page per ticket
src/styles/global.css        design tokens shared with the CodeLingo ticket pages
```

## Sharing

`npm run build` emits pure static files with directory-style URLs
(`dist/tickets/mob-2/index.html`), so the site can be hosted anywhere — GitHub Pages,
Netlify, S3 — or the `dist/` folder can be zipped and handed over as-is.

Complete-tick progress is stored per browser in `localStorage` under
`codlingo-tickets-progress` (same behaviour as the original page).
