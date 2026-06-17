import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Unique per Netlify deploy so HTML/asset query strings change and browsers refetch. */
const commitRef =
  process.env.COMMIT_REF ?? process.env.NETLIFY_COMMIT_REF ?? process.env.VERCEL_GIT_COMMIT_SHA ?? ''
const deployId = process.env.DEPLOY_ID ?? process.env.NETLIFY_DEPLOY_ID ?? ''
const buildId = commitRef
  ? `${commitRef.slice(0, 8)}${deployId ? `-${String(deployId).slice(0, 8)}` : ''}`
  : new Date().toISOString()

function stampBuildMeta(html: string) {
  return html.replace(
    '<meta charset="UTF-8" />',
    `<meta charset="UTF-8" />\n    <meta name="forfuture-build" content="${buildId}" />`,
  )
}

/** Production: cache-bust hashed assets and run deploy-sync before the app bundle (same load path as dev). */
function deployLoaderPlugin() {
  return {
    name: 'forfuture-deploy-loader',
    apply: 'build' as const,
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        const bust = encodeURIComponent(buildId)
        const withBustedAssets = html
          .replace(
            /(<link rel="stylesheet" crossorigin href="\/assets\/[^"]+\.css)"/,
            `$1?v=${bust}"`,
          )
          .replace(
            /(<script type="module" crossorigin src="\/assets\/[^"]+\.js)"/,
            `$1?v=${bust}"`,
          )

        const syncTag = `    <script src="/deploy-sync.js?v=${bust}"></script>\n`
        return withBustedAssets.replace(
          '<script src="/theme-init.js"></script>',
          `${syncTag}    <script src="/theme-init.js"></script>`,
        )
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
  plugins: [react(), tailwindcss(), buildStampPlugin(), deployLoaderPlugin()],
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
