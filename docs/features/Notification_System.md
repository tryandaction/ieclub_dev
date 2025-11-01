# 通知系统使用指南

> **版本**: v1.0  
> **更新日期**: 2025-10-31  
> **作者**: IEClub 开发团队

---

## 📋 目录

1. [系统概览](#系统概览)
2. [功能特性](#功能特性)
3. [后端实现](#后端实现)
4. [前端实现](#前端实现)
5. [WebSocket 实时推送](#websocket-实时推送)
6. [使用示例](#使用示例)
7. [常见问题](#常见问题)

---

## 系统概览

IEClub 通知系统是一个功能完整的实时通知解决方案，支持多种通知类型和 WebSocket 实时推送。

### 核心特性

- ✅ **实时推送**: 基于 WebSocket 的实时通知
- ✅ **多种类型**: 支持点赞、评论、回复、关注等多种通知
- ✅ **已读管理**: 标记已读、全部已读、清空已读
- ✅ **通知设置**: 个性化通知偏好设置
- ✅ **自动重连**: WebSocket 断线自动重连
- ✅ **心跳机制**: 保持连接活跃

---

## 功能特性

### 1. 通知类型

| 类型 | 说明 | 图标 | 触发场景 |
|------|------|------|----------|
| `like` | 点赞通知 | ❤️ | 话题或评论被点赞 |
| `comment` | 评论通知 | 💬 | 话题被评论 |
| `reply` | 回复通知 | ↩️ | 评论被回复 |
| `follow` | 关注通知 | 👤 | 被其他用户关注 |
| `activity` | 活动通知 | 📅 | 活动相关更新 |
| `system` | 系统通知 | 🔔 | 系统公告 |
| `credit` | 积分通知 | 💰 | 积分变化 |
| `badge` | 勋章通知 | 🏆 | 获得新勋章 |

### 2. 通知状态

- **未读** (isRead: false): 新收到的通知
- **已读** (isRead: true): 用户已查看的通知

### 3. 通知操作

- **查看通知**: 获取通知列表，支持分页和筛选
- **标记已读**: 单条标记或全部标记
- **删除通知**: 删除单条或批量删除
- **清空已读**: 清空所有已读通知

---

## 后端实现

### 文件结构

```
ieclub-backend/src/
├── services/
│   ├── notificationService.js    # 通知服务层
│   └── websocketService.js       # WebSocket 服务
├── controllers/
│   └── notificationController.js # 通知控制器
├── routes/
│   └── notificationRoutes.js     # 通知路由
└── prisma/
    └── schema.prisma             # Notification 模型
```

### 核心模块

#### 1. Notification 数据模型

```prisma
model Notification {
  id          String   @id @default(cuid())
  type        String   @db.VarChar(20)    // 通知类型
  title       String   @db.VarChar(100)   // 标题
  content     String   @db.Text           // 内容
  isRead      Boolean  @default(false)    // 是否已读
  readAt      DateTime?                   // 已读时间
  link        String?  @db.Text           // 跳转链接
  userId      String                      // 接收用户ID
  actorId     String?                     // 触发用户ID
  targetType  String   @db.VarChar(20)    // 目标类型
  targetId    String                      // 目标ID
  createdAt   DateTime @default(now())
  
  user        User @relation("NotificationReceiver", ...)
  actor       User? @relation("NotificationSender", ...)
  
  @@index([userId, isRead])
  @@index([createdAt])
}
```

#### 2. 通知服务 API

##### 创建通知

```javascript
const notificationService = require('../services/notificationService');

// 创建点赞通知
await notificationService.createLikeNotification(
  userId,      // 接收者ID
  actorId,     // 点赞者ID
  'topic',     // 目标类型
  topicId,     // 话题ID
  topicTitle   // 话题标题
);

// 创建评论通知
await notificationService.createCommentNotification(
  userId,      // 作者ID
  actorId,     // 评论者ID
  'topic',     // 目标类型
  topicId,     // 话题ID
  topicTitle,  // 话题标题
  commentContent // 评论内容
);

// 创建回复通知
await notificationService.createReplyNotification(
  userId,      // 被回复者ID
  actorId,     // 回复者ID
  commentId,   // 评论ID
  topicId,     // 话题ID
  replyContent // 回复内容
);

// 创建关注通知
await notificationService.createFollowNotification(
  userId,      // 被关注者ID
  actorId      // 关注者ID
);

// 创建系统通知
await notificationService.createSystemNotification(
  userId,      // 用户ID (null表示发送给所有用户)
  '系统公告',
  '内容...',
  '/link'
);
```

##### WebSocket 实时推送

```javascript
const websocketService = require('../services/websocketService');

// 发送通知给指定用户
const notification = await notificationService.createLikeNotification(...);
websocketService.sendNotification(userId, notification);

// 广播给所有在线用户
websocketService.broadcast({
  type: 'system_announcement',
  data: { message: '系统维护通知' }
});

// 发送给房间内的用户
websocketService.sendToRoom('topic_123', {
  type: 'topic_update',
  data: { topicId: '123', action: 'updated' }
});
```

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 获取通知列表 |
| GET | `/api/notifications/unread-count` | 获取未读数量 |
| PUT | `/api/notifications/:id/read` | 标记为已读 |
| PUT | `/api/notifications/read-all` | 全部标记已读 |
| DELETE | `/api/notifications/:id` | 删除通知 |
| POST | `/api/notifications/batch-delete` | 批量删除 |
| DELETE | `/api/notifications/clear-read` | 清空已读 |
| GET | `/api/notifications/settings` | 获取通知设置 |
| PUT | `/api/notifications/settings` | 更新通知设置 |
| POST | `/api/notifications/system` | 创建系统通知（管理员） |

---

## 前端实现

### 文件结构

```
ieclub-web/src/
├── api/
│   └── notification.js           # API 调用
├── components/
│   └── NotificationBadge.jsx     # 通知徽章组件
├── pages/
│   └── Notifications.jsx         # 通知页面
├── hooks/
│   └── useWebSocket.js           # WebSocket Hook
└── utils/
    └── websocket.js              # WebSocket 管理器
```

### 核心组件

#### 1. NotificationBadge 通知徽章

显示未读数量，支持实时更新

```jsx
import NotificationBadge from '../components/NotificationBadge';

<NotificationBadge />
```

#### 2. Notifications 通知页面

完整的通知管理页面，支持筛选、标记、删除等操作

```jsx
import Notifications from '../pages/Notifications';

<Route path="/notifications" element={<Notifications />} />
```

#### 3. useWebSocket Hook

简化 WebSocket 使用

```jsx
import { useWebSocket, useNotifications } from '../hooks/useWebSocket';

// 监听实时通知
useNotifications((notification) => {
  console.log('收到新通知:', notification);
  // 更新 UI、播放音效等
});

// 高级使用
const { on, off, send, joinRoom, leaveRoom, isConnected } = useWebSocket();

// 监听连接状态
on('connected', () => {
  console.log('WebSocket 已连接');
});

// 加入话题房间（实时更新）
joinRoom(`topic_${topicId}`);
```

---

## WebSocket 实时推送

### 连接方式

```javascript
// 自动连接（在 Hook 中）
const { token } = useAuth();
websocketManager.connect(token);

// 手动连接
import websocketManager from '../utils/websocket';
websocketManager.connect(yourToken);
```

### 连接 URL

```
ws://localhost:3000/ws?token=<JWT_TOKEN>
wss://ieclub.online/ws?token=<JWT_TOKEN>
```

### 消息格式

#### 服务器 → 客户端

```json
{
  "type": "notification",
  "data": {
    "id": "notification_id",
    "type": "like",
    "title": "收到新的赞",
    "content": "赞了你的话题：...",
    "actorId": "user_id",
    "targetType": "topic",
    "targetId": "topic_id",
    "isRead": false,
    "createdAt": "2025-10-31T10:00:00Z",
    "actor": {
      "id": "user_id",
      "nickname": "用户昵称",
      "avatar": "头像URL"
    }
  },
  "timestamp": "2025-10-31T10:00:00Z"
}
```

#### 客户端 → 服务器

```json
// 心跳
{
  "type": "ping"
}

// 加入房间
{
  "type": "join_room",
  "roomId": "topic_123"
}

// 离开房间
{
  "type": "leave_room",
  "roomId": "topic_123"
}
```

### 特性

- **自动重连**: 断线后自动重连，最多尝试 5 次
- **心跳机制**: 每 30 秒发送一次 ping
- **房间管理**: 支持加入/离开房间，实现话题级实时更新
- **事件监听**: 支持自定义事件监听

---

## 使用示例

### 后端：创建并推送通知

```javascript
// 在点赞控制器中
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');

// 创建通知
const notification = await notificationService.createLikeNotification(
  topic.authorId,
  userId,
  'topic',
  topicId,
  topic.title
);

// 实时推送
if (notification) {
  websocketService.sendNotification(topic.authorId, notification);
}
```

### 前端：监听并显示通知

```jsx
import { useNotifications } from '../hooks/useWebSocket';
import toast from '../utils/toast';

function MyComponent() {
  // 监听实时通知
  useNotifications((notification) => {
    // 显示 Toast
    toast.success(`${notification.title}: ${notification.content}`);
    
    // 播放音效
    playNotificationSound();
    
    // 更新未读数
    updateUnreadCount();
  });

  return <div>...</div>;
}
```

### 浏览器通知

```javascript
// 请求权限
if ('Notification' in window) {
  Notification.requestPermission();
}

// WebSocket 管理器会自动发送浏览器通知
// 见 websocketManager.handleNotification()
```

---

## 常见问题

### 1. WebSocket 连接失败？

**原因**:
- Token 过期或无效
- 服务器未启动 WebSocket 服务
- 网络问题或防火墙阻止

**解决方案**:
```javascript
// 检查 token
console.log('Token:', token);

// 检查连接状态
console.log('WS State:', websocketManager.getReadyState());

// 查看错误日志
websocketManager.on('error', (error) => {
  console.error('WS Error:', error);
});
```

### 2. 通知没有实时更新？

**检查清单**:
- [ ] WebSocket 是否连接成功
- [ ] 是否正确调用 `useNotifications` Hook
- [ ] 后端是否正确推送通知
- [ ] 检查浏览器控制台是否有错误

### 3. 如何调试 WebSocket？

```javascript
import websocketManager from '../utils/websocket';

// 监听所有事件
websocketManager.on('connected', () => console.log('已连接'));
websocketManager.on('disconnected', () => console.log('已断开'));
websocketManager.on('error', (err) => console.error('错误:', err));
websocketManager.on('notification', (msg) => console.log('通知:', msg));

// 检查连接状态
console.log('连接状态:', websocketManager.isConnected());
```

### 4. 通知数据库表已满怎么办？

建议定期清理已读通知：

```javascript
// 后端定时任务
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 删除 30 天前的已读通知
await prisma.notification.deleteMany({
  where: {
    isRead: true,
    readAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
});
```

### 5. 如何实现通知权限控制？

用户可以在设置中关闭特定类型的通知：

```javascript
// 获取通知设置
const settings = await notificationService.getUserSettings(userId);

// 检查是否允许发送
if (settings.allowLikeNotification) {
  await notificationService.createLikeNotification(...);
}
```

---

## 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_notifications_user_read ON notifications(userId, isRead);
CREATE INDEX idx_notifications_created ON notifications(createdAt);
```

### 2. 缓存未读数量

```javascript
const redis = require('../utils/redis');

// 缓存未读数量
await redis.set(`unread_count:${userId}`, count, 60); // 60秒过期

// 读取缓存
const cached = await redis.get(`unread_count:${userId}`);
```

### 3. 批量推送

```javascript
// 批量创建通知
const notifications = users.map(user => ({
  userId: user.id,
  type: 'system',
  title: '系统公告',
  content: '...'
}));

await notificationService.createNotifications(notifications);
```

---

## 安全考虑

1. **认证**: WebSocket 连接必须携带有效的 JWT Token
2. **权限**: 用户只能查看自己的通知
3. **限流**: 防止频繁创建通知导致的滥用
4. **XSS 防护**: 通知内容需要转义，防止 XSS 攻击

---

## 未来计划

- [ ] 通知分组（按时间、类型）
- [ ] 邮件通知
- [ ] 微信推送（小程序）
- [ ] 通知模板系统
- [ ] 通知订阅管理
- [ ] 通知统计分析

---

**文档版本**: v1.0  
**最后更新**: 2025-10-31  
**维护者**: IEClub 开发团队

