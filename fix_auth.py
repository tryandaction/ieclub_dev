#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""快速修复authController中的验证问题"""

import re

file_path = "ieclub-backend/src/controllers/authController.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复 login 方法中的 validateRequired
content = re.sub(
    r'(\s+)//\s*使用验证工具\s+const validation = validateRequired\(req\.body, \[\'email\', \'password\'\]\);[\s\S]*?}\s*}\s*}',
    r'\1// 验证必填字段\n\1if (!email || !password) {\n\1  return res.status(400).json({\n\1    success: false,\n\1    message: \'邮箱和密码不能为空\'\n\1  });\n\1}',
    content,
    count=1
)

# 2. 修复 register 方法
# 先删除错误的validatePassword调用（对验证码）
content = re.sub(
    r'const codeValidation = validatePassword\(verifyCodeStr\);[\s\S]*?}\s*}\s*}[\s\S]*?stored = await',
    'stored = await',
    content
)

# 修复register中的validateRequired  
content = re.sub(
    r'//\s*使用验证工具\s*-\s*必填字段\s+const validation = validateRequired\(req\.body, \[\'email\', \'password\', \{ field: \'verifyCode\', altField: \'code\' \}\]\);[\s\S]*?}\s*}\s*}',
    '// 验证必填字段\n      if (!email || !password || !verifyCode) {\n        return res.status(400).json({\n          success: false,\n          message: \'邮箱、密码和验证码不能为空\'\n        });\n      }',
    content
)

# 修复register中的validatePassword（对password）
content = re.sub(
    r'//\s*验证密码强度\s+const passwordCheck = validatePassword\(password\);[\s\S]*?}\s*}\s*}',
    '// 简单验证密码长度\n      if (password.length < 6) {\n        return res.status(400).json({\n          success: false,\n          message: \'密码长度不能少于6个字符\'\n        });\n      }',
    content
)

# 3. 修复 forgotPassword 方法
content = re.sub(
    r'//\s*验证必填字段\s+const validation = validateRequired\(req\.body, \[\'email\'\]\);[\s\S]*?}\s*}\s*}',
    '// 验证必填字段\n      if (!email) {\n        return res.status(400).json({\n          success: false,\n          message: \'邮箱地址不能为空\'\n        });\n      }',
    content
)

# 4. 修复 resetPassword 方法中的validateRequired
content = re.sub(
    r'//\s*参数验证\s+const validation = validateRequired\(req\.body, \[\'newPassword\'\]\);[\s\S]*?}\s*}\s*}',
    '// 参数验证\n      if (!newPassword) {\n        return res.status(400).json({\n          success: false,\n          message: \'新密码不能为空\'\n        });\n      }',
    content
)

# 修复 resetPassword 中的validatePassword
content = re.sub(
    r'//\s*验证密码强度\s+const passwordCheck = validatePassword\(newPassword\);[\s\S]*?}\s*}\s*}',
    '// 简单验证密码长度\n      if (newPassword.length < 6) {\n        return res.status(400).json({\n          success: false,\n          message: \'新密码长度不能少于6个字符\'\n        });\n      }',
    content
)

# 删除 resetPassword 中对验证码的validatePassword调用
content = re.sub(
    r'//\s*校验验证码格式\s+const codeValidation = validatePassword\(code\);[\s\S]*?}\s*}\s*}[\s\S]*?//\s*验证邮箱格式',
    '// 验证邮箱格式',
    content
)

# 5. 修复 loginWithCode 方法
content = re.sub(
    r'//\s*验证必填字段\s+const validation = validateRequired\(req\.body, \[\'email\', \{ field: \'code\', altField: \'verifyCode\' \}\]\);[\s\S]*?}\s*}\s*}',
    '// 验证必填字段\n      if (!email || !code) {\n        return res.status(400).json({\n          success: false,\n          message: \'邮箱和验证码不能为空\'\n        });\n      }',
    content
)

# 删除 loginWithCode 中对验证码的validatePassword调用
content = re.sub(
    r'//\s*校验验证码格式\s+const codeValidation = validatePassword\(code\);[\s\S]*?}\s*}\s*}[\s\S]*?//\s*验证验证码',
    '// 验证验证码',
    content
)

# 6. 修复 changePassword 方法
content = re.sub(
    r'//\s*使用验证工具\s+const validation = validateRequired\(req\.body, \[\'oldPassword\', \'newPassword\'\]\);[\s\S]*?}\s*}\s*}',
    '// 验证必填字段\n      if (!oldPassword || !newPassword) {\n        return res.status(400).json({\n          success: false,\n          message: \'旧密码和新密码不能为空\'\n        });\n      }',
    content
)

# 修复 changePassword 中的validatePassword
content = re.sub(
    r'//\s*验证新密码强度\s+const passwordCheck = validatePassword\(newPassword\);[\s\S]*?}\s*}\s*}',
    '// 简单验证密码长度\n      if (newPassword.length < 6) {\n        return res.status(400).json({\n          success: false,\n          message: \'新密码长度不能少于6个字符\'\n        });\n      }',
    content
)

# 保存修复后的文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ authController.js 修复完成！")
