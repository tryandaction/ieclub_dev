// ieclub-taro/src/components/CustomIcons/index.tsx
import { View } from '@tarojs/components';
import './index.scss';

interface IconProps {
  active?: boolean;
  size?: number;
  className?: string;
}

interface NotificationIconProps extends IconProps {
  hasUnread?: boolean;
}

// 广场图标
export const SquareIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`custom-icon square-icon ${active ? 'active' : ''} ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
      <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
      <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
    </svg>
  </View>
);

// 社区图标
export const CommunityIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`custom-icon community-icon ${active ? 'active' : ''} ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </View>
);

// 发布加号图标（大号）
export const PlusIcon: React.FC<{ size?: number; className?: string }> = ({ size = 56, className = '' }) => (
  <View className={`custom-icon plus-icon ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#gradient)" />
      <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
    </svg>
  </View>
);

// 通知图标
export const NotificationIcon: React.FC<NotificationIconProps> = ({ 
  active = false, 
  size = 24, 
  hasUnread = false,
  className = ''
}) => (
  <View className={`custom-icon notification-icon ${active ? 'active' : ''} ${className}`} style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {hasUnread && (
      <View className="unread-dot" style={{
        position: 'absolute',
        top: '2px',
        right: '2px',
        width: '8px',
        height: '8px',
        background: '#ef4444',
        borderRadius: '50%',
        border: '2px solid white'
      }}></View>
    )}
  </View>
);

// 个人主页/我的图标
export const ProfileIcon: React.FC<IconProps> = ({ active = false, size = 24, className = '' }) => (
  <View className={`custom-icon profile-icon ${active ? 'active' : ''} ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill={active ? 'currentColor' : 'none'} />
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill={active ? 'currentColor' : 'none'} />
    </svg>
  </View>
);

// 默认头像图标
export const DefaultAvatarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 40, className = '' }) => (
  <View className={`custom-icon default-avatar ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#e5e7eb" />
      <circle cx="20" cy="16" r="6" fill="#9ca3af" />
      <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#9ca3af" />
    </svg>
  </View>
);

// 默认封面图标
export const DefaultCoverIcon: React.FC<{ 
  width?: string; 
  height?: string;
  className?: string;
}> = ({ 
  width = '100%', 
  height = '160px',
  className = ''
}) => (
  <View 
    className={`custom-icon default-cover ${className}`} 
    style={{ 
      width, 
      height, 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}
  >
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <circle cx="8.5" cy="8.5" r="2.5" stroke="white" strokeWidth="1.5" opacity="0.5" />
      <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  </View>
);

export default {
  SquareIcon,
  CommunityIcon,
  PlusIcon,
  NotificationIcon,
  ProfileIcon,
  DefaultAvatarIcon,
  DefaultCoverIcon
};