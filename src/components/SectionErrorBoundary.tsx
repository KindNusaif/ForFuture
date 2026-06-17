import type { ReactNode } from 'react'
import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Short label for the failed section, e.g. "Feed" */
  section: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
}

/** Isolates a page section so one widget failure does not crash the whole view. */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(`[ForFuture] ${this.props.section} section error`, error)
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
    this.props.onRetry?.()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div
        className="card-surface flex flex-col items-center gap-3 px-6 py-10 text-center"
        role="alert"
      >
        <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
        <p className="text-sm font-semibold text-primary">
          {this.props.section} couldn&apos;t load
        </p>
        <p className="max-w-sm text-sm text-secondary">
          Something went wrong in this section. The rest of the page should still work.
        </p>
        <button type="button" onClick={this.handleRetry} className="btn-secondary mt-1 text-sm">
          Try again
        </button>
      </div>
    )
  }
}
