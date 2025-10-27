/**
 * 统一图标组件 - 使用 Iconify
 * 支持通过字符串名称引用图标，无需本地文件
 */
import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

/**
 * 图标映射表 - 将简短名称映射到 Iconify 图标标识符
 * 使用 Material Design Icons (mdi) 图标集
 */
const IconMap = {
  // TabBar 图标
  'square': 'mdi:view-dashboard',
  'community': 'mdi:account-group',
  'publish': 'mdi:plus-circle',
  'activities': 'mdi:calendar-star',
  'profile': 'mdi:account-circle',
  'home': 'mdi:home',
  'users': 'mdi:account-group',
  'calendar': 'mdi:calendar',
  'user': 'mdi:account',
  
  // 功能图标
  'search': 'mdi:magnify',
  'filter': 'mdi:filter-variant',
  'sort': 'mdi:sort-variant',
  'notification': 'mdi:bell',
  'bell': 'mdi:bell',
  'message': 'mdi:message-text',
  'settings': 'mdi:cog',
  'edit': 'mdi:pencil',
  'delete': 'mdi:delete',
  'share': 'mdi:share-variant',
  'bookmark': 'mdi:bookmark-outline',
  'bookmarked': 'mdi:bookmark',
  
  // 互动图标
  'like': 'mdi:heart-outline',
  'liked': 'mdi:heart',
  'comment': 'mdi:comment-outline',
  'view': 'mdi:eye-outline',
  'follow': 'mdi:account-plus',
  'following': 'mdi:account-check',
  
  // 话题类型图标
  'topicOffer': 'mdi:teach',
  'topicDemand': 'mdi:ear-hearing',
  'project': 'mdi:rocket-launch',
  
  // 分类图标
  'study': 'mdi:school',
  'school': 'mdi:school',
  'research': 'mdi:flask',
  'skill': 'mdi:tools',
  'startup': 'mdi:lightbulb',
  'life': 'mdi:heart-pulse',
  
  // 活动图标
  'event': 'mdi:calendar-check',
  'location': 'mdi:map-marker',
  'time': 'mdi:clock-outline',
  'clock': 'mdi:clock-outline',
  'participants': 'mdi:account-multiple',
  'team': 'mdi:account-multiple',
  'online': 'mdi:web',
  'offline': 'mdi:map-marker',
  
  // 成就图标
  'trophy': 'mdi:trophy',
  'medal': 'mdi:medal',
  'star': 'mdi:star',
  'fire': 'mdi:fire',
  'trending': 'mdi:trending-up',
  
  // 状态图标
  'info': 'mdi:information',
  'warning': 'mdi:alert',
  'success': 'mdi:check-circle',
  'error': 'mdi:close-circle',
  'loading': 'mdi:loading',
  'check': 'mdi:check',
  'close': 'mdi:close',
  
  // 上传与文件
  'upload': 'mdi:cloud-upload',
  'download': 'mdi:cloud-download',
  'image': 'mdi:image',
  'file': 'mdi:file',
  'camera': 'mdi:camera',
  
  // 其他
  'link': 'mdi:link-variant',
  'lock': 'mdi:lock',
  'unlock': 'mdi:lock-open',
  'logout': 'mdi:logout',
  'plus': 'mdi:plus',
  'minus': 'mdi:minus',
  'send': 'mdi:send',
  'copy': 'mdi:content-copy',
  'refresh': 'mdi:refresh',
  'external': 'mdi:open-in-new',
};

/**
 * 尺寸预设
 */
const SizeMap = {
  'xs': 14,
  'sm': 16,
  'md': 20,
  'lg': 24,
  'xl': 32,
};

/**
 * Icon 组件
 * @param {string} icon - 图标名称（在 IconMap 中定义）
 * @param {string|number} size - 尺寸（xs/sm/md/lg/xl 或具体数字）
 * @param {string} color - 颜色（CSS颜色值）
 * @param {string} className - 额外的CSS类名
 */
const Icon = ({ 
  icon, 
  size = 'md', 
  color = 'currentColor',
  className = '',
  ...props 
}) => {
  // 获取图标标识符
  const iconIdentifier = IconMap[icon] || icon;
  
  // 解析尺寸
  const iconSize = typeof size === 'number' ? size : (SizeMap[size] || 20);
  
  return (
    <IconifyIcon 
      icon={iconIdentifier}
      width={iconSize}
      height={iconSize}
      color={color}
      className={`inline-block flex-shrink-0 ${className}`}
      {...props}
    />
  );
};

export default Icon;
