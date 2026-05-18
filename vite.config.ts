import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildId = new Date().toISOString()

function stampBuildMeta(html: string) {
  return html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta name="forfuture-build" content="${buildId}" />`,
  )
}

/** Production: defer app bundle until boot.js confirms index.html entry matches the server. */
function bootLoaderPlugin() {
  return {
    name: 'forfuture-boot-loader',
    apply: 'build' as const,
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        const moduleMatch = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
        const entry = moduleMatch?.[1]
        if (!entry) return html

        const withoutModule = html.replace(/\s*<script type="module"[^>]*><\/script>\s*/g, '\n')
        const withoutDeploySync = withoutModule.replace(
          /\s*<script src="\/deploy-sync\.js"><\/script>\s*/g,
          '\n',
        )
        const withoutPreload = withoutDeploySync.replace(
          /<link rel="modulepreload"[^>]*>\s*/g,
          '',
        )
        const bust = encodeURIComponent(buildId)
        const withBustedAssets = withoutPreload
          .replace(
            /(<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css)"/,
            `$1?v=${bust}"`,
          )
          .replace(/content="(\/assets\/[^"]+\.js)"/, `content="$1?v=${bust}"`)

        const bootTags =
          `    <meta name="forfuture-entry" content="${entry}?v=${bust}" />\n` +
          `    <script src="/boot.js?v=${bust}"></script>\n`

        return withBustedAssets.replace('</head>', `${bootTags}  </head>`)
      },
    },
  }
}

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

export default defineConfig({
  plugins: [react(), tailwindcss(), buildStampPlugin(), bootLoaderPlugin()],
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
