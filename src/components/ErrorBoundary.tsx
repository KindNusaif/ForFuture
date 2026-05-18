import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** When this changes (e.g. route path), clear a caught error without remounting the app tree. */
  resetKey?: string
}

interface State {
  hasError: boolean
  resetKey?: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { resetKey: props.resetKey, hasError: false }
    }
    return null
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ForFuture] UI error boundary', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
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
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
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
