import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../hooks/useLoadingProgress', () => ({
  useLoadingProgress: () => ({ showSlowHint: false, showRecovery: false }),
}))

import { useAuth } from '../hooks/useAuth'

describe('ProtectedRoute', () => {
  it('shows setup message when Supabase is not configured', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: false,
      configured: false,
      authError: null,
      profileError: null,
      isGuest: true,
      isMember: false,
      loggingOut: false,
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <p>Secret feed</p>
        </ProtectedRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Setup required/i)).toBeInTheDocument()
    expect(screen.queryByText('Secret feed')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: false,
      configured: true,
      authError: null,
      profileError: null,
      isGuest: true,
      isMember: false,
      loggingOut: false,
      refreshProfile: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/feed']}>
        <Routes>
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <p>Secret feed</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret feed')).not.toBeInTheDocument()
  })
})
