import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { getMe } from './store/slices/authSlice';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Content from './pages/Content';
import Settings from './pages/Settings';
import './App.less';

// 路由守卫
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, admin } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isAuthenticated && !admin) {
      dispatch(getMe());
    }
  }, [isAuthenticated, admin, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="users" element={<Users />} />
          <Route path="content" element={<Content />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit" element={<Audit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div style={{ padding: 24, textAlign: 'center' }}>页面开发中...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <AppContent />
      </ConfigProvider>
    </Provider>
  );
};

export default App;

