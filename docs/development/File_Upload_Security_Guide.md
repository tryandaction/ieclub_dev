# 文件上传安全指南

**更新日期**: 2025-11-02  
**版本**: v1.0.0

---

## 📋 概述

本文档详细说明了 IEClub 后端文件上传的安全措施和最佳实践。

---

## 🛡️ 安全措施

### 1. 文件类型验证

#### 多层验证机制

**第一层：MIME 类型验证**
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new AppError('FILE_TYPE_ERROR', '不支持的文件类型');
}
```

**第二层：文件扩展名验证**
```javascript
const ext = path.extname(file.originalname).toLowerCase();
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
if (!allowedExtensions.includes(ext)) {
  throw new AppError('FILE_EXTENSION_ERROR', '不支持的文件扩展名');
}
```

**第三层：文件魔数（Magic Number）验证**
```javascript
const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]   // GIF89a
  ],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]]  // %PDF
};

async function validateFileSignature(buffer, mimeType) {
  const signatures = FILE_SIGNATURES[mimeType];
  const fileHeader = Array.from(buffer.slice(0, 8));
  
  return signatures.some(signature => {
    return signature.every((byte, index) => fileHeader[index] === byte);
  });
}
```

**第四层：图片格式验证（使用 Sharp）**
```javascript
try {
  const imageInfo = await sharp(file.buffer).metadata();
  // 如果不是有效图片，sharp 会抛出错误
} catch (error) {
  throw new AppError('INVALID_IMAGE_FORMAT', '无效的图片格式');
}
```

---

### 2. 文件大小限制

```javascript
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB（图片）
    files: 10,                   // 最多10个文件
    fields: 20,                  // 最多20个字段
    parts: 30                    // 最多30个部分
  }
});

