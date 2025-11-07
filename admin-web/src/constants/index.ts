// 常量定义

// 管理员角色
export const ADMIN_ROLES = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '平台管理员', value: 'platform_admin' },
  { label: '内容审核员', value: 'content_moderator' },
  { label: '数据分析员', value: 'data_analyst' },
];

// 管理员状态
export const ADMIN_STATUS = [
  { label: '正常', value: 'active', color: 'success' },
  { label: '停用', value: 'inactive', color: 'default' },
  { label: '锁定', value: 'locked', color: 'error' },
];

// 公告类型
export const ANNOUNCEMENT_TYPES = [
  { label: '系统维护', value: 'system', color: 'red' },
  { label: '功能更新', value: 'feature', color: 'blue' },
  { label: '活动通知', value: 'activity', color: 'green' },
  { label: '政策公告', value: 'policy', color: 'orange' },
  { label: '普通通知', value: 'general', color: 'default' },
];

// 公告优先级
export const ANNOUNCEMENT_PRIORITIES = [
  { label: '低', value: 'low', color: 'default' },
  { label: '中', value: 'medium', color: 'blue' },
  { label: '高', value: 'high', color: 'orange' },
  { label: '紧急', value: 'urgent', color: 'red' },
];

// 公告状态
export const ANNOUNCEMENT_STATUS = [
  { label: '草稿', value: 'draft', color: 'default' },
  { label: '已排期', value: 'scheduled', color: 'blue' },
  { label: '已发布', value: 'published', color: 'success' },
  { label: '已过期', value: 'expired', color: 'warning' },
  { label: '已归档', value: 'archived', color: 'default' },
];

// 公告展示方式
export const ANNOUNCEMENT_DISPLAY_TYPES = [
  { label: '弹窗', value: 'popup', description: '强制查看，用户必须关闭' },
  { label: '横幅', value: 'banner', description: '顶部横幅提示' },
  { label: '通知', value: 'notice', description: '消息中心通知' },
];

// 用户状态
export const USER_STATUS = [
  { label: '正常', value: 'active', color: 'success' },
  { label: '封禁', value: 'banned', color: 'error' },
  { label: '已删除', value: 'deleted', color: 'default' },
];

// 警告级别
export const WARNING_LEVELS = [
  { label: '轻微警告', value: 'minor', color: 'blue' },
  { label: '严重警告', value: 'serious', color: 'orange' },
  { label: '最后警告', value: 'final', color: 'red' },
];

// 封禁时长选项
export const BAN_DURATIONS = [
  { label: '1天', value: 1 },
  { label: '3天', value: 3 },
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
  { label: '90天', value: 90 },
  { label: '永久', value: null },
];

// 举报类别
export const REPORT_CATEGORIES = [
  { label: '垃圾信息', value: 'spam', color: 'default' },
  { label: '骚扰辱骂', value: 'harassment', color: 'red' },
  { label: '不当内容', value: 'inappropriate', color: 'orange' },
  { label: '虚假信息', value: 'misinformation', color: 'blue' },
  { label: '版权侵犯', value: 'copyright', color: 'purple' },
  { label: '其他', value: 'other', color: 'default' },
];

// 举报状态
export const REPORT_STATUS = [
  { label: '待处理', value: 'pending', color: 'default' },
  { label: '处理中', value: 'processing', color: 'blue' },
  { label: '已处理', value: 'resolved', color: 'success' },
  { label: '已驳回', value: 'rejected', color: 'warning' },
];

// 举报处理动作
export const REPORT_ACTIONS = [
  { label: '无操作', value: 'none' },
  { label: '隐藏内容', value: 'hide_content' },
  { label: '删除内容', value: 'delete_content' },
  { label: '警告用户', value: 'warn_user' },
  { label: '封禁用户', value: 'ban_user' },
];

// 审计日志级别
export const AUDIT_LOG_LEVELS = [
  { label: '信息', value: 'info', color: 'blue' },
  { label: '警告', value: 'warning', color: 'orange' },
  { label: '错误', value: 'error', color: 'red' },
];

// 审计日志状态
export const AUDIT_LOG_STATUS = [
  { label: '成功', value: 'success', color: 'success' },
  { label: '失败', value: 'failed', color: 'error' },
];

// 导出格式
export const EXPORT_FORMATS = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'xlsx' },
  { label: 'JSON', value: 'json' },
];

// 分页配置
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
export const DEFAULT_PAGE_SIZE = 10;

// 图表颜色
export const CHART_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
];

// 日期范围预设
export const DATE_RANGES = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '最近7天', value: 'last7days' },
  { label: '最近30天', value: 'last30days' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
];

