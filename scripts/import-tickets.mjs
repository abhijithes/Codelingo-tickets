#!/usr/bin/env node
/**
 * Imports the CodeLingo mobile tickets page into src/data/tickets.json.
 *
 * The page keeps its tickets in JavaScript data arrays (`EPICS` and `T`) inside a
 * <script>, so the importer evaluates that data instead of scraping markup.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SOURCE = {
  batch: 'mobile',
  label: 'Mobile',
  title: 'Mobile App Build Plan',
  file: path.join(root, 'CodeLingo Mobile Tickets.html'),
}

const SIZE_ESTIMATE = { S: 'S, ~½ day', M: 'M, ~1 day', L: 'L, ~2+ days' }

/** Parses the mobile tickets page: its <script> holds `EPICS` and `T` data arrays. */
function parseMobilePage(src, html) {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
  const dataOnly = script.slice(0, script.indexOf('var STORE_KEY'))
  if (!/\bEPICS\b/.test(dataOnly) || !/\bvar T\s*=/.test(dataOnly)) {
    throw new Error(`Could not find EPICS/T data arrays in ${src.file}`)
  }
  const { EPICS, T } = vm.runInNewContext(`${dataOnly}\n({ EPICS, T })`, Object.create(null))

  const epicName = Object.fromEntries(EPICS.map((e) => [e.id, e.name]))
  const epicNote = Object.fromEntries(EPICS.map((e) => [e.id, e.note]))

  const tickets = T.map((t) => ({
    id: String(t.id).toUpperCase(),
    number: String(t.id).replace(/^[A-Za-z]+-/, ''),
    batch: src.batch,
    title: t.title,
    area: 'Mobile',
    group: epicName[t.epic] ?? t.epic,
    groupNote: epicNote[t.epic] ?? '',
    estimate: SIZE_ESTIMATE[t.size] ?? String(t.size),
    dependsOn: t.deps?.length ? t.deps.join(', ') : 'none',
    blocked: Boolean(t.blocked),
    summary: t.why ?? '',
    steps: (t.steps ?? []).map(String),
    api: (t.api ?? []).map(([method, url, note]) => ({ method, path: url, note: note ?? '' })),
    needs: t.needs ?? '',
    reuse: (t.reuse ?? []).map(String),
    notes: (t.notes ?? []).map(String),
    dod: (t.accept ?? []).map(String),
  }))

  // Batch intro: the page's lede plus its static sections (Before you start,
  // Backend reference, Suggested split) kept as HTML.
  const lede = html.match(/<p class="lede">([\s\S]*?)<\/p>/)?.[1] ?? ''
  const sections = [...html.matchAll(/<section class="section"[^>]*>([\s\S]*?)<\/section>/g)].map(
    (m) => m[1],
  )
  const intro = [lede, ...sections].map((s) => s.trim()).filter(Boolean).join('\n')

  return {
    batch: {
      id: src.batch,
      label: src.label,
      title: src.title,
      source: path.relative(root, src.file),
      intro,
    },
    tickets,
  }
}

const html = await readFile(SOURCE.file, 'utf8')
const { batch, tickets } = parseMobilePage(SOURCE, html)

const outDir = path.join(root, 'src', 'data')
await mkdir(outDir, { recursive: true })
await writeFile(
  path.join(outDir, 'tickets.json'),
  JSON.stringify({ batches: [batch], tickets }, null, 2) + '\n',
  'utf8',
)

console.log(`Imported ${tickets.length} tickets into src/data/tickets.json`)
console.log(`Batch: ${batch.label} (${batch.id})`)
console.log(`Tickets: ${tickets.map((t) => t.id).join(', ')}`)
