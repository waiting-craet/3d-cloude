import { PrismaClient } from '@prisma/client'

// 全局单例模式
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 创建 Prisma 客户端（延迟初始化）
function createPrismaClient() {
  // 在构建时，DATABASE_URL 可能不存在，这是正常的
  // 只在运行时才需要数据库连接
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL 环境变量未设置，Prisma 客户端将在运行时初始化')
    // 返回一个占位客户端，避免构建时报错
    return new PrismaClient({
      log: ['error', 'warn'],
    })
  }

  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// 导出 Prisma 客户端实例
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
