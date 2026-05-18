import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import App from './App'
import ErrorBoundaryReset from './components/ErrorBoundaryReset'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister())
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundaryReset>
        <App />
      </ErrorBoundaryReset>
    </BrowserRouter>
  </StrictMode>,
)
