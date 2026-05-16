import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildMovementConfig } from '../lib/movementI18n'
import type { MovementTypeConfig } from '../lib/movements'
import type { MovementType } from '../types'

export function useMovementConfig(type: MovementType): MovementTypeConfig {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language
  return useMemo(() => buildMovementConfig(type, t), [type, t, lang])
}

export function useMovementTypes(): MovementTypeConfig[] {
  const { t, i18n } = useTranslation()
  return useMemo(
    () =>
      (
        [
          'idea_for_change',
          'raise_voice',
          'volunteer_drive',
          'fundraising',
          'peaceful_civic_action',
          'youth_petition',
          'quick_youth_poll',
        ] as MovementType[]
      ).map((value) => buildMovementConfig(value, t)),
    [t, i18n.resolvedLanguage, i18n.language],
  )
}
