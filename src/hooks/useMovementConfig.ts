import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildMovementConfig } from '../lib/movementI18n'
import type { MovementTypeConfig } from '../lib/movements'
import type { MovementType } from '../types'

export function useMovementConfig(type: MovementType): MovementTypeConfig {
  const { t } = useTranslation()
  return useMemo(() => buildMovementConfig(type, t), [type, t])
}

export function useMovementTypes(): MovementTypeConfig[] {
  const { t } = useTranslation()
  return useMemo(
    () =>
      (
        [
          'quick_youth_poll',
          'idea_for_change',
          'raise_voice',
          'volunteer_drive',
          'fundraising',
          'peaceful_civic_action',
          'youth_petition',
        ] as MovementType[]
      ).map((value) => buildMovementConfig(value, t)),
    [t],
  )
}
