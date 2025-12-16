// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance per process
// Next.js will reuse this instance across requests
// Worker will create its own instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // MEMORY FIX: Limit connection pool to prevent memory leaks
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// MEMORY FIX: Ensure proper cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

