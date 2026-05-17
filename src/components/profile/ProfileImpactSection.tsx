import { BarChart3, FileText, Heart, Megaphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import StatCard from '../StatCard'
import { Skeleton } from '../Skeleton'

export interface ProfileImpactStats {
  movementsPosted: number
  engagementsReceived: number
  pollsCreated: number
  pollVotesReceived: number
  petitionsCreated: number
}

interface ProfileImpactSectionProps {
  stats: ProfileImpactStats | null
  loading?: boolean
}

export default function ProfileImpactSection({ stats, loading }: ProfileImpactSectionProps) {
  const { t } = useTranslation()

  const allZero =
    stats &&
    stats.movementsPosted === 0 &&
    stats.engagementsReceived === 0 &&
    stats.pollsCreated === 0 &&
    stats.pollVotesReceived === 0 &&
    stats.petitionsCreated === 0

  return (
    <section className="card-surface mt-6 p-5 sm:p-6" aria-labelledby="profile-impact-heading">
      <h3 id="profile-impact-heading" className="section-title text-lg! sm:text-xl!">
        {t('profile.impactTitle')}
      </h3>

      {loading || !stats ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </dl>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label={t('profile.statsMovementsPosted')}
              value={stats.movementsPosted}
              icon={FileText}
            />
            <StatCard
              label={t('profile.statsEngagements')}
              value={stats.engagementsReceived}
              icon={Heart}
              accent
            />
            <StatCard
              label={t('profile.statsPollsCreated')}
              value={stats.pollsCreated}
              icon={BarChart3}
            />
            <StatCard
              label={t('profile.statsPollVotes')}
              value={stats.pollVotesReceived}
              icon={BarChart3}
            />
            <StatCard
              label={t('profile.statsPetitions')}
              value={stats.petitionsCreated}
              icon={Megaphone}
            />
          </dl>
          {allZero && (
            <p className="mt-4 rounded-xl border border-dashed border-default bg-muted/80 px-4 py-3 text-center text-sm text-secondary">
              {t('profile.impactEmpty')}
            </p>
          )}
        </>
      )}
    </section>
  )
}

