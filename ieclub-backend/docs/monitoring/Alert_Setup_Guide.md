# 📢 告警系统配置指南

## 📋 概述

IEClub 后端集成了强大的告警系统，支持多种告警渠道，可以实时监控系统性能并在出现问题时及时通知管理员。

## 🎯 支持的告警渠道

1. **📧 邮件** - 通过 SMTP 发送邮件告警
2. **💬 钉钉** - 发送钉钉群消息
3. **💼 企业微信** - 发送企业微信群消息
4. **💬 Slack** - 发送 Slack 频道消息

## 📊 监控指标

告警系统会自动监控以下指标：

- **CPU 使用率** - 默认阈值：80%
- **内存使用率** - 默认阈值：85%
- **平均响应时间** - 默认阈值：2000ms
- **错误率** - 默认阈值：5%
- **慢请求率** - 默认阈值：10%

## 🚀 快速开始

### 步骤 1: 复制配置文件

```bash
cd ieclub-backend
cp .env.alert.example .env.alert
```

### 步骤 2: 编辑配置文件

根据需要启用和配置告警渠道：

```bash
# Windows
notepad .env.alert

# Linux/Mac
nano .env.alert
```

### 步骤 3: 合并到主配置文件

将 `.env.alert` 中的配置添加到 `.env` 文件中。

### 步骤 4: 重启服务

```bash
npm restart
```

### 步骤 5: 测试告警

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/api/v1/admin/test-alert

# 或者在代码中测试
node -e "const alertSystem = require('./src/utils/alertSystem'); alertSystem.testAlert();"
```

## 📧 邮件告警配置

### Gmail 配置示例

1. **开启两步验证**
   - 访问 https://myaccount.google.com/security
   - 开启"两步验证"

2. **生成应用专用密码**
   - 访问 https://myaccount.google.com/apppasswords
   - 选择"邮件"和"其他设备"
   - 生成密码并复制

3. **配置环境变量**

```env
ALERT_EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL_FROM=your-email@gmail.com
ALERT_EMAIL_TO=admin1@example.com,admin2@example.com
```

### 其他邮箱配置

**QQ 邮箱:**
```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
```

**163 邮箱:**
```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_SECURE=true
```

**阿里云邮箱:**
```env
SMTP_HOST=smtp.aliyun.com
SMTP_PORT=465
SMTP_SECURE=true
```

## 💬 钉钉告警配置

### 步骤 1: 创建钉钉机器人

1. 打开钉钉群聊
2. 点击右上角"群设置"
3. 选择"智能群助手" → "添加机器人"
4. 选择"自定义"机器人
5. 设置机器人名称和头像
6. **安全设置**：选择"加签"（推荐）
7. 复制 Webhook 地址和密钥

### 步骤 2: 配置环境变量

```env
ALERT_DINGTALK_ENABLED=true
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN
DINGTALK_SECRET=YOUR_SECRET
```

### 告警效果

钉钉机器人会发送 Markdown 格式的消息，包含：
- 告警标题和级别
- 详细消息
- 相关数据
- 系统信息

## 💼 企业微信告警配置

### 步骤 1: 创建群机器人

1. 打开企业微信群聊
2. 点击右上角"..."
3. 选择"群机器人" → "添加群机器人"
4. 设置机器人名称
5. 复制 Webhook 地址

### 步骤 2: 配置环境变量

```env
ALERT_WECOM_ENABLED=true
WECOM_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
```

## 💬 Slack 告警配置

### 步骤 1: 创建 Slack App

1. 访问 https://api.slack.com/apps
2. 点击"Create New App"
3. 选择"From scratch"
4. 输入 App 名称和选择工作区
5. 在左侧菜单选择"Incoming Webhooks"
6. 开启"Activate Incoming Webhooks"
7. 点击"Add New Webhook to Workspace"
8. 选择要发送消息的频道
9. 复制 Webhook URL

### 步骤 2: 配置环境变量

```env
ALERT_SLACK_ENABLED=true
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## ⚙️ 告警阈值配置

### 默认阈值

```env
ALERT_THRESHOLD_CPU=80                    # CPU 使用率 > 80%
ALERT_THRESHOLD_MEMORY=85                 # 内存使用率 > 85%
ALERT_THRESHOLD_RESPONSE_TIME=2000        # 响应时间 > 2000ms
ALERT_THRESHOLD_ERROR_RATE=5              # 错误率 > 5%
ALERT_THRESHOLD_SLOW_REQUEST_RATE=10      # 慢请求率 > 10%
ALERT_COOLDOWN=300                        # 冷却时间 5 分钟
```

### 调整建议

**开发环境:**
```env
ALERT_THRESHOLD_CPU=90
ALERT_THRESHOLD_MEMORY=90
ALERT_THRESHOLD_RESPONSE_TIME=3000
ALERT_THRESHOLD_ERROR_RATE=10
```

**生产环境（严格）:**
```env
ALERT_THRESHOLD_CPU=70
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_RESPONSE_TIME=1000
ALERT_THRESHOLD_ERROR_RATE=2
```

**高负载环境:**
```env
ALERT_THRESHOLD_CPU=85
ALERT_THRESHOLD_MEMORY=90
ALERT_THRESHOLD_RESPONSE_TIME=2500
ALERT_THRESHOLD_ERROR_RATE=5
```

