import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@perokio/db';

@Injectable()
export class FactsService {
  async create(data: {
    brandId: string;
    tier: string;
    language: string;
    topic?: string;
    cpmBudget: number; // cents
    baseFee: number; // cents
    maxClaims?: number;
  }) {
    const fact = await prisma.fact.create({
      data: {
        brandId: data.brandId,
        tier: data.tier,
        language: data.language,
        topic: data.topic || null,
        status: 'draft',
        cpmBudget: data.cpmBudget,
        baseFee: data.baseFee,
        maxClaims: data.maxClaims || 10,
      },
      include: { scriptVersions: true },
    });

    // Create the first (draft) script version
    await prisma.scriptVersion.create({
      data: {
        factId: fact.id,
        version: 1,
        status: 'draft',
      },
    });

    return this.findById(fact.id);
  }

  async findById(id: string) {
    const fact = await prisma.fact.findUnique({
      where: { id },
      include: {
        scriptVersions: {
          include: {
            lines: { include: { sources: { include: { source: true } } } },
            receipts: true,
          },
          orderBy: { version: 'desc' },
        },
      },
    });
    if (!fact) throw new NotFoundException(`Fact ${id} not found`);
    return fact;
  }

  async list(filter?: { brandId?: string; status?: string }) {
    return prisma.fact.findMany({
      where: filter,
      include: {
        scriptVersions: { select: { id: true, version: true, status: true }, orderBy: { version: 'desc' }, take: 1 },
        _count: { select: { claims: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
