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
        const stylesheetMatch = html.match(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)(?:\?[^"]*)?"/,
        )
        const stylesheet = stylesheetMatch?.[1]
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
          (stylesheet
            ? `    <meta name="forfuture-stylesheet" content="${stylesheet}?v=${bust}" />\n`
            : '') +
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
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
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
          if (
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/router')
          ) {
            return 'router'
          }
          if (id.includes('node_modules/leaflet')) return 'leaflet'
          if (id.includes('node_modules/@googlemaps')) return 'google-maps'
          // Isolate context + provider modules (not whole dependency trees) so lazy routes
          // share one React context instance — avoid duplicating toast-context in route chunks.
          if (
            id.includes('/context/toast-context') ||
            id.includes('/context/ToastProvider') ||
            id.includes('/hooks/useToast')
          ) {
            return 'toast'
          }
          if (
            id.includes('/context/join-movement-context') ||
            id.includes('/context/join-movement-modal-context') ||
            id.includes('/context/JoinMovementContext') ||
            id.includes('/hooks/useJoinMovement')
          ) {
            return 'join-movement'
          }
          if (
            id.includes('/context/create-poll-context') ||
            id.includes('/hooks/useCreatePoll')
          ) {
            return 'create-poll'
          }
          if (
            id.includes('/context/report-content-context') ||
            id.includes('/hooks/useReportContent')
          ) {
            return 'report-content'
          }
          if (
            id.includes('/context/auth-context') ||
            id.includes('/hooks/useAuth') ||
            id.includes('/hooks/useAuthUser')
          ) {
            return 'auth'
          }
          if (
            id.includes('/context/theme-context') ||
            id.includes('/hooks/useTheme')
          ) {
            return 'theme'
          }
        },
      },
    },
  },
})
