import { PrismaClient } from '@prisma/client'

// 全局单例模式
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 创建 Prisma 客户端
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// 导出 Prisma 客户端实例
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 运行时检查数据库连接
export async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL 环境变量未设置，请在 Vercel 中配置环境变量')
  }
  
  try {
    await prisma.$connect()
    return true
  } catch (error) {
    console.error('数据库连接失败:', error)
    throw new Error('数据库连接失败，请检查 DATABASE_URL 配置')
  }
}
