import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App'
import AppProviders from './AppProviders'
import ErrorBoundaryReset from './components/ErrorBoundaryReset'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[ForFuture] Uncaught error', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[ForFuture] Unhandled promise rejection', event.reason)
  })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter>
        <ErrorBoundaryReset>
          <App />
        </ErrorBoundaryReset>
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
)
