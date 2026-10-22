# Codlingo Tickets

A small **Astro** site that shares the CodeLingo build tickets as standalone HTML pages.
The landing page is a hub with two ticket sets — the **mobile app** rebuild and the **web
lesson feature** work — and each set is one page that can be opened or shared as a plain URL.

## Source of truth

Each set is authored as a single HTML document in `src/` and served as-is on its own route:
`CodeLingo-Mobile-Tickets.html` at `/mobile/` and `CodeLingo Lesson Tickets.html` at
`/lessons/`. Both keep their tickets in JavaScript data arrays inside a `<script>`, which is
why `scripts/import-tickets.mjs` evaluates that data instead of scraping markup. Each mobile
ticket carries `steps`, `api` (backend calls), `needs`, `reuse`, `notes` and a `blocked` flag;
blocked tickets are listed but have no done-checkbox and are excluded from the progress count.

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
src/layouts/TicketPage.astro shell for a ticket document + link back to the hub
src/pages/index.astro        landing hub, links to both ticket sets
src/pages/mobile.astro       mobile ticket set  -> /mobile/
src/pages/lessons.astro      lesson ticket set  -> /lessons/
src/styles/global.css        design tokens shared with the CodeLingo ticket pages
```

## Sharing

`npm run build` emits pure static files with directory-style URLs
(`dist/tickets/mob-2/index.html`), so the site can be hosted anywhere — GitHub Pages,
Netlify, S3 — or the `dist/` folder can be zipped and handed over as-is.

Complete-tick progress is stored per browser in `localStorage` under
`codlingo-tickets-progress` (same behaviour as the original page).
