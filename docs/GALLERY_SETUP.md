# 首页广场环境配置指南

## 目录

1. [开发环境设置](#开发环境设置)
2. [生产环境配置](#生产环境配置)
3. [环境变量](#环境变量)
4. [API 端点配置](#api-端点配置)
5. [性能优化](#性能优化)
6. [故障排除](#故障排除)

---

## 开发环境设置

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 yarn >= 3.0.0
- Git

### 安装步骤

1. **克隆仓库**
```bash
git clone <repository-url>
cd 3d-knowledge-graph
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

4. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 开发工具

- **代码编辑器**: VS Code 推荐
- **浏览器**: Chrome/Firefox 最新版本
- **调试工具**: React DevTools, Redux DevTools

---

## 生产环境配置

### 构建应用

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

---

## 环境变量

### 开发环境 (.env.local)

```env
# API 配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/gallery

# 认证
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 第三方服务
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 生产环境 (.env.production)

```env
# API 配置
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# 数据库
DATABASE_URL=postgresql://user:password@prod-db:5432/gallery

# 认证
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://example.com

# 第三方服务
NEXT_PUBLIC_ANALYTICS_ID=your-production-analytics-id

# 性能
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_LOG_LEVEL=error
```

### 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | API 基础 URL | `https://api.example.com` |
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://...` |
| `NEXTAUTH_SECRET` | 认证密钥 | 随机字符串 |
| `NEXTAUTH_URL` | 应用 URL | `https://example.com` |
| `NEXT_PUBLIC_ANALYTICS_ID` | 分析 ID | `UA-123456789-1` |

---

## API 端点配置

### 开发环境

```typescript
// lib/config/api.ts
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
}
```

### 生产环境

```typescript
// lib/config/api.ts
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  timeout: 30000,
  retryCount: 5,
  retryDelay: 2000,
}
```

### API 端点列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/gallery/graphs` | GET | 获取图谱列表 |
| `/api/gallery/search` | GET | 搜索图谱 |
| `/api/gallery/notifications` | GET | 获取通知 |
| `/api/gallery/notifications` | POST | 标记通知 |

---

## 性能优化

### 1. 缓存策略

**SWR 配置**:
```typescript
// lib/config/swr.ts
export const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,      // 60 秒
  focusThrottleInterval: 300000, // 5 分钟
  errorRetryCount: 3,
  errorRetryInterval: 5000,
}
```

### 2. 图片优化

```typescript
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src={thumbnail}
  alt={title}
  width={280}
  height={200}
  priority={false}
  loading="lazy"
/>
```

### 3. 代码分割

```typescript
// 动态导入组件
import dynamic from 'next/dynamic'

const GalleryGrid = dynamic(() => import('@/components/gallery/GalleryGrid'), {
  loading: () => <div>加载中...</div>,
})
```

### 4. 数据库查询优化

```typescript
// 使用索引
CREATE INDEX idx_graphs_created_at ON graphs(created_at DESC)
CREATE INDEX idx_graphs_type ON graphs(type)
CREATE INDEX idx_graphs_creator_id ON graphs(creator_id)
```

### 5. CDN 配置

```typescript
// 使用 CDN 加速静态资源
const CDN_URL = 'https://cdn.example.com'

export const getImageUrl = (path: string) => {
  return `${CDN_URL}${path}`
}
```

---

## 监控和日志

### 应用监控

```typescript
// lib/monitoring/index.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### 日志记录

```typescript
// lib/logger/index.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
}
```

---

## 故障排除

### 问题 1: API 连接失败

**症状**: 页面显示"加载失败"

**解决方案**:
1. 检查 `NEXT_PUBLIC_API_BASE_URL` 环境变量
2. 验证 API 服务器是否运行
3. 检查网络连接
4. 查看浏览器控制台错误

### 问题 2: 性能缓慢

**症状**: 页面加载时间长

**解决方案**:
1. 启用 SWR 缓存
2. 使用 CDN 加速静态资源
3. 优化数据库查询
4. 启用 Gzip 压缩

### 问题 3: 内存泄漏

**症状**: 应用运行时间长后变慢

**解决方案**:
1. 检查事件监听器是否正确清理
2. 使用 React DevTools Profiler 分析
3. 检查 SWR 缓存大小
4. 使用内存分析工具

### 问题 4: 样式不一致

**症状**: 不同浏览器显示不同

**解决方案**:
1. 清除浏览器缓存
2. 检查 CSS 兼容性
3. 使用 PostCSS 自动前缀
4. 测试所有主流浏览器

---

## 安全配置

### 1. CORS 配置

```typescript
// app/api/middleware.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

### 2. 认证

```typescript
// lib/auth/index.ts
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
}

export const getAuthToken = () => {
  return localStorage.getItem('authToken')
}
```

### 3. 速率限制

```typescript
// app/api/middleware.ts
import rateLimit from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 个请求
})
```

---

## 备份和恢复

### 数据库备份

```bash
# PostgreSQL 备份
pg_dump -U user -h localhost gallery > backup.sql

# 恢复
psql -U user -h localhost gallery < backup.sql
```

### 配置备份

```bash
# 备份环境变量
cp .env.production .env.production.backup

# 备份数据库
npm run db:backup
```

---

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2024-02-11 | 初始版本 |

