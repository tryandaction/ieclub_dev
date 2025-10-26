import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';
import { IconMap, getIcon, IconSize, IconColor } from '../../utils/icons';

/**
 * IEClub 统一图标组件
 * 
 * @param {string} icon - 图标名称（使用 IconMap 中的 key）或完整的 iconify 图标字符串
 * @param {number|string} size - 图标大小，可以是数字（像素）或 IconSize 的 key (xs, sm, md, lg, xl, 2xl, 3xl)
 * @param {string} color - 图标颜色，支持任何有效的 CSS 颜色值
 * @param {string} className - 额外的 CSS 类名
 * @param {function} onClick - 点击事件处理函数
 * @param {object} style - 内联样式对象
 * 
 * @example
 * // 使用预设图标
 * <Icon icon="like" size="md" color="#667eea" />
 * 
 * // 使用预设大小
 * <Icon icon="topicOffer" size="lg" />
 * 
 * // 使用自定义图标
 * <Icon icon="mdi:custom-icon" size={24} />
 * 
 * // 添加点击事件
 * <Icon icon="search" size="md" onClick={handleSearch} className="cursor-pointer" />
 */
const Icon = ({ 
  icon, 
  size = 'md', 
  color, 
  className = '', 
  onClick,
  style = {},
  ...props 
}) => {
  // 获取图标字符串
  const iconString = icon.includes(':') ? icon : getIcon(icon);
  
  // 处理大小：如果是字符串（如 'md'），从 IconSize 中获取；否则直接使用数字
  const iconSize = typeof size === 'string' ? (IconSize[size] || IconSize.md) : size;
  
  // 合并样式
  const mergedStyle = {
    color: color || 'currentColor',
    ...style,
  };

  // 如果有 onClick，添加 cursor-pointer 类
  const mergedClassName = `${className} ${onClick ? 'cursor-pointer' : ''}`.trim();

  return (
    <IconifyIcon
      icon={iconString}
      width={iconSize}
      height={iconSize}
      style={mergedStyle}
      className={mergedClassName}
      onClick={onClick}
      {...props}
    />
  );
};

export default Icon;

// 导出一些常用的预配置图标组件
export const HomeIcon = (props) => <Icon icon="home" {...props} />;
export const SearchIcon = (props) => <Icon icon="search" {...props} />;
export const NotificationIcon = (props) => <Icon icon="notification" {...props} />;
export const LikeIcon = (props) => <Icon icon="like" {...props} />;
export const LikedIcon = (props) => <Icon icon="liked" {...props} />;
export const CommentIcon = (props) => <Icon icon="comment" {...props} />;
export const ShareIcon = (props) => <Icon icon="share" {...props} />;
export const BookmarkIcon = (props) => <Icon icon="bookmark" {...props} />;
export const BookmarkedIcon = (props) => <Icon icon="bookmarked" {...props} />;
export const FollowIcon = (props) => <Icon icon="follow" {...props} />;
export const FollowingIcon = (props) => <Icon icon="following" {...props} />;
export const SettingsIcon = (props) => <Icon icon="settings" {...props} />;
export const EditIcon = (props) => <Icon icon="edit" {...props} />;
export const DeleteIcon = (props) => <Icon icon="delete" {...props} />;
export const ViewIcon = (props) => <Icon icon="view" {...props} />;
export const TrendingIcon = (props) => <Icon icon="trending" {...props} />;
export const FilterIcon = (props) => <Icon icon="filter" {...props} />;
export const SortIcon = (props) => <Icon icon="sort" {...props} />;
export const AddIcon = (props) => <Icon icon="add" {...props} />;
export const CloseIcon = (props) => <Icon icon="close" {...props} />;
export const BackIcon = (props) => <Icon icon="back" {...props} />;
export const MenuIcon = (props) => <Icon icon="menu" {...props} />;
export const MoreIcon = (props) => <Icon icon="more" {...props} />;

