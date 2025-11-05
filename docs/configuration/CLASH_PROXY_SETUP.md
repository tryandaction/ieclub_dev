# Clash 代理配置指南

> 📌 **重要**: 使用Clash等代理工具时，需要正确配置才能正常部署到服务器

---

## ⚠️ 问题症状

如果遇到以下情况，说明Clash代理正在干扰SSH连接：

```
Connection timed out during banner exchange
Connection to ieclub.online port 22 timed out
```

或者运行网络诊断时显示：
```
WARNING: Clash proxy detected
Interface: Clash
```

---

## 🔍 快速诊断

运行网络诊断脚本：

```powershell
.\scripts\health-check\Check-Network.ps1
```

如果输出显示：
- ✅ `OK: No proxy interference detected` - 正常，可以部署
- ❌ `WARNING: Clash proxy detected` - 需要按下方步骤配置

---

## ✅ 解决方案

### 方法1：配置Clash规则（推荐）⭐

这种方法可以让Clash继续运行，但对ieclub.online使用直连。

#### 步骤1：打开Clash配置文件

**Clash for Windows:**
1. 打开Clash主界面
2. 点击 `Profiles` (配置)
3. 找到当前使用的配置文件
4. 点击配置文件右侧的 `Edit` (编辑) 或直接打开配置文件目录

**Clash Verge (推荐):**
1. 打开Clash Verge
2. 点击 `配置` 或 `Profiles`
3. 右键当前配置 → `编辑文件` 或 `打开文件夹`

#### 步骤2：添加规则

在配置文件中找到 `rules:` 部分，在**最前面**添加以下规则：

```yaml
rules:
  # IEClub服务器直连规则（必须放在最前面）
  - DOMAIN,ieclub.online,DIRECT
  - IP-CIDR,39.108.160.112/32,DIRECT
  
  # 原有的其他规则...
  - DOMAIN-SUFFIX,google.com,Proxy
  # ... 其他规则
```

**完整配置示例**：

```yaml
# Clash配置文件示例
port: 7890
socks-port: 7891
allow-lan: false
mode: rule
log-level: info
external-controller: 127.0.0.1:9090

proxies:
  # 你的代理节点配置...

proxy-groups:
  # 你的代理组配置...
  - name: Proxy
    type: select
    proxies:
      - Auto
      # ...

rules:
  # ========== IEClub服务器直连（必须在最前面）==========
  - DOMAIN,ieclub.online,DIRECT
  - DOMAIN,test.ieclub.online,DIRECT
  - IP-CIDR,39.108.160.112/32,DIRECT
  
  # ========== 以下是原有规则 ==========
  - DOMAIN-SUFFIX,google.com,Proxy
  - DOMAIN-KEYWORD,github,Proxy
  - GEOIP,CN,DIRECT
  - MATCH,Proxy
```

#### 步骤3：保存并重载配置

**Clash for Windows:**
1. 保存配置文件
2. 回到Clash主界面
3. 点击 `General` → 找到 `Reload` 或重启Clash

**Clash Verge:**
1. 保存配置文件
2. 配置会自动重载，或点击 `重载配置`

#### 步骤4：验证修复

运行诊断脚本验证：

```powershell
.\scripts\health-check\Check-Network.ps1
```

应该看到：
```
OK: No proxy interference detected
OK: SSH connection successful
```

---

### 方法2：使用界面添加规则（部分Clash支持）

某些Clash客户端支持通过界面添加规则：

1. 打开Clash主界面
2. 找到 `Rules` (规则) 或 `Settings` (设置)
3. 点击 `Add Rule` (添加规则)
4. 填写：
   - **类型**: `DOMAIN`
   - **匹配内容**: `ieclub.online`
   - **策略**: `DIRECT` (直连)
5. 再添加一条：
   - **类型**: `IP-CIDR`
   - **匹配内容**: `39.108.160.112/32`
   - **策略**: `DIRECT`
6. 保存

---

### 方法3：临时关闭Clash（不推荐）

如果只是临时部署一次，可以暂时关闭Clash：

**Windows:**
1. 右键系统托盘的Clash图标
2. 选择 `退出系统代理` 或 `退出Clash`
3. 部署完成后再重新启动

**macOS:**
1. 点击菜单栏的Clash图标
2. 取消勾选 `Set as System Proxy`
3. 或直接选择 `Quit Clash`

---

### 方法4：使用PAC模式（替代方案）

如果全局模式下问题依然存在，可以切换到PAC模式：

1. 打开Clash
2. 将模式从 `Global` (全局) 切换到 `Rule` (规则) 或 `PAC`
3. 确保配置文件中有DIRECT规则（参考方法1）

---

## 🔬 技术原理

### 为什么Clash会干扰SSH？

1. **全局代理模式**：Clash将所有流量（包括SSH）都通过代理服务器转发
2. **SSH协议特殊性**：SSH需要直接的端到端连接，代理可能破坏握手过程
3. **超时问题**：代理服务器可能不支持或限制SSH协议，导致连接超时

### 为什么需要DIRECT规则？

- `DIRECT` 规则告诉Clash：对于匹配的域名/IP，不使用代理，直接连接
- 规则顺序很重要：**DIRECT规则必须放在最前面**，否则可能被后面的规则覆盖

---

## 📋 配置检查清单

部署前确认：

- [ ] 运行了 `.\scripts\health-check\Check-Network.ps1`
- [ ] 诊断输出显示 `OK: No proxy interference detected`
- [ ] SSH连接测试通过：`OK: SSH connection successful`
- [ ] 如果使用Clash，已添加DIRECT规则
- [ ] 已重载Clash配置

---

## 🛠️ 故障排查

### 问题1：添加规则后仍然超时

**原因**：规则顺序不对，或配置未生效

**解决**：
1. 确保DIRECT规则在配置文件 `rules:` 部分的**最前面**
2. 完全重启Clash（不是重载配置）
3. 再次运行诊断脚本

### 问题2：不知道配置文件在哪

**Clash for Windows:**
```
C:\Users\<用户名>\.config\clash\profiles\<配置名>.yaml
```

**Clash Verge:**
```
C:\Users\<用户名>\.config\clash-verge\profiles\
```

### 问题3：修改配置文件后被覆盖

**原因**：某些Clash客户端会自动更新配置文件

**解决**：
1. 找到配置文件的更新源（通常是订阅链接）
2. 修改本地配置后，禁用自动更新
3. 或在更新源配置中添加DIRECT规则

---

## 📚 相关文档

- [网络诊断脚本](../../scripts/health-check/Check-Network.ps1)
- [部署指南](../deployment/Deployment_guide.md)
- [快速开始](../../REMIND.md)

---

**最后更新**: 2025-11-05

