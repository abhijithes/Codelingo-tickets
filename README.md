# Codlingo Tickets

A small **Astro** site that shares the project tickets as standalone HTML pages — one page per
ticket, plus an index, so any ticket can be opened or shared as a plain URL.

## Source of truth

Tickets are imported from the existing HTML plans:

- `../CodeLingo/public/tickets-dev.html` → Week One (`SYL-1` … `SYL-10`)
- `../CodeLingo/public/CodeLingo — Batch Two Build Plan.html` → Batch Two (`SYL-11` … `SYL-20`)

```bash
npm run import:tickets   # regenerates src/data/tickets.json from those files
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Builds static HTML into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run import:tickets` | Re-reads ticket HTML → `src/data/tickets.json` |

## Structure

```
scripts/import-tickets.mjs   parses the ticket HTML into JSON
src/data/index.ts            typed accessors (batches, tickets, helpers)
src/layouts/Base.astro       page shell (header, footer, fonts, tokens)
src/pages/index.astro        batch listing + progress bars
src/pages/tickets/[id].astro one static page per ticket
src/styles/global.css        design tokens shared with the CodeLingo ticket pages
```

## Sharing

`npm run build` emits pure static files with directory-style URLs
(`dist/tickets/syl-11/index.html`), so the site can be hosted anywhere — GitHub Pages,
Netlify, S3 — or the `dist/` folder can be zipped and handed over as-is.

Complete-tick progress is stored per browser in `localStorage` under
`codlingo-tickets-progress` (same behaviour as the original pages).# Codelingo-tickets
