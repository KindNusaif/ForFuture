import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { JoinMovementProvider } from './context/JoinMovementContext'
import { ReportContentProvider } from './context/ReportContentContext'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import ExploreLayout from './components/ExploreLayout'
import ImpactMapLayout from './components/ImpactMapLayout'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import PageLoader from './components/PageLoader'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Explore = lazy(() => import('./pages/Explore'))
const Movements = lazy(() => import('./pages/Movements'))
const Discover = lazy(() => import('./pages/Discover'))
const ImpactMap = lazy(() => import('./pages/ImpactMap'))
const Feed = lazy(() => import('./pages/Feed'))
const CreatePostRoute = lazy(() =>
  import('./pages/CreatePost').then((m) => ({ default: m.CreatePostRoute })),
)
const Profile = lazy(() => import('./pages/Profile'))
const MovementDetail = lazy(() => import('./pages/MovementDetail'))
const AdminModeration = lazy(() => import('./pages/AdminModeration'))
const AdminTrustReview = lazy(() => import('./pages/AdminTrustReview'))
const ReliefHub = lazy(() => import('./pages/ReliefHub'))
const CreateReliefPost = lazy(() => import('./pages/CreateReliefPost'))
const YouthImpactPulse = lazy(() => import('./pages/YouthImpactPulse'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'))
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'))
const Contact = lazy(() => import('./pages/Contact'))

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <JoinMovementProvider>
          <ReportContentProvider>
            <div className="theme-transition min-h-screen">
              <Routes>
              <Route element={<Layout />}>
                <Route
                  index
                  element={
                    <LazyPage>
                      <Landing />
                    </LazyPage>
                  }
                />
                <Route
                  path="login"
                  element={
                    <GuestRoute>
                      <LazyPage>
                        <Login />
                      </LazyPage>
                    </GuestRoute>
                  }
                />
                <Route
                  path="signup"
                  element={
                    <GuestRoute>
                      <LazyPage>
                        <Signup />
                      </LazyPage>
                    </GuestRoute>
                  }
                />
                <Route
                  path="forgot-password"
                  element={
                    <GuestRoute>
                      <LazyPage>
                        <ForgotPassword />
                      </LazyPage>
                    </GuestRoute>
                  }
                />
                <Route
                  path="reset-password"
                  element={
                    <LazyPage>
                      <ResetPassword />
                    </LazyPage>
                  }
                />
                <Route
                  path="privacy"
                  element={
                    <LazyPage>
                      <PrivacyPolicy />
                    </LazyPage>
                  }
                />
                <Route
                  path="terms"
                  element={
                    <LazyPage>
                      <TermsOfUse />
                    </LazyPage>
                  }
                />
                <Route
                  path="community-guidelines"
                  element={
                    <LazyPage>
                      <CommunityGuidelines />
                    </LazyPage>
                  }
                />
                <Route
                  path="contact"
                  element={
                    <LazyPage>
                      <Contact />
                    </LazyPage>
                  }
                />
              </Route>

              <Route element={<ImpactMapLayout />}>
                <Route
                  path="impact-map"
                  element={
                    <LazyPage>
                      <ImpactMap />
                    </LazyPage>
                  }
                />
                <Route
                  path="impact"
                  element={
                    <LazyPage>
                      <YouthImpactPulse />
                    </LazyPage>
                  }
                />
              </Route>

              <Route element={<ExploreLayout />}>
                <Route
                  path="movements"
                  element={
                    <LazyPage>
                      <Movements />
                    </LazyPage>
                  }
                />
                <Route
                  path="discover"
                  element={
                    <LazyPage>
                      <Discover />
                    </LazyPage>
                  }
                />
                <Route
                  path="explore"
                  element={
                    <LazyPage>
                      <Explore />
                    </LazyPage>
                  }
                />
                <Route
                  path="explore/relief"
                  element={
                    <LazyPage>
                      <ReliefHub mode="guest" />
                    </LazyPage>
                  }
                />
                <Route
                  path="explore/:id"
                  element={
                    <LazyPage>
                      <MovementDetail
                        mode="guest"
                        backTo="/movements"
                        backLabel="Back to Movements"
                      />
                    </LazyPage>
                  }
                />
                <Route
                  path="movements/:id"
                  element={
                    <LazyPage>
                      <MovementDetail
                        mode="guest"
                        backTo="/movements"
                        backLabel="Back to Movements"
                      />
                    </LazyPage>
                  }
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="feed"
                  element={
                    <LazyPage>
                      <Feed />
                    </LazyPage>
                  }
                />
                <Route
                  path="relief"
                  element={
                    <LazyPage>
                      <ReliefHub />
                    </LazyPage>
                  }
                />
                <Route
                  path="relief/create"
                  element={
                    <LazyPage>
                      <CreateReliefPost />
                    </LazyPage>
                  }
                />
                <Route
                  path="feed/:id"
                  element={
                    <LazyPage>
                      <MovementDetail mode="member" backTo="/feed" backLabel="Back to feed" />
                    </LazyPage>
                  }
                />
                <Route
                  path="create"
                  element={
                    <LazyPage>
                      <CreatePostRoute />
                    </LazyPage>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <LazyPage>
                      <Profile />
                    </LazyPage>
                  }
                />
                <Route
                  path="admin/moderation"
                  element={
                    <AdminRoute>
                      <LazyPage>
                        <AdminModeration />
                      </LazyPage>
                    </AdminRoute>
                  }
                />
                <Route
                  path="admin/trust-review"
                  element={
                    <AdminRoute>
                      <LazyPage>
                        <AdminTrustReview />
                      </LazyPage>
                    </AdminRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </ReportContentProvider>
        </JoinMovementProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
