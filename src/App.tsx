import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { isPublicMarketingRoute } from './lib/publicRoutes'
import AdminRoute from './components/AdminRoute'
import AuthNavigationRegistrar from './components/auth/AuthNavigationRegistrar'
import LogoutOverlay from './components/auth/LogoutOverlay'
import ScrollRestoration from './components/ScrollRestoration'
import JoinMovementModalHost from './components/JoinMovementModalHost'
import Layout from './components/Layout'
import ExploreLayout from './components/ExploreLayout'
import ImpactMapLayout from './components/ImpactMapLayout'
import InspireHubLayout from './components/InspireHubLayout'
import AppLayout from './components/AppLayout'
import InspireCreateGate from './components/routing/InspireCreateGate'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingGate from './components/OnboardingGate'
import GuestRoute from './components/GuestRoute'
import PageLoader from './components/PageLoader'
import DeployConfigBanner from './components/DeployConfigBanner'
import HomeRoute from './components/HomeRoute'
import SessionExpiryHandler from './components/SessionExpiryHandler'
import PublicShareRedirect from './components/routing/PublicShareRedirect'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Explore = lazy(() => import('./pages/Explore'))
const Movements = lazy(() => import('./pages/Movements'))
const Discover = lazy(() => import('./pages/Discover'))
const ImpactMap = lazy(() => import('./pages/ImpactMap'))
const Feed = lazy(() => import('./pages/Feed'))
const CreatePost = lazy(() => import('./pages/CreatePost'))
const Profile = lazy(() => import('./pages/Profile'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const MovementDetail = lazy(() => import('./pages/MovementDetail'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminContent = lazy(() => import('./pages/admin/AdminContent'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminModeration = lazy(() => import('./pages/AdminModeration'))
const AdminTrustReview = lazy(() => import('./pages/AdminTrustReview'))
const ReliefHub = lazy(() => import('./pages/ReliefHub'))
const ReliefCampaignDetail = lazy(() => import('./pages/ReliefCampaignDetail'))
const CreateReliefPost = lazy(() => import('./pages/CreateReliefPost'))
const VerificationCenter = lazy(() => import('./pages/VerificationCenter'))
const YouthImpactPulse = lazy(() => import('./pages/YouthImpactPulse'))
const CommunityPolls = lazy(() => import('./pages/CommunityPolls'))
const InspireHub = lazy(() => import('./pages/InspireHub'))
const InspireDetail = lazy(() => import('./pages/InspireDetail'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'))
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'))
const Contact = lazy(() => import('./pages/Contact'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const NotFound = lazy(() => import('./pages/NotFound'))

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

/** Remount create form when sidebar switches movement vs poll links (runs in App bundle, not lazy chunk). */
function CreatePostRoute() {
  const [searchParams] = useSearchParams()
  const modeKey = searchParams.get('type') ?? 'movement'
  return (
    <Suspense fallback={<PageLoader />}>
      <CreatePost key={modeKey} />
    </Suspense>
  )
}

function AppFrame({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isMarketing = isPublicMarketingRoute(location.pathname)
  const [themeTransitions, setThemeTransitions] = useState(false)

  useEffect(() => {
    setThemeTransitions(false)
    if (isMarketing) return
    const id = window.requestAnimationFrame(() => setThemeTransitions(true))
    return () => window.cancelAnimationFrame(id)
  }, [isMarketing, location.pathname])

  return (
    <div className={`min-h-screen ${themeTransitions ? 'theme-transition' : ''}`}>{children}</div>
  )
}

export default function App() {
  return (
    <>
      <AuthNavigationRegistrar />
      <ScrollRestoration />
      <LogoutOverlay />
      <SessionExpiryHandler />
      <JoinMovementModalHost />
      <AppFrame>
        <DeployConfigBanner />
        <Routes>
              <Route path="post/:id" element={<PublicShareRedirect />} />
              <Route path="petition/:id" element={<PublicShareRedirect />} />
              <Route path="poll/:id" element={<PublicShareRedirect />} />
              <Route path="volunteer/:id" element={<PublicShareRedirect />} />
              <Route path="voice/:id" element={<PublicShareRedirect />} />
              <Route element={<Layout />}>
                <Route index element={<HomeRoute />} />
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
                <Route
                  path="how-it-works"
                  element={
                    <LazyPage>
                      <HowItWorks />
                    </LazyPage>
                  }
                />
                <Route
                  path="*"
                  element={
                    <LazyPage>
                      <NotFound />
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

              <Route path="inspire" element={<InspireHubLayout />}>
                <Route
                  index
                  element={
                    <LazyPage>
                      <InspireHub />
                    </LazyPage>
                  }
                />
                <Route
                  path="create"
                  element={
                    <LazyPage>
                      <InspireCreateGate />
                    </LazyPage>
                  }
                />
                <Route
                  path=":id"
                  element={
                    <LazyPage>
                      <InspireDetail />
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
                  path="explore/relief/:id"
                  element={
                    <LazyPage>
                      <ReliefCampaignDetail mode="guest" />
                    </LazyPage>
                  }
                />
                <Route
                  path="explore/polls"
                  element={
                    <LazyPage>
                      <CommunityPolls mode="guest" />
                    </LazyPage>
                  }
                />
                <Route
                  path="explore/:id"
                  element={
                    <LazyPage>
                      <MovementDetail
                        mode="guest"
                        backTo="/explore"
                        backLabel="Back to explore"
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
                        backTo="/explore"
                        backLabel="Back to explore"
                      />
                    </LazyPage>
                  }
                />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <OnboardingGate>
                      <Outlet />
                    </OnboardingGate>
                  </ProtectedRoute>
                }
              >
                <Route
                  path="onboarding"
                  element={
                    <LazyPage>
                      <Onboarding />
                    </LazyPage>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <AdminRoute>
                      <LazyPage>
                        <AdminLayout />
                      </LazyPage>
                    </AdminRoute>
                  }
                >
                  <Route
                    index
                    element={
                      <LazyPage>
                        <AdminDashboard />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="users"
                    element={
                      <LazyPage>
                        <AdminUsers />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="content"
                    element={
                      <LazyPage>
                        <AdminContent />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <LazyPage>
                        <AdminReports />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="moderation"
                    element={
                      <LazyPage>
                        <AdminModeration />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="trust-review"
                    element={
                      <LazyPage>
                        <AdminTrustReview />
                      </LazyPage>
                    }
                  />
                </Route>
                <Route element={<AppLayout />}>
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
                  path="relief/:id"
                  element={
                    <LazyPage>
                      <ReliefCampaignDetail />
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
                  path="verification"
                  element={
                    <LazyPage>
                      <VerificationCenter />
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
                <Route path="create" element={<CreatePostRoute />} />
                <Route
                  path="polls"
                  element={
                    <LazyPage>
                      <CommunityPolls mode="member" />
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
                </Route>
              </Route>

        </Routes>
      </AppFrame>
    </>
  )
}
