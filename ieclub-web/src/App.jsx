import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Login from './pages/Login'
import Plaza from './pages/Plaza'
import Community from './pages/Community'
import Activities from './pages/Activities'
import Publish from './pages/Publish'
import Profile from './pages/Profile'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* 登录页（无布局） */}
        <Route path="/login" element={<Login />} />
        
        {/* 主应用（带布局） */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plaza" replace />} />
          <Route path="plaza" element={<Plaza />} />
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

