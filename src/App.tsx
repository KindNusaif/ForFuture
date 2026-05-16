import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { JoinMovementProvider } from './context/JoinMovementContext'
import { ReportContentProvider } from './context/ReportContentContext'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import ExploreLayout from './components/ExploreLayout'
import ImpactMapLayout from './components/ImpactMapLayout'
import AppLayout from './components/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Explore from './pages/Explore'
import ImpactMap from './pages/ImpactMap'
import Feed from './pages/Feed'
import { CreatePostRoute } from './pages/CreatePost'
import Profile from './pages/Profile'
import MovementDetail from './pages/MovementDetail'
import AdminModeration from './pages/AdminModeration'
import AdminTrustReview from './pages/AdminTrustReview'
import ReliefHub from './pages/ReliefHub'
import CreateReliefPost from './pages/CreateReliefPost'
import YouthImpactPulse from './pages/YouthImpactPulse'

export default function App() {
  return (
    <AuthProvider>
      <JoinMovementProvider>
        <ReportContentProvider>
        <Routes>
          {/* Public marketing */}
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route
              path="login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="signup"
              element={
                <GuestRoute>
                  <Signup />
                </GuestRoute>
              }
            />
            <Route
              path="forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Impact Map — members keep app shell; guests use public nav */}
          <Route element={<ImpactMapLayout />}>
            <Route path="impact-map" element={<ImpactMap />} />
            <Route path="impact" element={<YouthImpactPulse />} />
          </Route>

          {/* Public guest explore — read only */}
          <Route element={<ExploreLayout />}>
            <Route path="explore" element={<Explore />} />
            <Route path="explore/relief" element={<ReliefHub mode="guest" />} />
            <Route
              path="explore/:id"
              element={
                <MovementDetail
                  mode="guest"
                  backTo="/explore"
                  backLabel="Back to Explore Youth Momentum"
                />
              }
            />
          </Route>

          {/* Authenticated app */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="feed" element={<Feed />} />
            <Route path="relief" element={<ReliefHub />} />
            <Route path="relief/create" element={<CreateReliefPost />} />
            <Route
              path="feed/:id"
              element={
                <MovementDetail mode="member" backTo="/feed" backLabel="Back to feed" />
              }
            />
            <Route path="create" element={<CreatePostRoute />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="admin/moderation"
              element={
                <AdminRoute>
                  <AdminModeration />
                </AdminRoute>
              }
            />
            <Route
              path="admin/trust-review"
              element={
                <AdminRoute>
                  <AdminTrustReview />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ReportContentProvider>
      </JoinMovementProvider>
    </AuthProvider>
  )
}
