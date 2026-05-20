import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  buildShareDataFromPost,
  tryNativeShare,
  trackShareClick,
  type ShareData,
} from '../lib/share'
import { useToast } from './useToast'
import type { Post } from '../types'

export function useShareContent() {
  const { t } = useTranslation()
  const toast = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [shareData, setShareData] = useState<ShareData | null>(null)

  const share = useCallback(
    async (input: Post | ShareData) => {
      const data =
        'contentType' in input && 'contentId' in input && 'url' in input
          ? input
          : buildShareDataFromPost(input, t)

      trackShareClick(data)

      const native = await tryNativeShare(data)
      if (native === 'shared') {
        toast.success(t('share.shared'))
        return
      }
      if (native === 'cancelled') return

      setShareData(data)
      setDialogOpen(true)
    },
    [t, toast],
  )

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  return {
    share,
    dialogOpen,
    shareData,
    closeDialog,
  }
}
