# 活动签到系统技术文档

> 完整的二维码签到解决方案 - 2025-11-01

## 功能概述

实现了基于二维码的活动签到系统，支持组织者生成签到二维码，参与者扫码签到，以及实时签到统计。

---

## 核心功能

### 1. 二维码签到流程

```
组织者端:
1. 创建活动
2. 生成签到二维码（24小时有效）
3. 展示二维码供参与者扫描
4. 查看实时签到统计

参与者端:
1. 报名活动
2. 活动开始后扫描二维码
3. 系统验证令牌有效性
4. 完成签到并获得积分奖励
```

### 2. 安全机制

- ✅ **令牌验证**: 每个二维码包含唯一令牌
- ✅ **时效控制**: 二维码24小时后自动失效
- ✅ **活动匹配**: 验证二维码与活动ID匹配
- ✅ **重复检测**: 防止重复签到
- ✅ **时间限制**: 只能在活动进行期间签到

---

## API 端点

### 生成签到二维码

```http
POST /api/activities/:activityId/qrcode
Authorization: Bearer <token>
```

**权限**: 仅活动组织者

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "abc123...",
    "qrCodeDataURL": "data:image/png;base64,...",
    "expiresAt": "2025-11-02T12:00:00.000Z",
    "activityTitle": "Python工作坊"
  }
}
```

### 签到

```http
POST /api/activities/:activityId/checkin
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "abc123..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "签到成功",
    "checkedInAt": "2025-11-01T14:30:00.000Z"
  }
}
```

### 验证令牌

```http
POST /api/activities/:activityId/verify-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "abc123..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "activityId": "activity_123",
    "message": "令牌有效"
  }
}
```

### 获取签到统计

```http
GET /api/activities/:activityId/checkin-stats
Authorization: Bearer <token>
```

**权限**: 仅活动组织者

**响应**:
```json
{
  "success": true,
  "data": {
    "activityTitle": "Python工作坊",
    "startTime": "2025-11-01T14:00:00.000Z",
    "endTime": "2025-11-01T17:00:00.000Z",
    "totalParticipants": 30,
    "checkedInCount": 25,
    "notCheckedInCount": 5,
    "checkInRate": 83.3,
    "participants": [
      {
        "userId": "user_123",
        "nickname": "张三",
        "avatar": "https://...",
        "email": "zhangsan@sustech.edu.cn",
        "joinedAt": "2025-10-25T10:00:00.000Z",
        "checkedIn": true,
        "checkedInAt": "2025-11-01T14:05:00.000Z",
        "status": "approved"
      }
    ]
  }
}
```

---

## 数据库设计

### ActivityParticipant 表

```prisma
model ActivityParticipant {
  id          String    @id @default(cuid())
  activityId  String
  userId      String
  status      String    @default("approved") // approved, pending, rejected
  joinedAt    DateTime  @default(now())
  checkedIn   Boolean   @default(false)
  checkedInAt DateTime?
  note        String?   // 报名备注
  
  activity    Activity  @relation(fields: [activityId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  
  @@unique([activityId, userId])
  @@index([activityId])
  @@index([userId])
}
```

### Redis 存储结构

```
Key: activity:checkin:{activityId}:{token}
Value: {
  "activityId": "activity_123",
  "createdBy": "user_456",
  "createdAt": "2025-11-01T12:00:00.000Z"
}
TTL: 86400 秒 (24小时)
```

---

## 前端实现

### 网页端 (React)

**活动详情页**: `ieclub-web/src/pages/ActivityDetail.jsx`

**关键功能**:
```javascript
// 生成签到二维码
const handleGenerateQRCode = async () => {
  const res = await generateCheckInQRCode(id)
  setQRCodeData(res.data.data)
  setShowQRCode(true)
}

// 签到
const handleCheckIn = async () => {
  await checkIn(id)
  setHasCheckedIn(true)
  toast.success('签到成功 ✅')
}

// 查看统计
const handleViewStats = async () => {
  const res = await getCheckInStats(id)
  setStats(res.data.data)
  setShowStats(true)
}
```

### 小程序端 (WeChat)

**活动详情页**: `ieclub-frontend/pages/activity-detail/`

**扫码签到**:
```javascript
async handleScanCheckIn() {
  // 1. 调用微信扫码 API
  const scanRes = await wx.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode']
  })

  // 2. 解析二维码数据
  const qrData = JSON.parse(scanRes.result)
  
  // 3. 验证二维码
  if (qrData.type !== 'activity_checkin') {
    wx.showToast({ title: '无效的签到二维码', icon: 'none' })
    return
  }

  // 4. 执行签到
  await api.request({
    url: `/activities/${this.data.activityId}/checkin`,
    method: 'POST',
    data: { token: qrData.token }
  })

  wx.showToast({ title: '签到成功 ✅', icon: 'success' })
}
```

---

## 后端实现

### 服务层 (activityService.js)

#### 生成签到二维码

```javascript
async generateCheckInQRCode(activityId, userId) {
  const crypto = require('crypto')
  const QRCode = require('qrcode')

  // 1. 验证权限
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { organizerId: true, title: true }
  })

  if (activity.organizerId !== userId) {
    throw new AppError('只有活动组织者可以生成签到二维码', 403)
  }

  // 2. 生成唯一令牌
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  // 3. 存储到 Redis
  const redis = require('../config/redis')
  const tokenKey = `activity:checkin:${activityId}:${token}`
  await redis.setex(tokenKey, 24 * 60 * 60, JSON.stringify({
    activityId,
    createdBy: userId,
    createdAt: new Date().toISOString()
  }))

  // 4. 生成二维码数据
  const qrData = JSON.stringify({
    type: 'activity_checkin',
    activityId,
    token,
    expiresAt: expiresAt.toISOString()
  })

  // 5. 生成二维码图片
  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2
  })

  return {
    token,
    qrCodeDataURL,
    expiresAt: expiresAt.toISOString(),
    activityTitle: activity.title
  }
}
```

#### 签到验证

```javascript
async checkIn(activityId, userId, token = null) {
  // 1. 验证令牌
  if (token) {
    const verification = await this.verifyCheckInToken(activityId, token)
    if (!verification.valid) {
      throw new AppError('签到令牌无效或已过期', 400)
    }
  }

  // 2. 检查报名状态
  const participation = await prisma.activityParticipant.findUnique({
    where: {
      activityId_userId: { activityId, userId }
    }
  })

  if (!participation) {
    throw new AppError('未报名该活动', 400)
  }

  if (participation.checkedIn) {
    throw new AppError('已经签到过了', 400)
  }

  // 3. 检查活动时间
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { startTime: true, endTime: true }
  })

  const now = new Date()
  if (now < activity.startTime) {
    throw new AppError('活动尚未开始', 400)
  }

  if (now > activity.endTime) {
    throw new AppError('活动已结束', 400)
  }

  // 4. 执行签到
  await prisma.activityParticipant.update({
    where: { id: participation.id },
    data: {
      checkedIn: true,
      checkedInAt: now
    }
  })

  // 5. 添加积分奖励
  await creditService.addCredits(userId, 'activity_checkin', {
    relatedType: 'activity',
    relatedId: activityId
  })

  return { 
    message: '签到成功',
    checkedInAt: now.toISOString()
  }
}
```

---

## 积分奖励

### 签到积分规则

```javascript
// creditService.js
const CREDIT_RULES = {
  activity_checkin: { 
    credits: 10, 
    exp: 10, 
    reason: '活动签到' 
  }
}
```

**奖励机制**:
- ✅ 签到成功：+10 积分 +10 经验
- ✅ 自动记录到积分历史
- ✅ 关联到活动记录

---

## 使用场景

### 场景 1: 线下活动签到

1. 组织者在活动现场生成签到二维码
2. 将二维码投影到大屏幕或打印出来
3. 参与者使用小程序扫码签到
4. 系统实时更新签到统计

### 场景 2: 在线活动验证

1. 组织者在线上会议中分享签到二维码
2. 参与者截图后使用小程序扫描
3. 验证参与者确实参加了活动

### 场景 3: 签到统计分析

1. 组织者查看签到率
2. 导出参与者签到记录
3. 分析活动参与度
4. 优化未来活动安排

---

## 最佳实践

### 组织者

1. **提前准备**: 活动开始前生成二维码
2. **清晰展示**: 确保二维码足够大且清晰
3. **及时更新**: 如有需要可重新生成二维码
4. **实时监控**: 关注签到统计，及时提醒未签到者

### 参与者

1. **准时到达**: 在活动时间内签到
2. **确认活动**: 扫码前确认是正确的活动
3. **网络连接**: 确保网络畅通
4. **权限授权**: 允许小程序使用相机权限

---

## 错误处理

### 常见错误及解决方案

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 未报名该活动 | 用户未报名就尝试签到 | 先报名活动 |
| 已经签到过了 | 重复签到 | 无需再次签到 |
| 活动尚未开始 | 提前签到 | 等待活动开始 |
| 活动已结束 | 延迟签到 | 联系组织者 |
| 签到令牌无效 | 二维码过期或错误 | 要求组织者重新生成 |
| 二维码与活动不匹配 | 扫描了其他活动的二维码 | 扫描正确的二维码 |

---

## 性能优化

### Redis 缓存

- ✅ 令牌存储在 Redis，快速验证
- ✅ 自动过期，无需手动清理
- ✅ 高并发支持

### 数据库索引

```sql
-- 活动参与者索引
CREATE INDEX idx_activity_participant_activity ON ActivityParticipant(activityId);
CREATE INDEX idx_activity_participant_user ON ActivityParticipant(userId);
CREATE UNIQUE INDEX idx_activity_participant_unique ON ActivityParticipant(activityId, userId);
```

### 并发控制

- ✅ 使用数据库事务防止并发问题
- ✅ 唯一索引防止重复签到
- ✅ 乐观锁机制

---

## 监控指标

### 关键指标

1. **签到率**: `checkedInCount / totalParticipants * 100`
2. **平均签到时间**: 活动开始后多久完成签到
3. **二维码生成次数**: 监控组织者操作
4. **签到失败率**: 分析失败原因

### 日志记录

```javascript
logger.info(`活动 ${activityId} 生成签到二维码，令牌: ${token}`)
logger.info(`用户 ${userId} 在活动 ${activityId} 签到`)
logger.error('签到失败:', error)
```

---

## 未来扩展

### 计划功能

1. **批量签到**: 组织者手动批量签到
2. **地理位置验证**: 验证用户在活动现场
3. **人脸识别签到**: 更安全的签到方式
4. **签到提醒**: 活动开始时推送签到提醒
5. **签到排行**: 显示签到速度排行榜
6. **导出报表**: 导出签到数据为 Excel

---

## 技术栈

- **后端**: Node.js + Express + Prisma
- **数据库**: MySQL + Redis
- **二维码生成**: qrcode (npm)
- **前端**: React + Vite
- **小程序**: WeChat Mini Program
- **认证**: JWT

---

**最后更新**: 2025-11-01  
**负责人**: IEClub 开发团队

