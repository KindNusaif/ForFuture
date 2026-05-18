import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

declare const __FORFUTURE_BUILD_ID__: string

if (import.meta.env.PROD) {
  const htmlBuild = document.querySelector('meta[name="forfuture-build"]')?.getAttribute('content')
  const jsBuild = typeof __FORFUTURE_BUILD_ID__ === 'string' ? __FORFUTURE_BUILD_ID__ : ''
  if (htmlBuild && jsBuild && htmlBuild !== jsBuild) {
    const key = 'forfuture_bundle_mismatch_v1'
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      } else {
        sessionStorage.removeItem(key)
      }
    } catch {
      window.location.reload()
    }
  }
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