## 🔔 告警级别

告警系统支持 4 个级别：

1. **info** (ℹ️) - 信息性告警
2. **warning** (⚠️) - 警告性告警
3. **error** (❌) - 错误告警
4. **critical** (🚨) - 严重告警

### 级别触发条件

- **CPU > 90%** → critical
- **CPU > 80%** → warning
- **内存 > 95%** → critical
- **内存 > 85%** → warning
- **错误率 > 10%** → error
- **错误率 > 5%** → warning

## 🛡️ 防重复告警

告警系统内置冷却机制，防止短时间内重复发送相同告警：

- 默认冷却时间：5 分钟
- 可通过 `ALERT_COOLDOWN` 配置
- 每种告警类型独立计算冷却时间

## 📝 告警内容示例

### 邮件告警

```
标题: [WARNING] CPU 使用率过高

内容:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CPU 使用率过高
级别: WARNING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

告警信息:
CPU 使用率达到 85.5%，超过阈值 80%

详细数据:
- 当前值: 85.5%
- 阈值: 80%
- 负载平均值: [2.5, 2.3, 2.1]

系统信息:
- 主机: ieclub-server-01
- 环境: production
- 时间: 2025-11-02 15:30:00
- 类型: performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 钉钉告警

```markdown
### ⚠️ CPU 使用率过高

**级别:** WARNING

**消息:** CPU 使用率达到 85.5%，超过阈值 80%

**详细数据:**
- current: 85.5%
- threshold: 80%
- loadAverage: [2.5, 2.3, 2.1]

**系统信息:**
- 主机: ieclub-server-01
- 环境: production
- 时间: 2025-11-02 15:30:00
- 类型: performance
```

## 🧪 测试告警

### 方法 1: 使用 API

```bash
curl -X POST http://localhost:3000/api/v1/admin/test-alert \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 方法 2: 使用 Node.js

```javascript
const alertSystem = require('./src/utils/alertSystem');

// 测试告警
await alertSystem.testAlert();

// 发送自定义告警
await alertSystem.sendAlert({
  level: 'warning',
  title: '测试告警',
  message: '这是一条测试消息',
  data: {
    test: true,
  },
  type: 'test',
});
```

### 方法 3: 触发实际告警

```bash
# 模拟高 CPU 使用率
# Linux/Mac
stress --cpu 8 --timeout 60s

# Windows
# 运行 CPU 密集型任务
```

## 🔧 高级配置

### 自定义告警逻辑

编辑 `src/utils/alertSystem.js`：

```javascript
// 添加自定义告警检查
async checkCustomMetrics(metrics) {
  // 自定义逻辑
  if (metrics.custom.value > threshold) {
    await this.sendAlert({
      level: 'warning',
      title: '自定义指标告警',
      message: '...',
      data: metrics.custom,
      type: 'custom',
    });
  }
}
```

### 集成到业务代码

```javascript
const alertSystem = require('./utils/alertSystem');

// 在关键业务逻辑中发送告警
try {
  await criticalOperation();
} catch (error) {
  await alertSystem.sendAlert({
    level: 'error',
    title: '关键操作失败',
    message: error.message,
    data: {
      operation: 'criticalOperation',
      error: error.stack,
    },
    type: 'business',
  });
}
```

## 📊 监控告警统计

查看告警历史：

```bash
# 查看日志
tail -f logs/app.log | grep "告警"

# 查看 Redis 中的告警记录
redis-cli
> KEYS alert:*
> GET alert:history:cpu
```

## 🐛 故障排查

### 问题 1: 邮件告警不工作

**检查清单:**
- [ ] SMTP 配置是否正确
- [ ] 邮箱密码是否正确（使用应用专用密码）
- [ ] 防火墙是否阻止 SMTP 端口
- [ ] 查看日志: `logs/app.log`

**测试 SMTP 连接:**
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP 连接失败:', error);
  } else {
    console.log('SMTP 连接成功');
  }
});
```

### 问题 2: 钉钉告警不工作

**检查清单:**
- [ ] Webhook 地址是否正确
- [ ] 如果启用加签，密钥是否正确
- [ ] 机器人是否被禁用
- [ ] 查看钉钉机器人管理页面

**测试钉钉 Webhook:**
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"msgtype":"text","text":{"content":"测试消息"}}'
```

### 问题 3: 告警发送过于频繁

**解决方案:**
- 增加冷却时间: `ALERT_COOLDOWN=600` (10 分钟)
- 调高告警阈值
- 检查是否有性能问题导致频繁触发

### 问题 4: 没有收到任何告警

**检查清单:**
- [ ] 至少启用一个告警渠道
- [ ] 性能指标是否达到阈值
- [ ] 性能监控是否启动
- [ ] 查看日志确认告警是否发送

**手动触发告警:**
```javascript
const alertSystem = require('./src/utils/alertSystem');
await alertSystem.testAlert();
```

## 📞 技术支持

如有问题，请：
1. 查看日志: `logs/app.log`
2. 查看文档: [README_OPTIMIZATION.md](./README_OPTIMIZATION.md)
3. 联系技术支持: support@ieclub.online

---

**最后更新**: 2025-11-02
**版本**: v2.0.0

