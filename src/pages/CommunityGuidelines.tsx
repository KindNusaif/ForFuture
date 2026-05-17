import TrustPageLayout from '../components/trust/TrustPageLayout'
import { TrustSection } from '../components/trust/TrustSection'

export default function CommunityGuidelines() {
  return (
    <TrustPageLayout
      title="Community Guidelines"
      subtitle="How we keep ForFuture respectful, truthful, and youth-centered."
    >
      <TrustSection title="Speak with purpose">
        <p>
          Share ideas, petitions, polls, and volunteer drives that matter to your community. Be
          specific about the change you want and how others can help.
        </p>
      </TrustSection>
      <TrustSection title="Respect & safety">
        <p>
          Debate issues, not people. No bullying, slurs, threats, or targeted harassment. Protect
          privacy — do not share someone else&apos;s personal details without consent.
        </p>
      </TrustSection>
      <TrustSection title="Truth & trust">
        <p>
          Label opinions clearly. Do not spread misinformation about elections, health, or crises.
          Fundraising and relief posts should be honest about goals and beneficiaries.
        </p>
      </TrustSection>
      <TrustSection title="Reporting">
        <p>
          Use the Report button on any movement, poll, petition, drive, or campaign if something
          feels unsafe or misleading. Reports are reviewed by humans; content is not auto-removed.
        </p>
      </TrustSection>
      <TrustSection title="Consequences">
        <p>
          Violations may lead to content removal, loss of trust badges, or account suspension.
          Serious cases may be referred to appropriate authorities.
        </p>
      </TrustSection>
      <p className="text-xs text-muted">Last updated: May 2026 · Public beta</p>
    </TrustPageLayout>
  )
}
