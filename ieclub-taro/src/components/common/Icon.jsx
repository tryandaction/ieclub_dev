/**
 * 统一图标组件
 * 集中管理所有图标，优化打包体积
 */
import React from 'react';

// 按需导入所有需要的 lucide-react 图标
export {
  // OCR 相关
  ScanText,
  Upload,
  Camera,
  Loader,
  Copy,
  CheckCircle,
  X,
  RefreshCw,
  
  // 编辑与操作
  Edit3,
  FileText,
  Plus,
  Trash2,
  Send,
  
  // 用户相关
  Users,
  User,
  UserPlus,
  UserX,
  Shield,
  LogOut,
  
  // 互动
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Bell,
  CheckCheck,
  
  // 成就与排行
  Award,
  Trophy,
  Medal,
  Star,
  Sparkles,
  Zap,
  TrendingUp,
  
  // 导航与视图
  Home,
  Search,
  Filter,
  Grid,
  List,
  
  // 活动相关
  Calendar,
  Clock,
  MapPin,
  
  // 错误与状态
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  
  // 附件与媒体
  Image,
  Paperclip,
  
  // 教育相关
  BookOpen,
  School,
  
  // 通讯
  Mail,
} from 'lucide-react';

/**
 * 图标包装组件 - 提供统一的样式和尺寸
 */
export const Icon = ({ 
  icon: IconComponent, 
  size = 20, 
  color,
  className = '',
  ...props 
}) => {
  if (!IconComponent) return null;
  
  return (
    <IconComponent 
      size={size} 
      color={color}
      className={className}
      {...props}
    />
  );
};

export default Icon;
