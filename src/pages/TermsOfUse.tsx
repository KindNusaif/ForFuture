import TrustPageLayout from '../components/trust/TrustPageLayout'
import { TrustSection } from '../components/trust/TrustSection'

export default function TermsOfUse() {
  return (
    <TrustPageLayout
      title="Terms of Use"
      subtitle="Rules for participating in ForFuture during public beta."
    >
      <TrustSection title="Eligibility">
        <p>
          ForFuture is built for young people and civic participation. You must provide accurate
          account information and follow local laws when organizing or joining movements.
        </p>
      </TrustSection>
      <TrustSection title="Your content">
        <p>
          You keep ownership of content you post. You grant ForFuture a license to host, display, and
          moderate it on the platform. Do not post unlawful, harmful, or deceptive material.
        </p>
      </TrustSection>
      <TrustSection title="Prohibited conduct">
        <p>
          Harassment, hate speech, scams, impersonation, doxxing, and incitement to violence are not
          allowed. We may remove content or suspend accounts after review.
        </p>
      </TrustSection>
      <TrustSection title="Beta disclaimer">
        <p>
          Features may change or break during public beta. The service is provided &quot;as is&quot;
          without warranties. Use your judgment when meeting people or supporting causes offline.
        </p>
      </TrustSection>
      <TrustSection title="Contact">
        <p>
          Legal inquiries:{' '}
          <a href="mailto:legal@forfuture.app" className="font-semibold text-accent-600 dark:text-accent-300">
            legal@forfuture.app
          </a>
        </p>
      </TrustSection>
      <p className="text-xs text-muted">Last updated: May 2026 · Public beta</p>
    </TrustPageLayout>
  )
}
