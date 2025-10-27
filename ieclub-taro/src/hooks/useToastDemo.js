/**
 * Toast使用示例Hook
 * 展示如何在各种场景下使用Toast通知
 */
import { useToast } from '../components/common/Toast.jsx';

export const useToastDemo = () => {
  const toast = useToast();

  // 成功示例
  const showSuccessToast = () => {
    toast.success('操作成功！', {
      title: '成功',
      duration: 3000
    });
  };

  // 错误示例
  const showErrorToast = () => {
    toast.error('操作失败，请重试', {
      title: '错误',
      duration: 5000
    });
  };

  // 警告示例
  const showWarningToast = () => {
    toast.warning('请先完善个人信息', {
      title: '提示',
      duration: 4000
    });
  };

  // 信息示例
  const showInfoToast = () => {
    toast.info('您有新的消息', {
      duration: 3000
    });
  };

  // API调用成功示例
  const showApiSuccessToast = (action = '操作') => {
    toast.success(`${action}成功！`, {
      duration: 2000
    });
  };

  // API调用失败示例
  const showApiErrorToast = (error) => {
    const message = error?.message || '网络错误，请稍后重试';
    toast.error(message, {
      title: '操作失败',
      duration: 5000
    });
  };

  // 表单验证错误
  const showValidationError = (field) => {
    toast.warning(`${field}不能为空`, {
      title: '验证失败',
      duration: 3000
    });
  };

  // 持久化通知（需要手动关闭）
  const showPersistentToast = () => {
    toast.info('这条通知需要手动关闭', {
      title: '重要提示',
      duration: 0 // 0表示不自动关闭
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showApiSuccessToast,
    showApiErrorToast,
    showValidationError,
    showPersistentToast,
    toast // 导出原始toast对象供自定义使用
  };
};

export default useToastDemo;

