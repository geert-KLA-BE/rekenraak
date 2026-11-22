import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

const pagesUrl = 'https://geert-KLA-BE.github.io/rekenraak/'
const currentUrl = 'https://www.rekenraak.be/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'github-pages-static-links',
    enforce: 'post',
    transformIndexHtml(html) {
      if (!process.env.GITHUB_PAGES) return html
      return html
        .replace(/(href|src)="\/(?!rekenraak\/)/g, '$1="/rekenraak/')
        .replaceAll(currentUrl, pagesUrl)
    },
    closeBundle() {
      if (!process.env.GITHUB_PAGES) return
      for (const file of ['robots.txt', 'sitemap.xml']) {
        const path = resolve(import.meta.dirname, 'dist', file)
        writeFileSync(path, readFileSync(path, 'utf8').replaceAll(currentUrl, pagesUrl))
      }
    },
  }],
  base: process.env.GITHUB_PAGES ? '/rekenraak/' : '/',
  build: {
    rollupOptions: {
      // The static marketing/FAQ/catalogue pages are plain HTML+TS (no React), built by
      // Vite alongside the app so they can reuse the app's real CSS (hashed, cache-busted)
      // instead of a hand-copied stylesheet. See src/site.ts.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        // The same app booted straight into Bordmodus (data-boot="bord", src/bootEntry.ts).
        bord: resolve(import.meta.dirname, 'bord.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        faq: resolve(import.meta.dirname, 'faq.html'),
        oefeningen: resolve(import.meta.dirname, 'oefeningen.html'),
        handleiding: resolve(import.meta.dirname, 'handleiding.html'),
        // The pupil kiosk: its own React root, never the worksheet App (see src/oefenen/).
        oefenen: resolve(import.meta.dirname, 'oefenen.html'),
        // Zelf oefenen: the same kiosk root booted on its own address (kind.html), no link needed (a later subdomain can serve it as its index).
        kind: resolve(import.meta.dirname, 'kind.html'),
        // The pupil stappenhulp: the sums from a sheet's QR and their worked steps (see src/tutor/).
        tutor: resolve(import.meta.dirname, 'tutor.html'),
      },
    },
  },
})
