// 主布局组件
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  NotificationOutlined,
  FileTextOutlined,
  BarChartOutlined,
  WarningOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { hasPermission } from '@/utils/auth';
import type { MenuItem } from '@/types/common';
import './MainLayout.less';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.auth);

  // 生成菜单项
  const menuItems: MenuItem[] = [
    {
      key: '/dashboard',
      label: '仪表盘',
      icon: <DashboardOutlined />,
      path: '/dashboard',
    },
    {
      key: '/announcements',
      label: '公告管理',
      icon: <NotificationOutlined />,
      path: '/announcements',
      permission: 'announcement:read',
    },
    {
      key: '/users',
      label: '用户管理',
      icon: <UserOutlined />,
      path: '/users',
      permission: 'user:read',
    },
    {
      key: '/content',
      label: '内容管理',
      icon: <FileTextOutlined />,
      path: '/content',
      permission: 'content:read',
    },
    {
      key: '/reports',
      label: '举报管理',
      icon: <WarningOutlined />,
      path: '/reports',
      permission: 'report:read',
    },
    {
      key: '/audit',
      label: '审计日志',
      icon: <AuditOutlined />,
      path: '/audit',
      permission: 'audit:view',
    },
    {
      key: '/settings',
      label: '系统设置',
      icon: <SettingOutlined />,
      path: '/settings',
      permission: 'system:setting',
    },
  ];

  // 过滤有权限的菜单
  const filterMenuByPermission = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => !item.permission || hasPermission(admin, item.permission))
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: filterMenuByPermission(item.children),
          };
        }
        return item;
      });
  };

  const visibleMenuItems = filterMenuByPermission(menuItems);

  // 转换为Antd Menu需要的格式
  const getMenuItems = (items: MenuItem[]): any[] => {
    return items.map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
      children: item.children ? getMenuItems(item.children) : undefined,
    }));
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const findPath = (items: MenuItem[], targetKey: string): string | undefined => {
      for (const item of items) {
        if (item.key === targetKey && item.path) {
          return item.path;
        }
        if (item.children) {
          const path = findPath(item.children, targetKey);
          if (path) return path;
        }
      }
    };

    const path = findPath(visibleMenuItems, key);
    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        className="main-sider"
      >
        <div className="logo">
          {!collapsed ? 'IEclub Admin' : 'IE'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(visibleMenuItems)}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        <Header className="main-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-btn"
            />
          </div>

          <div className="header-right">
            <Badge count={0} className="notification-badge">
              <BellOutlined className="header-icon" />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={admin?.avatar}
                />
                <span className="username">{admin?.realName || admin?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

