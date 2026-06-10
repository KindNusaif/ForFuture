import { Loader2 } from 'lucide-react'
import Logo from '../Logo'

interface FullScreenLoaderProps {
  title: string
  hint?: string
  overlay?: boolean
}

/** Branded full-screen loader for auth bootstrap and logout transitions. */
export default function FullScreenLoader({ title, hint, overlay = false }: FullScreenLoaderProps) {
  return (
    <main
      className={
        overlay
          ? 'auth-bootstrap-shell fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 px-4 py-12'
          : 'auth-bootstrap-shell flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12'
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="auth-bootstrap-panel">
        <Logo to="/" iconOnly className="mx-auto mb-2 justify-center" />
        <Loader2 className="auth-bootstrap-spinner mx-auto h-10 w-10 animate-spin" aria-hidden />
        <p className="auth-bootstrap-title">{title}</p>
        {hint ? <p className="mt-1 text-sm text-secondary">{hint}</p> : null}
      </div>
    </main>
  )
}
