import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import Loading from './components/Loading'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Plaza from './pages/Plaza'
import TopicDetail from './pages/TopicDetail'
import Search from './pages/Search'
import Community from './pages/Community'
import Activities from './pages/Activities'
import Publish from './pages/Publish'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Feedback from './pages/Feedback'
import MyFeedback from './pages/MyFeedback'
import useLoadingStore from './stores/loadingStore'

function App() {
  const { isLoading, loadingText } = useLoadingStore()
  
  return (
    <AuthProvider>
      <ErrorBoundary>
        <ToastContainer />
        <Loading show={isLoading} text={loadingText} fullscreen />
        <Routes>
          {/* 认证页面（无布局，已登录用户不能访问） */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          
          {/* 主应用（带布局） */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/plaza" replace />} />
            
            {/* 公开页面 - 无需登录 */}
            <Route path="plaza" element={<Plaza />} />
            <Route path="topic/:id" element={<TopicDetail />} />
            <Route path="search" element={<Search />} />
            <Route path="community" element={<Community />} />
            <Route path="activities" element={<Activities />} />
            
            {/* 需要登录的页面 */}
            <Route path="publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="feedback/my" element={<ProtectedRoute><MyFeedback /></ProtectedRoute>} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App

