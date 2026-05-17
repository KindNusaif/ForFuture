import { Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import TrustPageLayout from '../components/trust/TrustPageLayout'

export default function Contact() {
  return (
    <TrustPageLayout
      title="Contact"
      subtitle="Reach the ForFuture team during public beta."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href="mailto:hello@forfuture.app"
          className="card-surface flex gap-4 p-5 transition hover:-translate-y-0.5"
        >
          <span className="metric-icon-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-bold text-primary">General support</span>
            <span className="mt-1 block text-sm text-secondary">hello@forfuture.app</span>
          </span>
        </a>
        <a
          href="mailto:privacy@forfuture.app"
          className="card-surface flex gap-4 p-5 transition hover:-translate-y-0.5"
        >
          <span className="metric-icon-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
            <MessageCircle className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-bold text-primary">Privacy & safety</span>
            <span className="mt-1 block text-sm text-secondary">privacy@forfuture.app</span>
          </span>
        </a>
      </div>
      <p className="text-secondary">
        For urgent safety concerns about content on the platform, report it in-app first, then email{' '}
        <a href="mailto:privacy@forfuture.app" className="font-semibold text-accent-600 dark:text-accent-300">
          privacy@forfuture.app
        </a>{' '}
        with a link to the movement.
      </p>
      <p className="text-secondary">
        Read our{' '}
        <Link to="/community-guidelines" className="font-semibold text-accent-600 dark:text-accent-300">
          Community Guidelines
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="font-semibold text-accent-600 dark:text-accent-300">
          Privacy Policy
        </Link>
        .
      </p>
    </TrustPageLayout>
  )
}
