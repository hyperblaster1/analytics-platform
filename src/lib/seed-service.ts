// src/lib/seed-service.ts
import { prisma } from '@/lib/db';
import { DEFAULT_SEEDS } from '@/config/seeds';

export async function ensureDefaultSeeds() {
  for (const seed of DEFAULT_SEEDS) {
    await prisma.seed.upsert({
      where: { baseUrl: seed.baseUrl },
      update: { name: seed.name, enabled: true },
      create: {
        name: seed.name,
        baseUrl: seed.baseUrl,
        enabled: true,
      },
    });
  }

  return prisma.seed.findMany({ where: { enabled: true } });
}

