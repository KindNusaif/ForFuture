import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** When this changes (e.g. route path), clear a caught error without remounting the app tree. */
  resetKey?: string
}

interface State {
  hasError: boolean
  errorMessage?: string
  componentStack?: string
  resetKey?: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { resetKey: props.resetKey, hasError: false, errorMessage: undefined }
    }
    return null
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ForFuture] UI error boundary', error.message, info.componentStack)
    if (typeof window !== 'undefined') {
      ;(window as Window & { __forfutureLastError?: unknown }).__forfutureLastError = {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        path: window.location.pathname,
      }
    }
    this.setState({
      errorMessage: error.message,
      componentStack: info.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      const showDevDetail =
        import.meta.env.DEV &&
        Boolean(this.state.errorMessage || this.state.componentStack)

      return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <div className="card-surface max-w-md p-8 text-center">
            <span
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"
              aria-hidden
            >
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-lg font-bold text-primary">Something went wrong</h1>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              We hit an unexpected error. Refresh the page or return home and try again.
            </p>
            {showDevDetail && (
              <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-secondary whitespace-pre-wrap">
                {this.state.errorMessage}
                {this.state.componentStack ? `\n\n${this.state.componentStack}` : ''}
              </pre>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: undefined })
                  window.location.reload()
                }}
                className="btn-primary"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/'
                }}
                className="btn-secondary"
              >
                Back to home
              </button>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
