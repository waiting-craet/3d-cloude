import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma client with connection timeout and pool settings for Neon databases
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Add connection lifecycle tracking for diagnostics
if (process.env.NODE_ENV === 'development') {
  console.log('[Prisma] Client initialized with connection logging enabled')
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
