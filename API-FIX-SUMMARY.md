# API 500 错误修复总结

## 问题描述
API 路由返回 500 错误：
- `/api/nodes` - 500 Internal Server Error
- `/api/edges` - 500 Internal Server Error

## 根本原因
Next.js 配置文件 `next.config.js` 中设置了全局 Edge Runtime：
```javascript
experimental: {
  runtime: 'edge',
}
```

这导致所有 API 路由默认使用 Edge Runtime，而标准的 Prisma Client 不支持 Edge Runtime。

## 解决方案

### 1. 移除全局 Edge Runtime 配置
修改 `next.config.js`，移除 `experimental.runtime` 配置。

### 2. 为所有 API 路由添加 Node.js Runtime 声明
在每个 API 路由文件中添加：
```typescript
export const runtime = 'nodejs'
```

修改的文件：
- `app/api/nodes/route.ts`
- `app/api/edges/route.ts`
- `app/api/nodes/[id]/route.ts`
- `app/api/edges/[id]/route.ts`
- `app/api/documents/route.ts`
- `app/api/search/route.ts`
- `app/api/stats/route.ts`
- `app/api/nodes/[id]/neighbors/route.ts`

### 3. 清除构建缓存
删除 `.next` 文件夹并重新启动开发服务器。

## 验证结果
✅ `/api/nodes` - 返回 200 OK，成功获取 7 个节点
✅ `/api/edges` - 返回 200 OK，成功获取关系数据

## 关于生产部署
当前配置使用 Node.js Runtime，适合开发环境。

如果需要部署到 Cloudflare Pages（Edge Runtime），需要：
1. 使用 Prisma Driver Adapters（`@prisma/adapter-neon` + `@neondatabase/serverless`）
2. 配置 API 路由使用 `export const runtime = 'edge'`
3. 修改 `lib/db.ts` 使用 Neon adapter

参考文档：
- https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare
- https://neon.tech/docs/serverless/serverless-driver
