import { createContext } from 'react'
import type { ReportableContentType } from '../lib/moderation'

export interface ReportContentTarget {
  contentType: ReportableContentType
  contentId: string
  contentLabel?: string
}

export interface ReportContentContextValue {
  openReportModal: (target: ReportContentTarget) => void
}

export const ReportContentContext = createContext<ReportContentContextValue | null>(null)
