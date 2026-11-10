/**
 * Seed script — creates a brand owner, brand, creator, fact, and source
 * so the B11 gate + claim/lock flow can be tested end-to-end.
 */
import { prisma, Role } from './index';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a brand owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@darzitouna.tn',
      passwordHash: '$2a$10$placeholder', // Use /auth/signup in production
      role: Role.brand_owner,
    },
  });

  // 2. Create a brand
  const brand = await prisma.brand.create({
    data: {
      name: 'Café Dar Zaitouna',
      ownerId: owner.id,
      autoApproveOnReviewExpiry: false,
    },
  });

  // 3. Create a creator
  const creatorUser = await prisma.user.create({
    data: {
      email: 'amira@perokio.tn',
      passwordHash: '$2a$10$placeholder',
      role: Role.creator,
    },
  });
  const creator = await prisma.creator.create({
    data: { userId: creatorUser.id },
  });

  // 4. Create a fact
  const fact = await prisma.fact.create({
    data: {
      brandId: brand.id,
      tier: 'Hot',
      language: 'derja',
      topic: 'Coffee origin',
      status: 'live',
      cpmBudget: 300,  // $3.00 per 1000 views (cents)
      baseFee: 800,    // $8.00 (cents)
      maxClaims: 10,
    },
  });

  // 5. Create a script version
  const scriptVersion = await prisma.scriptVersion.create({
    data: {
      factId: fact.id,
      version: 1,
      status: 'draft',
    },
  });

  // 6. Create script lines (all start unverified)
  await prisma.scriptLine.createMany({
    data: [
      { scriptVersionId: scriptVersion.id, position: 0, text: 'Dar Zaitouna arabica beans come from Cap Bon', isHook: true, durationSec: 5 },
      { scriptVersionId: scriptVersion.id, position: 1, text: 'Grown above 600m altitude', durationSec: 4 },
      { scriptVersionId: scriptVersion.id, position: 2, text: 'Roasted in Tunis since 1987', durationSec: 6 },
    ],
  });

  // 7. Create sources
  const source1 = await prisma.source.create({
    data: {
      label: 'Cap Bon Agricultural Cooperative Report 2024',
      url: 'https://capbon.tn/arabica-report-2024.pdf',
      type: 'official',
      verifiedBy: owner.id,
    },
  });
  const source2 = await prisma.source.create({
    data: {
      label: 'Tunisian Coffee Authority Registry',
      url: 'https://coffee.gov.tn/registry/1987',
      type: 'official',
      verifiedBy: owner.id,
    },
  });

  console.log('✓ Seed complete:', { owner: owner.id, brand: brand.id, creator: creator.id, fact: fact.id, scriptVersion: scriptVersion.id, source1: source1.id, source2: source2.id });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