// 文档限制
const maxDocumentSize = 20 * 1024 * 1024;  // 20MB
```

---

### 3. 文件名安全

#### 危险字符过滤

```javascript
// 检查危险字符
const dangerousChars = /[<>:"|?*\x00-\x1f]/;
if (dangerousChars.test(file.originalname)) {
  throw new AppError('INVALID_FILENAME', '文件名包含非法字符');
}

// 生成安全文件名
function generateSafeFilename(originalName, extension) {
  const safeName = originalName
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // 只保留安全字符
    .substring(0, 50);                 // 限制长度
  
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}-${randomId}-${safeName}${extension}`;
}
```

---

### 4. 路径遍历防护

```javascript
/**
 * 验证文件路径（防止路径遍历攻击）
 */
function validateFilePath(filePath, baseDir) {
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);
  
  // 确保解析后的路径在基础目录内
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new AppError('SECURITY_ERROR', '非法的文件路径');
  }
  
  return resolvedPath;
}

// 使用示例
const filePath = validateFilePath(
  path.join(uploadDir, userProvidedFilename),
  uploadDir
);
```

**攻击示例**:
```javascript
// ❌ 危险：可能导致路径遍历
const filename = '../../../etc/passwd';
const filePath = path.join(uploadDir, filename);
// 结果：/etc/passwd

// ✅ 安全：经过验证
const filePath = validateFilePath(
  path.join(uploadDir, filename),
  uploadDir
);
// 抛出错误：非法的文件路径
```

---

### 5. 图片处理安全

#### 移除 EXIF 数据

```javascript
// EXIF 数据可能包含敏感信息（GPS 位置、设备信息等）
const processedBuffer = await sharp(file.buffer)
  .rotate()  // 根据 EXIF 自动旋转
  .withMetadata({
    exif: {},              // 移除 EXIF 数据
    icc: imageInfo.icc     // 保留颜色配置
  })
  .jpeg({ quality: 90, mozjpeg: true })
  .toBuffer();
```

#### 图片尺寸限制

```javascript
// 验证图片尺寸（防止 DoS 攻击）
const maxWidth = 10000;
const maxHeight = 10000;

if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
  throw new AppError('IMAGE_TOO_LARGE', `图片尺寸过大，最大${maxWidth}x${maxHeight}`);
}
```

#### 重新编码图片

```javascript
// 重新编码图片（移除潜在的恶意代码）
const processedBuffer = await sharp(file.buffer)
  .jpeg({ quality: 90, mozjpeg: true })
  .toBuffer();

// 不直接保存原始文件，而是保存处理后的文件
await fs.writeFile(filePath, processedBuffer);
```

---

### 6. 文件哈希和去重

```javascript
// 计算文件哈希（用于去重和完整性验证）
const fileHash = crypto
  .createHash('sha256')
  .update(file.buffer)
  .digest('hex');

// 检查是否已存在相同文件
const existingFile = await prisma.file.findUnique({
  where: { hash: fileHash }
});

if (existingFile) {
  return {
    url: existingFile.url,
    message: '文件已存在，使用已有文件'
  };
}
```

---

### 7. 病毒扫描（可选）

```javascript
// 使用 ClamAV 进行病毒扫描
const NodeClam = require('clamscan');

const clamscan = await new NodeClam().init({
  clamdscan: {
    host: 'localhost',
    port: 3310
  }
});

const { isInfected, viruses } = await clamscan.scanBuffer(file.buffer);

if (isInfected) {
  logger.warn('检测到病毒:', { filename: file.originalname, viruses });
  throw new AppError('VIRUS_DETECTED', '文件包含病毒');
}
```

---

## 🔐 权限控制

### 1. 上传权限

```javascript
// 只有认证用户可以上传
router.post('/upload/images', 
  authenticate,  // 认证中间件
  csrf,          // CSRF 保护
  upload.array('images', 9), 
  uploadController.uploadImages
);
```

### 2. 删除权限

```javascript
// 只能删除自己上传的文件
async deleteFile(req, res) {
  const { fileUrl } = req.body;
  const userId = req.user.id;

  // 查询文件所有者
  const file = await prisma.file.findFirst({
    where: { url: fileUrl }
  });

  if (!file) {
    throw new AppError('FILE_NOT_FOUND', '文件不存在');
  }

  // 权限检查
  if (file.uploaderId !== userId && req.user.role !== 'admin') {
    throw new AppError('FORBIDDEN', '无权删除此文件');
  }

  // 删除文件
  await LocalUploadService.deleteFile(fileUrl, userId);
}
```

### 3. 访问权限

```javascript
// 配置静态文件服务（限制访问）
app.use('/uploads', (req, res, next) => {
  // 可以添加访问控制逻辑
  // 例如：检查用户是否有权访问该文件
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));
```

---

## 📊 支持的文件类型

### 图片

| 格式 | MIME 类型 | 扩展名 | 最大大小 | 魔数 |
|------|-----------|--------|----------|------|
| JPEG | image/jpeg | .jpg, .jpeg | 5MB | FF D8 FF |
| PNG | image/png | .png | 5MB | 89 50 4E 47 |
| GIF | image/gif | .gif | 5MB | 47 49 46 38 |
| WebP | image/webp | .webp | 5MB | 52 49 46 46 |

### 文档

| 格式 | MIME 类型 | 扩展名 | 最大大小 |
|------|-----------|--------|----------|
| PDF | application/pdf | .pdf | 20MB |
| Word | application/msword | .doc | 20MB |
| Word (新) | application/vnd.openxmlformats-officedocument.wordprocessingml.document | .docx | 20MB |
| PowerPoint | application/vnd.ms-powerpoint | .ppt | 20MB |
| PowerPoint (新) | application/vnd.openxmlformats-officedocument.presentationml.presentation | .pptx | 20MB |
| Excel | application/vnd.ms-excel | .xls | 20MB |
| Excel (新) | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | .xlsx | 20MB |

---

## 🚨 常见攻击和防护

### 1. 文件类型伪造

**攻击**: 修改文件扩展名或 MIME 类型上传恶意文件

**防护**:
- ✅ 验证文件魔数（文件头）
- ✅ 使用 Sharp 验证图片格式
- ✅ 重新编码文件

### 2. 路径遍历攻击

**攻击**: 使用 `../` 等路径遍历文件系统

**示例**:
```
filename: ../../../../etc/passwd
```

**防护**:
- ✅ 使用 `path.resolve()` 解析路径
- ✅ 验证解析后的路径在允许的目录内
- ✅ 生成随机文件名，不使用用户提供的文件名

### 3. 文件名注入

**攻击**: 在文件名中注入特殊字符或命令

**示例**:
```
filename: test.jpg; rm -rf /
filename: <script>alert('XSS')</script>.jpg
```

**防护**:
- ✅ 过滤危险字符
- ✅ 限制文件名长度
- ✅ 生成安全的文件名

### 4. DoS 攻击

**攻击**: 上传超大文件或大量文件消耗服务器资源

**防护**:
- ✅ 限制文件大小
- ✅ 限制文件数量
- ✅ 限制图片尺寸
- ✅ 使用速率限制

### 5. 恶意图片攻击

**攻击**: 上传包含恶意代码的图片（如 ImageTragick 漏洞）

**防护**:
- ✅ 使用最新版本的 Sharp
- ✅ 重新编码图片
- ✅ 移除 EXIF 数据
- ✅ 限制图片尺寸

### 6. EXIF 数据泄露

**风险**: EXIF 数据可能包含敏感信息

**示例**:
- GPS 坐标（拍摄位置）
- 设备信息（相机型号）
- 拍摄时间
- 作者信息

**防护**:
- ✅ 移除所有 EXIF 数据
- ✅ 只保留必要的颜色配置（ICC）

---

## 📝 最佳实践

### 1. 文件存储

✅ **推荐**:
```javascript
// 使用随机生成的文件名
const filename = `${Date.now()}-${crypto.randomUUID()}.jpg`;

// 按日期组织目录
const dateDir = new Date().toISOString().split('T')[0];  // 2025-11-02
const filePath = path.join(uploadDir, dateDir, filename);
```

❌ **不推荐**:
```javascript
// 直接使用用户提供的文件名
const filePath = path.join(uploadDir, file.originalname);
```

### 2. 文件处理

✅ **推荐**:
```javascript
// 使用内存存储 + 处理后保存
const storage = multer.memoryStorage();

// 处理文件
const processedBuffer = await sharp(file.buffer)
  .resize(1920, 1920, { fit: 'inside' })
  .jpeg({ quality: 90 })
  .toBuffer();

await fs.writeFile(filePath, processedBuffer);
```

❌ **不推荐**:
```javascript
// 直接保存原始文件
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, file.originalname)
});
```

### 3. 错误处理

✅ **推荐**:
```javascript
try {
  await uploadFile(file);
} catch (error) {
  logger.error('文件上传失败:', { 
    filename: file.originalname,
    error: error.message,
    userId: req.user.id
  });
  
  // 返回友好的错误消息
  throw new AppError('UPLOAD_FAILED', '文件上传失败，请重试');
}
```

### 4. 日志记录

```javascript
logger.info('文件上传成功:', {
  userId: req.user.id,
  filename: file.originalname,
  size: file.size,
  mimetype: file.mimetype,
  hash: fileHash,
  url: fileUrl
});
```

---

## 🔍 安全审计清单

上传文件时检查：
- [ ] 是否验证了文件类型（MIME + 扩展名 + 魔数）？
- [ ] 是否限制了文件大小？
- [ ] 是否验证了文件名安全性？
- [ ] 是否防止了路径遍历攻击？
- [ ] 是否重新编码了图片？
- [ ] 是否移除了 EXIF 数据？
- [ ] 是否限制了图片尺寸？
- [ ] 是否计算了文件哈希？
- [ ] 是否记录了上传日志？
- [ ] 是否实施了权限控制？
- [ ] 是否添加了 CSRF 保护？
- [ ] 是否实施了速率限制？

---

## 📚 相关资源

### OWASP 指南
- [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)

### 工具和库
- [Sharp](https://sharp.pixelplumbing.com/) - 图片处理
- [Multer](https://github.com/expressjs/multer) - 文件上传
- [ClamAV](https://www.clamav.net/) - 病毒扫描

---

## 🎉 总结

通过实施以上安全措施，IEClub 的文件上传功能已经具备：

✅ **多层验证**:
- MIME 类型验证
- 文件扩展名验证
- 文件魔数验证
- 图片格式验证

✅ **安全处理**:
- 路径遍历防护
- 文件名安全化
- 图片重新编码
- EXIF 数据移除

✅ **资源限制**:
- 文件大小限制
- 文件数量限制
- 图片尺寸限制

✅ **权限控制**:
- 认证要求
- CSRF 保护
- 所有权验证

✅ **监控和审计**:
- 详细日志记录
- 文件哈希计算
- 错误追踪

---

**文件上传安全，保护用户数据！** 🛡️✨

