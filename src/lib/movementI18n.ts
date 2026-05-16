import type { TFunction } from 'i18next'
import type { MovementType } from '../types'
import type { MovementTypeConfig } from './movements'
import { MOVEMENT_TYPES_BASE } from './movementBase'

export function buildMovementConfig(type: MovementType, t: TFunction): MovementTypeConfig {
  const base = MOVEMENT_TYPES_BASE.find((m) => m.value === type) ?? MOVEMENT_TYPES_BASE[0]
  const key = `movements.${type}`

  const disclaimer =
    type === 'fundraising' || type === 'youth_petition'
      ? t(`${key}.disclaimer`)
      : undefined

  return {
    ...base,
    label: t(`${key}.label`),
    shortLabel: t(`${key}.shortLabel`),
    description: t(`${key}.description`),
    ctaLabel: t(`${key}.cta`),
    ctaActiveLabel: t(`${key}.ctaActive`),
    ctaSupportedLabel: t(`${key}.ctaSupported`),
    engagementHint: t(`${key}.hint`),
    countLabel: (n) =>
      t(n === 1 ? `${key}.count_one` : `${key}.count_other`, { count: n }),
    emptyTitle: t(`${key}.emptyTitle`),
    emptyDescription: t(`${key}.emptyDescription`),
    actionDisclaimer: disclaimer || undefined,
  }
}
