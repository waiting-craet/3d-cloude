# 🖼️ 横幅图片添加指南

## 快速开始

你可以通过修改 `lib/config/banner.ts` 文件来更改首页顶部的横幅图片。

## 方法 1: 使用在线 URL（最简单）

如果你的图片已经上传到网络上（如 Imgur、阿里云 OSS、七牛云等），直接使用 URL：

```typescript
// lib/config/banner.ts
export const BANNER_IMAGE_URL = 'https://your-image-url.com/banner.png'
```

**优点：**
- 最简单，无需上传文件
- 支持 CDN 加速
- 可以随时更换 URL

## 方法 2: 使用本地文件

1. 将你的图片放到 `public/images/` 目录
2. 修改配置文件：

```typescript
// lib/config/banner.ts
export const BANNER_IMAGE_URL = '/images/banner.png'
```

**注意：** 确保文件名正确，支持的格式有：PNG、JPG、WebP 等

## 方法 3: 使用 Base64 编码（适合小图片）

如果你的图片很小（< 100KB），可以转换为 Base64：

### 步骤 1: 转换图片为 Base64

**在线工具：**
- https://www.base64-image.de/
- https://www.freeconvert.com/image-to-base64

**或使用命令行（Windows PowerShell）：**
```powershell
$imageFile = "C:\path\to\your\image.png"
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($imageFile))
Write-Host "data:image/png;base64,$base64"
```

### 步骤 2: 更新配置文件

```typescript
// lib/config/banner.ts
export const BANNER_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
```

## 方法 4: 使用 Vercel Blob（推荐用于生产环境）

如果你的项目部署在 Vercel 上，可以使用 Vercel Blob 存储：

1. 在 Vercel 项目中配置 Blob 存储
2. 上传图片获得 URL
3. 在配置文件中使用该 URL

## 图片要求

| 属性 | 要求 |
|------|------|
| 宽度 | 推荐 1920px 或更大 |
| 高度 | 推荐 320px 或更大 |
| 宽高比 | 6:1 或接近 |
| 文件大小 | < 500KB（推荐） |
| 格式 | PNG、JPG、WebP 等 |

## 当前配置

当前首页使用的是一个在线示例图片：
```
https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=1920&h=320&fit=crop
```

## 修改步骤

1. 打开 `lib/config/banner.ts` 文件
2. 修改 `BANNER_IMAGE_URL` 的值
3. 保存文件
4. 刷新浏览器（Ctrl+F5 清除缓存）

## 示例

### 示例 1: 使用你上传的图片 URL
```typescript
export const BANNER_IMAGE_URL = 'https://cdn.example.com/my-banner.png'
```

### 示例 2: 使用本地文件
```typescript
export const BANNER_IMAGE_URL = '/images/my-banner.jpg'
```

### 示例 3: 使用 Base64
```typescript
export const BANNER_IMAGE_URL = 'data:image/png;base64,iVBORw0KGgo...'
```

## 故障排除

**Q: 图片仍然没有显示？**
A: 
- 检查 URL 是否正确
- 确保图片文件存在
- 清除浏览器缓存（Ctrl+Shift+Delete）
- 检查浏览器控制台是否有错误信息

**Q: 图片显示不完整？**
A: 
- 调整图片尺寸
- 确保宽高比接近 6:1

**Q: 如何快速测试不同的图片？**
A: 
- 使用在线 URL 最快
- 可以快速切换不同的 URL 测试效果

## 需要帮助？

如果你有任何问题，可以：
1. 检查浏览器开发者工具（F12）的 Network 标签
2. 查看 Console 标签中的错误信息
3. 确保文件路径和 URL 正确
