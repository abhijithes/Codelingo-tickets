#!/usr/bin/env node
/**
 * Imports the existing CodeLingo ticket HTML pages into src/data/tickets.json.
 *
 * The two source documents use different markup:
 *   - ../CodeLingo/public/tickets-dev.html                -> <article class="ticket" id="syl-N">
 *   - ../CodeLingo/public/CodeLingo — Batch Two Build Plan.html -> <article class="tk" id="SYL-N">
 *
 * Both share the same inner shape: header (number, title, tags, checkbox),
 * a plain-language summary, optional "why", then spec blocks keyed by <h4>.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const SOURCES = [
  {
    batch: 'week-one',
    label: 'Week One',
    title: 'Week One Build Plan',
    file: path.join(root, '..', 'CodeLingo', 'public', 'tickets-dev.html'),
    plainClass: 'plain',
    hasWhy: true,
  },
  {
    batch: 'batch-two',
    label: 'Batch Two',
    title: 'Batch Two Build Plan',
    file: path.join(root, '..', 'CodeLingo', 'public', 'CodeLingo — Batch Two Build Plan.html'),
    plainClass: 'pl',
    hasWhy: false,
  },
]

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

const decode = (s) => s.replace(/&(?:amp|lt|gt|quot|apos|#39|#x27|#34|nbsp);/g, (m) => ENTITIES[m] ?? m)
const stripTags = (s) => decode(String(s).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
const collect = (re, str, group = 1) => [...str.matchAll(re)].map((m) => m[group])

function parseBlocks(html) {
  const heads = [...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/g)]
  const blocks = {}
  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index + heads[i][0].length
    const end = i + 1 < heads.length ? heads[i + 1].index : html.indexOf('</article>', start) === -1 ? html.length : html.indexOf('</article>', start)
    const body = html.slice(start, end < 0 ? html.length : end)
    const title = stripTags(heads[i][1]).toLowerCase()

    const lis = collect(/<li[^>]*>([\s\S]*?)<\/li>/g, body)
    const verify = body.match(/<div class="(?:vf|verify)">([\s\S]*?)<\/div>/)
    const para = body.match(/<p[^>]*>([\s\S]*?)<\/p>/)

    if (/depends on/.test(title)) continue
    if (/files you'll touch|files you will touch|files/.test(title)) blocks.files = lis
    else if (/definition of done|done when/.test(title)) blocks.dod = lis
    else if (/check your work|verify/.test(title)) blocks.verify = verify ? stripTags(verify[1]) : ''
    else if (/see working|seeing working|what works/.test(title)) blocks.see = para ? para[1].trim() : ''
    else if (/how to build|approach|implementation/.test(title)) blocks.how = para ? para[1].trim() : ''
  }
  return blocks
}

function parseTags(html) {
  const tags = collect(/<span class="tag[^"]*">([\s\S]*?)<\/span>/g, html)
  const area = tags.find((t) => /^(backend|frontend|design|fullstack|api|devops)/i.test(t)) ?? 'General'
  const estimate = tags.find((t) => /^\d+(\.\d+)?\s*[hd]\b/i.test(stripTags(t))) ?? ''
  const dependsTag = tags.find((t) => /depends on/i.test(t))
  const dependsOn = dependsTag ? dependsTag.replace(/^[^:]*:\s*/i, '').trim() : 'none'
  return { area: area, estimate: stripTags(estimate), dependsOn }
}

async function importSource(src) {
  const html = await readFile(src.file, 'utf8')
  const introMatch = html.match(/<section class="intro">([\s\S]*?)<\/section>/)
  const intro = introMatch
    ? introMatch[1].replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '').trim()
    : ''

  const tickets = []
  for (const m of html.matchAll(/<article[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)) {
    const rawId = m[1].toLowerCase()
    const body = m[2]
    const shape = rawId.match(/^([a-z]+)-(\d+)$/) ?? [null, rawId.replace(/[-_]/g, ''), rawId.match(/(\d+)$/)?.[1] ?? '0']
    const numPart = shape[2]
    const id = `${String(shape[1]).toUpperCase()}-${Number(numPart)}`

    const title = stripTags(body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] ?? '') || rawId
    const tags = body.match(/<div class="tags">([\s\S]*?)<\/div>/)
    const meta = parseTags(tags ? `<div class="tags">${tags[1]}</div>` : '')

    const summary = stripTags(body.match(new RegExp(`<p class="${src.plainClass}">([\\s\\S]*?)<\\/p>`))?.[1] ?? '')
    const why = src.hasWhy
      ? stripTags(body.match(/<p class="why">([\s\S]*?)<\/p>/)?.[1] ?? '')
      : ''
    const blocks = parseBlocks(body)

    tickets.push({
      id,
      number: numPart ? String(Number(numPart)).padStart(2, '0') : id,
      batch: src.batch,
      title,
      area: meta.area,
      group: meta.area,
      estimate: meta.estimate,
      dependsOn: meta.dependsOn,
      summary,
      why,
      see: blocks.see ?? '',
      files: blocks.files ?? [],
      how: blocks.how ?? '',
      dod: blocks.dod ?? [],
      verify: blocks.verify ?? '',
    })
  }

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

const results = await Promise.all(SOURCES.map(importSource))
const batches = results.map((r) => r.batch)
const tickets = results.flatMap((r) => r.tickets)

// Reference tickets that should exist as internal links (e.g. "Depends on: SYL-11").
const known = new Set(tickets.map((t) => t.id.toUpperCase()))
for (const t of tickets) {
  if (!t.dependsOn || t.dependsOn === 'none') t.dependsOn = 'none'
  t.links = [...t.dependsOn.matchAll(/SYL-\d+/gi)]
    .map((m) => m[0].toUpperCase())
    .filter((id) => known.has(id))
}

const outDir = path.join(root, 'src', 'data')
await mkdir(outDir, { recursive: true })
await writeFile(
  path.join(outDir, 'tickets.json'),
  JSON.stringify({ batches, tickets }, null, 2) + '\n',
  'utf8',
)

const ids = tickets.map((t) => t.id).join(', ')
console.log(`Imported ${tickets.length} tickets into src/data/tickets.json`)
console.log(`Batches: ${batches.map((b) => `${b.label} (${b.id})`).join(', ')}`)
console.log(`Tickets: ${ids}`)