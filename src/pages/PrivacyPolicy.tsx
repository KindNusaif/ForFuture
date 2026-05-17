import TrustPageLayout from '../components/trust/TrustPageLayout'
import { TrustSection } from '../components/trust/TrustSection'

export default function PrivacyPolicy() {
  return (
    <TrustPageLayout
      title="Privacy Policy"
      subtitle="How ForFuture handles youth voices, civic content, and account data during public beta."
    >
      <TrustSection title="What we collect">
        <p>
          When you create an account we store your email (via Supabase Auth), display name, Youth
          Voice ID, and profile details you choose to share. Movements you publish may include text,
          optional location, and media you upload.
        </p>
        <p>
          Youth Voice posts use a public pseudonym (Youth Voice ID) instead of your real name. Your
          account identity is kept separate for safety and moderation.
        </p>
      </TrustSection>
      <TrustSection title="How we use data">
        <p>
          Data powers core features: authentication, feeds, polls, petitions, volunteer drives,
          impact metrics, and trust review. We do not sell personal data. Aggregated analytics help
          improve the platform.
        </p>
      </TrustSection>
      <TrustSection title="Sharing">
        <p>
          Published movements are visible to visitors and members according to movement settings.
          Moderators may access internal identifiers when reviewing reports. Service providers (e.g.
          Supabase hosting) process data under their terms.
        </p>
      </TrustSection>
      <TrustSection title="Your choices">
        <p>
          You can update your profile, delete movements you created, and sign out at any time.
          Contact us to request account deletion during beta.
        </p>
      </TrustSection>
      <TrustSection title="Contact">
        <p>
          Privacy questions:{' '}
          <a href="mailto:privacy@forfuture.app" className="font-semibold text-accent-600 dark:text-accent-300">
            privacy@forfuture.app
          </a>
        </p>
      </TrustSection>
      <p className="text-xs text-muted">Last updated: May 2026 · Public beta</p>
    </TrustPageLayout>
  )
}
