# 网络诊断系统已就绪

> 📌 **创建日期**: 2025-11-05  
> 🎯 **目的**: 解决部署时的网络连接问题（特别是Clash代理干扰）

---

## ✅ 完成内容

### 1. 网络诊断脚本

创建了自动化网络诊断工具：`scripts/health-check/Check-Network.ps1`

**功能**：
- ✅ 检测Clash代理干扰
- ✅ Ping测试服务器可达性
- ✅ 端口连通性测试（SSH 22, HTTPS 443, API 3001）
- ✅ HTTPS服务测试
- ✅ SSH连接测试
- ✅ 智能诊断结果和修复建议

**使用方法**：
```powershell
.\scripts\health-check\Check-Network.ps1
```

**输出示例**：
```
IEClub Server Connection Diagnostics
============================================================

[1] Checking proxy settings...
  WARNING: Clash proxy detected
     Interface: Clash
     Source Address: 198.18.0.1

[2] Ping test...
  OK: Ping successful - server is reachable

[3] Port connectivity test...
  OK: SSH (port 22) - connected
  OK: HTTPS (port 443) - connected
  OK: Test Environment API (port 3001) - connected

[4] HTTPS service test...
  FAILED: HTTPS service error: timeout

[5] SSH connection test...
  Testing (timeout 10s)...
  FAILED: SSH connection failed
     Error: Connection timed out during banner exchange

============================================================
Diagnosis Results
============================================================

WARNING: Clash proxy is interfering with connections

Solutions:
  1. Add rule in Clash:
     - Rule Type: DOMAIN
     - Content: ieclub.online
     - Policy: DIRECT

  2. Or temporarily disable Clash:
     - Right-click Clash icon -> 'Exit System Proxy' or 'Quit Clash'

  3. Re-run this script after making changes
```

---

### 2. Clash配置详细指南

创建了完整的Clash配置文档：`docs/configuration/CLASH_PROXY_SETUP.md`

**内容包括**：
- ✅ 问题症状识别
- ✅ 4种解决方案（配置规则/界面添加/临时关闭/PAC模式）
- ✅ 详细配置步骤（适配Clash for Windows和Clash Verge）
- ✅ 配置文件示例
- ✅ 技术原理说明
- ✅ 故障排查指南
- ✅ 配置文件位置说明

**核心解决方案**：

在Clash配置文件的 `rules:` 部分**最前面**添加：
```yaml
rules:
  # IEClub服务器直连规则（必须放在最前面）
  - DOMAIN,ieclub.online,DIRECT
  - IP-CIDR,39.108.160.112/32,DIRECT
  
  # 原有的其他规则...
```

---

### 3. 更新REMIND.md

在快速参考文档中添加了Clash问题排查部分：

**位置**：`故障排查 → 常见问题 → 0. 🚨 Clash代理干扰SSH连接`

**内容**：
- 症状识别
- 2种解决方案（配置规则/临时关闭）
- 验证步骤
- 链接到详细文档

---

### 4. 更新文档索引

在 `docs/INDEX.md` 中添加：

**配置文档部分**：
```markdown
| **CLASH_PROXY_SETUP.md** | Clash代理配置（解决SSH连接问题） ⭐⭐ |
```

**脚本部分**：
```markdown
| **health-check/Check-Network.ps1** | 网络连接诊断（部署前必查） ⭐⭐⭐ |
```

**快速导航部分**：
```markdown
#### 🔧 解决Clash代理问题
→ 查看 **docs/configuration/CLASH_PROXY_SETUP.md** ⭐⭐  
→ 运行 `.\scripts\health-check\Check-Network.ps1` 诊断网络
```

---

## 🚀 使用流程

### 部署前检查

```powershell
# 1. 运行网络诊断
.\scripts\health-check\Check-Network.ps1

# 2. 如果检测到Clash干扰
#    → 按照提示配置Clash或临时关闭

# 3. 再次运行验证
.\scripts\health-check\Check-Network.ps1

# 4. 看到 "OK: No proxy interference detected" 后
#    → 开始部署
.\scripts\deployment\Deploy-Staging.ps1 -Target all
```

---

## 📊 技术细节

### 问题根源

**Clash代理干扰原理**：
1. Clash在全局模式下拦截所有网络流量
2. SSH协议需要直接的端到端连接
3. 代理服务器可能不支持SSH协议的特殊握手过程
4. 导致连接超时：`Connection timed out during banner exchange`

**检测方法**：
```powershell
Test-NetConnection -ComputerName ieclub.online -Port 443 -InformationLevel Detailed
```

如果输出显示：
```
InterfaceAlias: Clash
SourceAddress: 198.18.0.1
```
说明流量被Clash拦截。

### 解决原理

**DIRECT规则**：
- 告诉Clash对匹配的域名/IP使用直连
- 不经过代理服务器
- 规则必须放在配置文件 `rules:` 部分的**最前面**
- 否则可能被后续规则（如 `MATCH,Proxy`）覆盖

---

## 📚 文档结构

```
docs/
├── configuration/
│   ├── CLASH_PROXY_SETUP.md        # Clash详细配置指南
│   └── ...
├── INDEX.md                         # 更新了快速导航
└── NETWORK_DIAGNOSTICS_SETUP.md    # 本文档

scripts/
└── health-check/
    ├── Check-Network.ps1            # 网络诊断脚本
    └── ...

REMIND.md                            # 添加了Clash问题排查
```

---

## 🎯 下一步操作

1. **配置Clash**（如果你在使用）：
   - 打开 `docs/configuration/CLASH_PROXY_SETUP.md`
   - 按照步骤添加DIRECT规则

2. **验证网络**：
   ```powershell
   .\scripts\health-check\Check-Network.ps1
   ```

3. **开始部署**：
   ```powershell
   .\scripts\deployment\Deploy-Staging.ps1 -Target all
   ```

---

## 💡 常见问题

### Q1: 为什么之前部署会卡住？
**A**: Clash代理拦截了SSH连接，导致超时。

### Q2: 必须关闭Clash吗？
**A**: 不必须。推荐配置DIRECT规则，这样可以继续使用代理访问其他网站。

### Q3: 配置规则后还是超时？
**A**: 
1. 确保规则在配置文件的**最前面**
2. 完全重启Clash（不是重载配置）
3. 清除DNS缓存：`ipconfig /flushdns`

### Q4: 找不到Clash配置文件？
**A**: 查看文档中的"故障排查 → 问题2"，有详细路径说明。

---

**最后更新**: 2025-11-05  
**相关文档**: [Clash配置指南](./configuration/CLASH_PROXY_SETUP.md) | [REMIND.md](../REMIND.md)

