import { PrismaClient } from './generated/prisma'

// Singleton pattern — prevents exhausting connection pool in dev (HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Re-export all Prisma types for convenience
export * from './generated/prisma'
