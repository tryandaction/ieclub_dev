# 修复 authController.js 中所有validateRequired等不存在的函数调用
Write-Host "开始修复 authController.js..." -ForegroundColor Cyan

$file = "ieclub-backend/src/controllers/authController.js"
$content = Get-Content $file -Raw -Encoding UTF8

# 1. 修复所有 validateRequired 调用
$content = $content -replace "const validation = validateRequired\(req\.body, \['email', 'password'\]\);[\s\S]*?message: validation\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: '邮箱和密码不能为空'
        });
      }
"@

$content = $content -replace "const validation = validateRequired\(req\.body, \['email'\]\);[\s\S]*?message: validation\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (!email) {
        return res.status(400).json({
          success: false,
          message: '邮箱地址不能为空'
        });
      }
"@

$content = $content -replace "const validation = validateRequired\(req\.body, \['newPassword'\]\);[\s\S]*?message: validation\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: '新密码不能为空'
        });
      }
"@

$content = $content -replace "const validation = validateRequired\(req\.body, \['oldPassword', 'newPassword'\]\);[\s\S]*?message: validation\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '旧密码和新密码不能为空'
        });
      }
"@

# 2. 删除所有 validatePassword 对验证码的调用（验证码不需要密码强度验证）
$content = $content -replace "const codeValidation = validatePassword\([^)]+\);[\s\S]*?message: codeValidation\.message[\s\S]*?\}\);[\s\S]*?\}", ""

# 3. 删除所有 validateEmailFormat 调用（已有 checkEmailAllowed）
$content = $content -replace "const emailValidation = validateEmailFormat\([^)]+\);[\s\S]*?message: emailValidation\.message[\s\S]*?\}\);[\s\S]*?\}", ""

# 4. 修复 validatePassword 对 password 的调用
$content = $content -replace "const passwordCheck = validatePassword\(password\);[\s\S]*?message: passwordCheck\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度不能少于6个字符'
        });
      }
"@

$content = $content -replace "const passwordCheck = validatePassword\(newPassword\);[\s\S]*?message: passwordCheck\.message[\s\S]*?\}\);[\s\S]*?\}", @"
if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '新密码长度不能少于6个字符'
        });
      }
"@

# 保存修复后的内容
Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ authController.js 修复完成！" -ForegroundColor Green
