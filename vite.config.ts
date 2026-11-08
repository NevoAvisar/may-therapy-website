import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Pages reached by their own path. Keep in step with PAGES in src/main.tsx. */
const STATIC_ROUTES = ['accessibility', 'privacy']

/** A copy of index.html at each path, so a direct link loads on any static host with no rewrite rules. */
const staticRoutes = (): Plugin => ({
  name: 'static-routes',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const page = bundle['index.html']
    if (page?.type !== 'asset') return
    for (const route of STATIC_ROUTES) this.emitFile({ type: 'asset', fileName: `${route}/index.html`, source: page.source })
  },
})

export default defineConfig({
  plugins: [react(), staticRoutes()],
  server: { port: 5173 },
})
