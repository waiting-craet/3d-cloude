import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL 环境变量未设置')
  }

  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

// 全局单例模式
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
