import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildId = new Date().toISOString()

const deploySyncTag = '<script src="/deploy-sync.js"></script>'

function stampBuildMeta(html: string) {
  return html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta name="forfuture-build" content="${buildId}" />`,
  )
}

function placeDeploySyncBeforeBundle(html: string) {
  const withoutDeploySync = html.replace(/\s*<script src="\/deploy-sync\.js"><\/script>\s*/g, '\n')
  return withoutDeploySync.replace(
    /(<script type="module"[^>]*><\/script>)/,
    `    ${deploySyncTag}\n    $1`,
  )
}

/** Build stamp early in head; deploy-sync runs before the hashed app bundle. */
function buildStampPlugin() {
  return {
    name: 'forfuture-build-stamp',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        return stampBuildMeta(html)
      },
    },
  }
}

function deploySyncOrderPlugin() {
  return {
    name: 'forfuture-deploy-sync-order',
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        return placeDeploySyncBeforeBundle(html)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), buildStampPlugin(), deploySyncOrderPlugin()],
  define: {
    __FORFUTURE_BUILD_ID__: JSON.stringify(buildId),
  },
  server: {
    port: 5175,
    strictPort: false,
  },
  preview: {
    port: 5175,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet')) return 'leaflet'
          if (id.includes('node_modules/@googlemaps')) return 'google-maps'
        },
      },
    },
  },
})
