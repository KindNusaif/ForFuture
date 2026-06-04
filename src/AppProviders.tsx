import type { ReactNode } from 'react'
import { AuthProvider } from './context/AuthContext'
import { CreatePollProvider } from './context/CreatePollContext'
import { JoinMovementProvider } from './context/JoinMovementContext'
import { ReportContentProvider } from './context/ReportContentContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastProvider'
import DataSyncProvider from './components/DataSyncProvider'

/**
 * All app-wide React contexts live here, outside the router, so lazy route chunks
 * share the same context instances as the root tree (avoids "must be used within Provider").
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <JoinMovementProvider>
        <AuthProvider>
          <ThemeProvider>
            <CreatePollProvider>
              <DataSyncProvider>
                <ReportContentProvider>{children}</ReportContentProvider>
              </DataSyncProvider>
            </CreatePollProvider>
          </ThemeProvider>
        </AuthProvider>
      </JoinMovementProvider>
    </ToastProvider>
  )
}
