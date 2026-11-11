/**
 * Frontend Integration Seed — creates demo users + brand + fact + approved script
 * so the frontend can log in and see real data.
 */
import { prisma } from './index';

async function main() {
  console.log('🌱 Seeding frontend integration data...');

  // 1. Demo brand owner
  const brandOwner = await prisma.user.upsert({
    where: { email: 'owner@perokio.demo' },
    update: {},
    create: {
      email: 'owner@perokio.demo',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MQDqKvRJZ.QFmqjZgPgZgZQZQZQZQZ', // "demo1234"
      role: 'brand_owner',
    },
  });

  // Fix the password hash (the above is a placeholder — use the real bcrypt hash)
  const bcrypt = require('bcryptjs');
  const realHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.update({
    where: { id: brandOwner.id },
    data: { passwordHash: realHash },
  });

  let brand = await prisma.brand.findFirst({ where: { name: 'Café Dar Zaitouna' } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: 'Café Dar Zaitouna',
        ownerId: brandOwner.id,
        autoApproveOnReviewExpiry: false,
      },
    });
  } else {
    brand = await prisma.brand.update({
      where: { id: brand.id },
      data: { ownerId: brandOwner.id },
    });
  }

  // 2. BrandContext (B4.5)
  await prisma.brandContext.upsert({
    where: { brandId: brand.id },
    update: {},
    create: {
      brandId: brand.id,
      industry: 'Café & Hospitality',
      targetAudience: 'Tunisian coffee lovers, 25-44',
      brandVoice: 'warm, authoritative, playful',
      guidelines: 'Do: mention origin, altitude. Don\'t: use medical claims.',
    },
  });

  // 3. Demo creator
  const creatorUser = await prisma.user.upsert({
    where: { email: 'amira@perokio.demo' },
    update: {},
    create: {
      email: 'amira@perokio.demo',
      passwordHash: realHash,
      role: 'creator',
    },
  });
  const creator = await prisma.creator.upsert({
    where: { userId: creatorUser.id },
    update: {},
    create: {
      userId: creatorUser.id,
      reliabilityScore: 92,
      level: 'Rising',
    },
  });

  // 4. Demo QA reviewer
  const qaUser = await prisma.user.upsert({
    where: { email: 'qa@perokio.demo' },
    update: {},
    create: {
      email: 'qa@perokio.demo',
      passwordHash: realHash,
      role: 'qa_reviewer',
    },
  });

  // 5. Studio editor
  const studioUser = await prisma.user.upsert({
    where: { email: 'studio@perokio.demo' },
    update: {},
    create: {
      email: 'studio@perokio.demo',
      passwordHash: realHash,
      role: 'studio_editor',
    },
  });

  // 6. Create a fact with rawClaim + verifiedSources
  const fact = await prisma.fact.create({
    data: {
      brandId: brand.id,
      tier: 'Hot',
      language: 'en',
      topic: 'Coffee origin',
      status: 'live',
      cpmBudget: 300,
      baseFee: 800,
      maxClaims: 10,
      rawClaim: 'Dar Zaitouna arabica beans come from Cap Bon, grown above 600m altitude',
      verifiedSources: [
        { id: 'src_capbon_report', url: 'https://capbon.tn/arabica-2024.pdf', label: 'Cap Bon Agricultural Report 2024', type: 'official' },
        { id: 'src_altitude_survey', url: 'https://geo.tn/altitude-survey', label: 'Tunisian Geographic Survey', type: 'research' },
      ],
    },
  });

  // 7. Create an approved script version with verified lines
  const sv = await prisma.scriptVersion.create({
    data: { factId: fact.id, version: 1, status: 'approved' },
  });

  const source1 = await prisma.source.create({
    data: { id: 'src_capbon_report', label: 'Cap Bon Agricultural Report 2024', url: 'https://capbon.tn/arabica-2024.pdf', type: 'official', verifiedBy: qaUser.id },
  });
  const source2 = await prisma.source.create({
    data: { id: 'src_altitude_survey', label: 'Tunisian Geographic Survey', url: 'https://geo.tn/altitude-survey', type: 'research', verifiedBy: qaUser.id },
  });

  const line1 = await prisma.scriptLine.create({
    data: { scriptVersionId: sv.id, position: 0, text: 'Dar Zaitouna arabica beans come from Cap Bon', isHook: true, durationSec: 5, verified: true },
  });
  const line2 = await prisma.scriptLine.create({
    data: { scriptVersionId: sv.id, position: 1, text: 'Grown above 600m altitude', isHook: false, durationSec: 4, verified: true },
  });
  const line3 = await prisma.scriptLine.create({
    data: { scriptVersionId: sv.id, position: 2, text: 'Roasted in Tunis since 1987', isHook: false, durationSec: 6, verified: true },
  });

  await prisma.scriptLineSource.create({ data: { scriptLineId: line1.id, sourceId: source1.id } });
  await prisma.scriptLineSource.create({ data: { scriptLineId: line2.id, sourceId: source2.id } });
  await prisma.scriptLineSource.create({ data: { scriptLineId: line3.id, sourceId: source1.id } });

  // 8. Create a verification receipt
  const crypto = require('crypto');
  const canonical = JSON.stringify({ scriptVersionId: sv.id, reviewerId: qaUser.id, approvedAt: new Date().toISOString() });
  const hash = crypto.createHash('sha256').update(canonical).digest('hex');
  await prisma.verificationReceipt.create({
    data: { scriptVersionId: sv.id, hash, reviewerId: qaUser.id },
  });

  // 9. Create a second fact (in QA — not yet approved) for the Script Review screen
  const fact2 = await prisma.fact.create({
    data: {
      brandId: brand.id,
      tier: 'Standard',
      language: 'en',
      topic: 'Olive oil exports',
      status: 'in_qa',
      cpmBudget: 300,
      baseFee: 1000,
      maxClaims: 10,
      rawClaim: 'Tunisia olive oil exports grew 32% in 2024',
      verifiedSources: [
        { id: 'src_olive_stats', url: 'https://stats.tn/olive-2024.pdf', label: 'Tunisian Olive Oil Statistics 2024', type: 'official' },
      ],
    },
  });
  const sv2 = await prisma.scriptVersion.create({ data: { factId: fact2.id, version: 1, status: 'in_qa' } });
  // Lines are NOT verified (this is what the QA reviewer sees)
  await prisma.scriptLine.createMany({
    data: [
      { scriptVersionId: sv2.id, position: 0, text: 'Tunisia olive oil exports grew 32% in 2024', isHook: true, durationSec: 5, verified: false },
      { scriptVersionId: sv2.id, position: 1, text: 'Overtaking Morocco and Greece', isHook: false, durationSec: 4, verified: false },
      { scriptVersionId: sv2.id, position: 2, text: 'Follow for more facts', isHook: false, durationSec: 3, verified: false },
    ],
  });

  // 10. Create a HarnessConfig + simulate passed eval + activate
  const config = await prisma.harnessConfig.create({
    data: {
      name: 'frontend-demo-v1',
      modelMap: { draft: 'claude-3.5-sonnet', check: 'gpt-4o-mini' },
      budgetCap: 50000,
      isActive: true,
    },
  });
  await prisma.generationRun.create({
    data: { configId: config.id, status: 'eval_passed', isEval: true, evalPassed: true, costUsd: 0.015, tokensUsed: 1500, endedAt: new Date() },
  });

  // 11. Create ledger accounts + initial top-up ($1000 = 100000 cents)
  const stripeAccount = await prisma.ledgerAccount.create({
    data: { ownerId: 'platform', type: 'stripe_pending', currency: 'USD' },
  });
  const escrowAccount = await prisma.ledgerAccount.create({
    data: { ownerId: brand.id, type: 'brand_escrow', currency: 'USD', brandId: brand.id },
  });
  await prisma.ledgerEntry.createMany({
    data: [
      { accountId: escrowAccount.id, debit: 100000, credit: 0, refType: 'stripe_topup', refId: 'seed_topup', idempotencyKey: 'stripe_topup:seed_topup:debit' },
      { accountId: stripeAccount.id, debit: 0, credit: 100000, refType: 'stripe_topup', refId: 'seed_topup', idempotencyKey: 'stripe_topup:seed_topup:credit' },
    ],
  });

  console.log('\n✓ Frontend seed complete:');
  console.log('  Brand Owner: owner@perokio.demo / demo1234');
  console.log('  Creator:     amira@perokio.demo / demo1234');
  console.log('  QA:          qa@perokio.demo / demo1234');
  console.log('  Studio:      studio@perokio.demo / demo1234');
  console.log(`  Brand: ${brand.id} (Café Dar Zaitouna)`);
  console.log(`  Fact 1 (live): ${fact.id} — ${fact.rawClaim?.substring(0, 50)}...`);
  console.log(`  Fact 2 (in_qa): ${fact2.id} — ${fact2.rawClaim?.substring(0, 50)}...`);
  console.log(`  Approved ScriptVersion: ${sv.id}`);
  console.log(`  HarnessConfig (active): ${config.id}`);
  console.log(`  Brand escrow: $1000.00`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
