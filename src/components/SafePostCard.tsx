import { Component, type ErrorInfo, type ReactNode } from 'react'
import PostCard, { type PostCardProps } from './PostCard'

interface State {
  failed: boolean
}

/**
 * Isolates a single feed card so one bad row cannot crash the whole page.
 */
export default class SafePostCard extends Component<PostCardProps, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ForFuture] PostCard render failed', error.message, info.componentStack)
  }

  componentDidUpdate(prevProps: PostCardProps) {
    if (prevProps.post.id !== this.props.post.id && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <article className="card-surface border-dashed px-4 py-6 text-center text-sm text-secondary">
          <p>This movement could not be displayed.</p>
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => this.setState({ failed: false })}
          >
            Try again
          </button>
        </article>
      )
    }

    return <PostCard {...this.props} />
  }
}
