// @ts-check
import { defineConfig } from 'astro/config'

// Output is fully static HTML so the built site can be hosted anywhere
// (GitHub Pages, Netlify, S3, or just opened from disk).
export default defineConfig({
  output: 'static',
  build: {
    format: 'directory', // /tickets/syl-11/index.html -> pretty shareable URLs
  },
  server: {
    host: true,
    port: 4321,
  },
})