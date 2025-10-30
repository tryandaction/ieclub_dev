import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import Loading from './components/Loading'
import Layout from './components/Layout'
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
import useLoadingStore from './stores/loadingStore'

function App() {
  const { isLoading, loadingText } = useLoadingStore()
  
  return (
    <ErrorBoundary>
      <ToastContainer />
      <Loading show={isLoading} text={loadingText} fullscreen />
      <Routes>
        {/* 认证页面（无布局） */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* 主应用（带布局） */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plaza" replace />} />
          <Route path="plaza" element={<Plaza />} />
          <Route path="topic/:id" element={<TopicDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="community" element={<Community />} />
          <Route path="activities" element={<Activities />} />
          <Route path="publish" element={<Publish />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App

