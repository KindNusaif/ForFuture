import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="This link may be outdated or the page was moved. Head back to ForFuture to keep exploring youth movements."
        action={{ label: 'Back to ForFuture', to: '/' }}
      />
      <p className="mt-6 text-center">
        <Link to="/movements" className="text-sm font-semibold text-accent-600 hover:underline dark:text-accent-400">
          Browse movements
        </Link>
      </p>
    </div>
  )
}
