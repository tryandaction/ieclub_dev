/**
 * 路由配置文件
 * 集中管理所有路由
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

// 页面组件懒加载
const HomePage = React.lazy(() => import('../pages/home/HomePage.jsx').then(m => ({ default: m.HomePage })));
const TopicDetailPage = React.lazy(() => import('../pages/TopicDetailPage.jsx'));
const SearchPage = React.lazy(() => import('../pages/SearchPage.jsx'));
const EventsPage = React.lazy(() => import('../pages/events/EventsPage.jsx').then(m => ({ default: m.EventsPage })));
const EventDetailPage = React.lazy(() => import('../pages/events/EventDetailPage.jsx').then(m => ({ default: m.EventDetailPage })));
const MatchPage = React.lazy(() => import('../pages/match/MatchPage.jsx').then(m => ({ default: m.MatchPage })));
const CommunityPage = React.lazy(() => import('../pages/community/CommunityPage.jsx').then(m => ({ default: m.CommunityPage })));
const ProfilePage = React.lazy(() => import('../pages/profile/ProfilePage.jsx').then(m => ({ default: m.ProfilePage })));
const LeaderboardPage = React.lazy(() => import('../pages/leaderboard/LeaderboardPage.jsx').then(m => ({ default: m.LeaderboardPage })));
const BookmarksPage = React.lazy(() => import('../pages/bookmarks/BookmarksPage.jsx').then(m => ({ default: m.BookmarksPage })));
const SettingsPage = React.lazy(() => import('../pages/settings/SettingsPage.jsx').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = React.lazy(() => import('../pages/notifications/NotificationsPage.jsx'));
const LoginPage = React.lazy(() => import('../pages/auth/LoginPage.jsx').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../pages/auth/RegisterPage.jsx').then(m => ({ default: m.RegisterPage })));

/**
 * 路由配置
 * 每个路由对象包含：
 * - path: 路径
 * - element: 组件
 * - title: 页面标题
 * - requireAuth: 是否需要登录
 * - layout: 是否使用主布局（默认true）
 */
export const routes = [
  // ===== 认证相关页面（无需布局） =====
  {
    path: '/login',
    element: <LoginPage />,
    title: '登录 - IEClub',
    requireAuth: false,
    layout: false,
  },
  {
    path: '/register',
    element: <RegisterPage />,
    title: '注册 - IEClub',
    requireAuth: false,
    layout: false,
  },

  // ===== 主应用页面（需要布局） =====
  {
    path: '/',
    element: <HomePage />,
    title: '话题广场 - IEClub',
    requireAuth: false, // 首页可以不登录访问，但功能有限
    layout: true,
  },
  {
    path: '/square',
    element: <HomePage />,
    title: '话题广场 - IEClub',
    requireAuth: false,
    layout: true,
  },
  {
    path: '/topics/:id',
    element: <TopicDetailPage />,
    title: '话题详情 - IEClub',
    requireAuth: false,
    layout: false, // 话题详情页使用自定义布局
  },
  {
    path: '/search',
    element: <SearchPage />,
    title: '搜索 - IEClub',
    requireAuth: false,
    layout: false, // 搜索页使用自定义布局
  },
  {
    path: '/events',
    element: <EventsPage />,
    title: '活动广场 - IEClub',
    requireAuth: false,
    layout: true,
  },
  {
    path: '/events/:id',
    element: <EventDetailPage />,
    title: '活动详情 - IEClub',
    requireAuth: false,
    layout: false, // 活动详情页使用自定义布局
  },
  {
    path: '/community',
    element: <CommunityPage />,
    title: '社区 - IEClub',
    requireAuth: false,
    layout: true,
  },
  {
    path: '/leaderboard',
    element: <LeaderboardPage />,
    title: '排行榜 - IEClub',
    requireAuth: false,
    layout: true,
  },
  {
    path: '/bookmarks',
    element: <BookmarksPage />,
    title: '我的收藏 - IEClub',
    requireAuth: true, // 收藏需要登录
    layout: true,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
    title: '个人主页 - IEClub',
    requireAuth: true,
    layout: true,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
    title: '设置 - IEClub',
    requireAuth: true,
    layout: true,
  },
  {
    path: '/notifications',
    element: <NotificationsPage />,
    title: '通知中心 - IEClub',
    requireAuth: true,
    layout: false, // 通知中心使用自定义布局
  },

  // ===== 404页面 =====
  {
    path: '*',
    element: <Navigate to="/" replace />,
    title: 'IEClub',
    requireAuth: false,
    layout: false,
  },
];

export default routes;

