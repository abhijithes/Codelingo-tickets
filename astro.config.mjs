// @ts-check
import { defineConfig } from 'astro/config'

// Output is fully static HTML so the built site can be hosted anywhere
// (GitHub Pages, Netlify, S3, or just opened from disk).
// GitHub Pages serves this repo from /Codelingo-tickets/, so the deploy job
// passes BASE_PATH; local dev and root hosting stay at '/'.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  output: 'static',
  base,
  build: {
    format: 'directory', // /tickets/syl-11/index.html -> pretty shareable URLs
  },
  server: {
    host: true,
    port: 4321,
  },
})