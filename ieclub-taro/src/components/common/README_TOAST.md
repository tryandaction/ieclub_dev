# Toast 通知系统使用指南

## 概述

Toast通知系统提供了一个优雅的方式来显示临时消息，支持成功、错误、警告和信息四种类型。

## 快速开始

### 1. 基本使用

在任何函数组件中使用`useToast` Hook：

```jsx
import { useToast } from '../components/common/Toast.jsx';

function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success('操作成功！');
  };

  return <button onClick={handleClick}>点击我</button>;
}
```

### 2. Toast 类型

#### 成功消息（Success）
```jsx
toast.success('保存成功！', {
  title: '成功',
  duration: 3000
});
```

#### 错误消息（Error）
```jsx
toast.error('操作失败，请重试', {
  title: '错误',
  duration: 5000
});
```

#### 警告消息（Warning）
```jsx
toast.warning('请先完善个人信息', {
  title: '提示',
  duration: 4000
});
```

#### 信息消息（Info）
```jsx
toast.info('您有新的消息', {
  duration: 3000
});
```

### 3. 配置选项

所有Toast方法都支持以下选项：

```jsx
toast.success('消息内容', {
  title: '标题',          // 可选，显示在消息上方
  duration: 3000,        // 持续时间（毫秒），0表示不自动关闭
});
```

### 4. 高级用法

#### 手动关闭Toast
```jsx
const toastId = toast.info('这条消息需要手动关闭', {
  duration: 0
});

// 稍后关闭
toast.closeToast(toastId);
```

#### 关闭所有Toast
```jsx
toast.closeAllToasts();
```

#### 通用方法
```jsx
toast.showToast('自定义消息', {
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  title: '标题',
  duration: 3000
});
```

## 实际应用场景

### 场景1：API调用成功
```jsx
const handleSubmit = async () => {
  try {
    await api.saveData(data);
    toast.success('数据保存成功！');
  } catch (error) {
    toast.error('保存失败，请稍后重试');
  }
};
```

### 场景2：表单验证
```jsx
const handleLogin = () => {
  if (!email) {
    toast.warning('请输入邮箱地址', {
      title: '验证失败'
    });
    return;
  }
  
  if (!password) {
    toast.warning('请输入密码', {
      title: '验证失败'
    });
    return;
  }
  
  // 继续登录逻辑...
};
```

### 场景3：复制到剪贴板
```jsx
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch (error) {
    toast.error('复制失败');
  }
};
```

### 场景4：网络错误处理
```jsx
const fetchData = async () => {
  try {
    const response = await api.getData();
    if (!response.success) {
      toast.error(response.message || '加载失败');
      return;
    }
    setData(response.data);
  } catch (error) {
    if (error.type === 'NETWORK_ERROR') {
      toast.error('网络连接失败，请检查网络设置', {
        title: '网络错误',
        duration: 5000
      });
    } else {
      toast.error('加载失败，请稍后重试');
    }
  }
};
```

### 场景5：长时间操作提示
```jsx
const handleLongOperation = async () => {
  const loadingToastId = toast.info('正在处理，请稍候...', {
    duration: 0 // 不自动关闭
  });

  try {
    await longRunningOperation();
    toast.closeToast(loadingToastId);
    toast.success('操作完成！');
  } catch (error) {
    toast.closeToast(loadingToastId);
    toast.error('操作失败');
  }
};
```

## 最佳实践

### 1. 持续时间建议
- 成功消息：2-3秒
- 错误消息：4-5秒（需要更多时间阅读）
- 警告消息：3-4秒
- 信息消息：3秒

### 2. 消息内容建议
- **简洁明了**：消息应该简短且容易理解
- **具体描述**：告诉用户具体发生了什么
- **提供指导**：如果是错误，告诉用户如何解决

#### 好的例子：
```jsx
toast.success('文章已发布');
toast.error('上传失败：文件大小超过10MB');
toast.warning('密码强度较弱，建议包含数字和特殊字符');
```

#### 不好的例子：
```jsx
toast.success('成功'); // 太模糊
toast.error('错误'); // 没有说明什么错误
toast.warning('警告'); // 没有具体信息
```

### 3. 避免过度使用
- 不要为每个小操作都显示Toast
- 相似的操作可以合并通知
- 考虑使用其他UI反馈方式（如内联提示）

### 4. 用户体验建议
- 重要操作使用Toast确认
- 错误消息提供可操作的建议
- 避免同时显示太多Toast
- 使用适当的持续时间

## 与ErrorBoundary配合使用

Toast系统与ErrorBoundary错误边界组件配合使用，提供完整的错误处理方案：

```jsx
import { useToast } from '../components/common/Toast.jsx';
import { handleAsyncError } from '../utils/errorHandler.js';

function MyComponent() {
  const toast = useToast();

  const fetchData = async () => {
    await handleAsyncError(
      async () => {
        const response = await api.getData();
        return response;
      },
      (error) => {
        // 自动处理错误并显示Toast
        toast.error(error.message, {
          title: '加载失败',
          duration: 5000
        });
      }
    );
  };

  return <div>{/* ... */}</div>;
}
```

## 样式自定义

Toast组件使用Tailwind CSS样式，可以通过修改`Toast.jsx`文件中的样式来自定义外观。

### 位置调整
默认位置在右上角，可以修改容器的定位：

```jsx
// 修改为右下角
<div className="fixed bottom-4 right-4 z-[9999] ...">
```

### 颜色主题
在`TOAST_TYPES`对象中修改颜色配置：

```jsx
const TOAST_TYPES = {
  success: {
    // 自定义颜色...
  }
};
```

## 注意事项

1. **Provider配置**：确保应用被`ToastProvider`包裹
2. **Z-Index**：Toast使用`z-index: 9999`确保在最上层
3. **移动端适配**：Toast在移动端会自动调整大小
4. **性能**：Toast数量会自动限制，避免堆积

## 故障排除

### Toast不显示？
1. 检查是否正确导入`useToast`
2. 确认组件在`ToastProvider`内部
3. 查看控制台是否有错误

### Toast位置不对？
- 检查CSS样式是否被覆盖
- 确认没有其他元素遮挡

### Toast消失太快？
- 增加`duration`参数
- 考虑使用`duration: 0`需要手动关闭

## 参考

- [Toast组件源码](./Toast.jsx)
- [错误处理工具](../../utils/errorHandler.js)
- [使用示例Hook](../../hooks/useToastDemo.js)

