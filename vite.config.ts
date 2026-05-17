import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildId = new Date().toISOString()

/** Stamps index.html so you can verify production loaded the latest Netlify deploy. */
function buildStampPlugin() {
  return {
    name: 'forfuture-build-stamp',
    transformIndexHtml(html: string) {
      return html.replace(
        '</head>',
        `    <meta name="forfuture-build" content="${buildId}" />\n  </head>`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), buildStampPlugin()],
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
